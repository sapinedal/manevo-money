import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreateAccountDto, CreateTransactionDto, CreateCategoryDto } from '../presentation/dtos/finance.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // --- ACCOUNTS ---

  async createAccount(workspaceId: string, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance || 0,
        currency: dto.currency || 'USD',
        workspaceId,
      },
    });
  }

  async getAccounts(workspaceId: string) {
    return this.prisma.account.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async updateAccount(workspaceId: string, id: string, dto: any) {
    const existing = await this.prisma.account.findFirst({
      where: { id, workspaceId }
    });
    if (!existing) {
      throw new NotFoundException('Cuenta no encontrada.');
    }
    return this.prisma.account.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        balance: dto.balance !== undefined ? Number(dto.balance) : undefined,
        currency: dto.currency,
      }
    });
  }

  async deleteAccount(workspaceId: string, id: string) {
    const existing = await this.prisma.account.findFirst({
      where: { id, workspaceId }
    });
    if (!existing) {
      throw new NotFoundException('Cuenta no encontrada.');
    }
    // Delete any transactions related to this account first
    await this.prisma.transaction.deleteMany({
      where: {
        OR: [
          { accountId: id },
          { toAccountId: id }
        ]
      }
    });
    return this.prisma.account.delete({
      where: { id }
    });
  }

  // --- CATEGORIES ---

  async createCategory(workspaceId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: {
        name: dto.name,
        workspaceId,
      },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una categoría con este nombre.');
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        workspaceId,
      },
    });
  }

  async getCategories(workspaceId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { workspaceId },
          { isSystem: true },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateCategory(workspaceId: string, id: string, dto: { name: string; icon?: string; color?: string }) {
    const category = await this.prisma.category.findUnique({
      where: { id }
    });
    if (!category) {
      throw new BadRequestException('La categoría no existe.');
    }
    if (category.isSystem) {
      throw new BadRequestException('No puedes modificar categorías del sistema.');
    }
    if (category.workspaceId !== workspaceId) {
      throw new BadRequestException('No tienes permiso para modificar esta categoría.');
    }

    if (dto.name && dto.name.trim() !== category.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          name: dto.name.trim(),
          workspaceId,
        }
      });
      if (existing) {
        throw new BadRequestException('Ya existe otra categoría con este nombre.');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        icon: dto.icon,
        color: dto.color,
      }
    });
  }

  async deleteCategory(workspaceId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id }
    });
    if (!category) {
      throw new BadRequestException('La categoría no existe.');
    }
    if (category.isSystem) {
      throw new BadRequestException('No puedes eliminar categorías del sistema.');
    }
    if (category.workspaceId !== workspaceId) {
      throw new BadRequestException('No tienes permiso para eliminar esta categoría.');
    }

    await this.prisma.transaction.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    });

    return this.prisma.category.delete({
      where: { id }
    });
  }

  // --- TRANSACTIONS ---

  async createTransaction(workspaceId: string, createdById: string | undefined, dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate main account
      const account = await tx.account.findUnique({
        where: { id: dto.accountId, workspaceId },
      });

      if (!account) {
        throw new NotFoundException('Cuenta origen no encontrada.');
      }

      // 2. Validate destination account if transfer
      let toAccount: any = null;
      if (dto.type === TransactionType.TRANSFER) {
        if (!dto.toAccountId) {
          throw new BadRequestException('Se requiere una cuenta de destino para transferencias.');
        }
        toAccount = await tx.account.findUnique({
          where: { id: dto.toAccountId, workspaceId },
        });
        if (!toAccount) {
          throw new NotFoundException('Cuenta destino no encontrada.');
        }
      }

      // 3. Update account balances
      if (dto.type === TransactionType.INCOME) {
        await tx.account.update({
          where: { id: account.id },
          data: { balance: { increment: dto.amount } },
        });
      } else if (dto.type === TransactionType.EXPENSE) {
        await tx.account.update({
          where: { id: account.id },
          data: { balance: { decrement: dto.amount } },
        });
      } else if (dto.type === TransactionType.TRANSFER && toAccount) {
        // Decrease source
        await tx.account.update({
          where: { id: account.id },
          data: { balance: { decrement: dto.amount } },
        });
        // Increase target
        await tx.account.update({
          where: { id: toAccount.id },
          data: { balance: { increment: dto.amount } },
        });
      }

      // 4. Create Transaction record
      return tx.transaction.create({
        data: {
          amount: dto.amount,
          type: dto.type,
          description: dto.description,
          date: new Date(dto.date),
          workspaceId,
          accountId: dto.accountId,
          toAccountId: dto.toAccountId,
          categoryId: dto.categoryId,
          createdById,
        },
        include: {
          account: true,
          toAccount: true,
          category: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
      });
    });
  }

  async getTransactions(workspaceId: string, limit = 50, offset = 0) {
    return this.prisma.transaction.findMany({
      where: { workspaceId },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      include: {
        account: true,
        toAccount: true,
        category: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });
  }

  async updateTransaction(
    workspaceId: string,
    id: string,
    dto: { description?: string; categoryId?: string; date?: string },
  ) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      throw new NotFoundException('Movimiento no encontrado.');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        description: dto.description !== undefined ? dto.description.trim() : undefined,
        categoryId: dto.categoryId !== undefined ? (dto.categoryId || null) : undefined,
        date: dto.date !== undefined ? new Date(dto.date) : undefined,
      },
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
    });
  }

  async deleteTransaction(workspaceId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      throw new NotFoundException('Movimiento no encontrado.');
    }

    // Reverse balance effect on accounts
    await this.prisma.$transaction(async (tx) => {
      if (existing.type === TransactionType.INCOME) {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { decrement: existing.amount } },
        });
      } else if (existing.type === TransactionType.EXPENSE) {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: existing.amount } },
        });
      } else if (existing.type === TransactionType.TRANSFER) {
        // Increase source
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: existing.amount } },
        });
        // Decrease target if exists
        if (existing.toAccountId) {
          await tx.account.update({
            where: { id: existing.toAccountId },
            data: { balance: { decrement: existing.amount } },
          });
        }
      }

      // Delete the transaction
      await tx.transaction.delete({
        where: { id },
      });
    });

    return { success: true };
  }

  // --- DASHBOARD METRICS ---

  async getDashboardMetrics(workspaceId: string) {
    // 1. Total Net Balance
    const accounts = await this.prisma.account.findMany({
      where: { workspaceId },
    });
    const netBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    // 2. Monthly Income / Expenses
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const monthlyTransactions = await this.prisma.transaction.findMany({
      where: {
        workspaceId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    let income = 0;
    let expenses = 0;

    for (const tx of monthlyTransactions) {
      if (tx.type === TransactionType.INCOME) {
        income += Number(tx.amount);
      } else if (tx.type === TransactionType.EXPENSE) {
        expenses += Number(tx.amount);
      }
    }

    // 3. Category Breakdown for current month
    const categoryBreakdown: Record<string, { name: string; amount: number; color: string }> = {};

    for (const tx of monthlyTransactions) {
      if (tx.type === TransactionType.EXPENSE && tx.categoryId) {
        const cat = await this.prisma.category.findUnique({ where: { id: tx.categoryId } });
        if (cat) {
          if (!categoryBreakdown[cat.id]) {
            categoryBreakdown[cat.id] = {
              name: cat.name,
              amount: 0,
              color: cat.color || 'hsl(0, 0%, 50%)',
            };
          }
          categoryBreakdown[cat.id].amount += Number(tx.amount);
        }
      }
    }

    return {
      netBalance,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      categoryBreakdown: Object.values(categoryBreakdown),
      accountsSummary: accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance, type: a.type })),
    };
  }

  async renameWorkspace(workspaceId: string, name: string) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  }

  async onboardParse(workspaceId: string, text: string) {
    // Delete any existing accounts in the workspace to allow editing/re-submitting during onboarding
    await this.prisma.account.deleteMany({
      where: { workspaceId }
    });

    const accounts: { name: string; balance: number; type: any }[] = [];
    
    // Normalize text
    let normalized = text.toLowerCase()
      .replace(/[\$,]/g, '') // remove currency signs and commas
      .replace(/y\s+/g, ' '); // replace 'y' with space for easier splitting

    // Pre-process "X mil" or "X k" to multiply by 1000
    normalized = normalized.replace(/\b(\d+(?:\.\d+)?)\s*(?:mil\b|k\b)/g, (match, p1) => {
      return (parseFloat(p1) * 1000).toString();
    });
      
    // Match any numbers in the text
    const numberMatches = [...normalized.matchAll(/\b\d+(?:\.\d+)?\b/g)];
    
    const cashKeywords = ['efectivo', 'cash', 'cartera', 'bolsillo', 'monedero', 'mano'];
    const bankKeywords = ['banco', 'cuenta', 'ahorros', 'corriente', 'bank', 'nomina'];
    const cardKeywords = ['tarjeta', 'credito', 'débito', 'debito', 'nequi', 'daviplata'];

    for (const match of numberMatches) {
      const value = parseFloat(match[0]);
      const index = match.index || 0;
      
      const start = Math.max(0, index - 35);
      const end = Math.min(normalized.length, index + match[0].length + 35);
      const context = normalized.substring(start, end);
      
      let type = 'BANK';
      let name = 'Cuenta de Banco';
      
      if (cashKeywords.some(kw => context.includes(kw))) {
        type = 'CASH';
        name = 'Efectivo';
      } else if (cardKeywords.some(kw => context.includes(kw))) {
        type = 'CREDIT_CARD';
        name = 'Tarjeta';
      } else if (bankKeywords.some(kw => context.includes(kw))) {
        type = 'BANK';
        name = 'Cuenta Bancaria';
      } else {
        type = 'BANK';
        name = 'Banco';
      }
      
      const suffix = accounts.filter(a => a.type === type).length;
      const accountName = suffix > 0 ? `${name} ${suffix + 1}` : name;
      
      accounts.push({
        name: accountName,
        balance: value,
        type
      });
    }

    if (accounts.length === 0) {
      accounts.push({
        name: 'Efectivo',
        balance: 0,
        type: 'CASH'
      });
    }

    const created: any[] = [];
    for (const acc of accounts) {
      const res = await this.prisma.account.create({
        data: {
          name: acc.name,
          balance: acc.balance,
          type: acc.type,
          currency: 'USD',
          workspaceId,
        }
      });

      if (acc.balance > 0) {
        await this.prisma.transaction.create({
          data: {
            amount: acc.balance,
            type: 'INCOME',
            description: 'Saldo inicial',
            date: new Date(),
            workspaceId,
            accountId: res.id,
          }
        });
      }

      created.push(res);
    }
    
    return created;
  }
}
