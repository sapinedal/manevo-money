import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';

describe('FinanceService', () => {
  let service: FinanceService;
  let prisma: PrismaService;

  const mockAccount = {
    id: 'account-123',
    name: 'Banco Principal',
    balance: 1000.0,
    currency: 'USD',
    workspaceId: 'workspace-123',
  };

  const mockTxClient = {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockTxClient)),
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should successfully register a transaction and associate the creator ID', async () => {
      // Arrange
      const workspaceId = 'workspace-123';
      const userId = 'user-abc';
      const dto = {
        amount: 250,
        type: TransactionType.EXPENSE,
        description: 'Almuerzo de negocios',
        date: new Date().toISOString(),
        accountId: 'account-123',
      };

      mockTxClient.account.findUnique.mockResolvedValue(mockAccount);
      mockTxClient.account.update.mockResolvedValue({
        ...mockAccount,
        balance: 750,
      });
      mockTxClient.transaction.create.mockResolvedValue({
        id: 'tx-new',
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        date: new Date(dto.date),
        workspaceId,
        accountId: dto.accountId,
        createdById: userId,
        creator: {
          id: userId,
          name: 'Samuel Pineda',
          email: 'samuel@example.com',
        },
      });

      // Act
      const result = await service.createTransaction(workspaceId, userId, dto);

      // Assert
      expect(mockTxClient.account.findUnique).toHaveBeenCalledWith({
        where: { id: dto.accountId, workspaceId },
      });
      expect(mockTxClient.account.update).toHaveBeenCalledWith({
        where: { id: dto.accountId },
        data: { balance: { decrement: dto.amount } },
      });
      expect(mockTxClient.transaction.create).toHaveBeenCalledWith({
        data: {
          amount: dto.amount,
          type: dto.type,
          description: dto.description,
          date: expect.any(Date),
          workspaceId,
          accountId: dto.accountId,
          toAccountId: undefined,
          categoryId: undefined,
          createdById: userId,
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
            },
          },
        },
      });
      expect(result).toBeDefined();
      expect(result.createdById).toBe(userId);
      expect(result.creator?.id).toBe(userId);
    });

    it('should throw NotFoundException if origin account is not found', async () => {
      // Arrange
      const workspaceId = 'workspace-123';
      const userId = 'user-abc';
      const dto = {
        amount: 100,
        type: TransactionType.INCOME,
        description: 'Depósito incorrecto',
        date: new Date().toISOString(),
        accountId: 'non-existing-account',
      };

      mockTxClient.account.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createTransaction(workspaceId, userId, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactions', () => {
    it('should retrieve a list of transactions with creator details', async () => {
      // Arrange
      const workspaceId = 'workspace-123';
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 500,
          type: TransactionType.INCOME,
          description: 'Pago de Factura',
          date: new Date(),
          workspaceId,
          accountId: 'account-123',
          createdById: 'user-abc',
          creator: {
            id: 'user-abc',
            name: 'Samuel Pineda',
            email: 'samuel@example.com',
          },
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      // Act
      const result = await service.getTransactions(workspaceId);

      // Assert
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        orderBy: { id: 'desc' },
        take: 50,
        skip: 0,
        include: {
          account: true,
          toAccount: true,
          category: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].creator?.id).toBe('user-abc');
    });
  });
});
