import { Controller, Get, Post, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { FinanceService } from '../../use-cases/finance.service';
import { InvitationService } from '../../use-cases/invitation.service';
import { CreateAccountDto, CreateTransactionDto, CreateCategoryDto } from '../dtos/finance.dto';
import { CreateInvitationDto } from '../dtos/invitations.dto';
import { JwtAuthGuard } from '../../infrastructure/security/jwt.guard';
import { WorkspaceGuard } from '../../infrastructure/security/workspace.guard';

@Controller('workspaces/:workspaceId')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class FinanceController {
  constructor(
    private financeService: FinanceService,
    private invitationService: InvitationService,
  ) {}

  @Get('dashboard-metrics')
  async getDashboardMetrics(@Param('workspaceId') workspaceId: string) {
    return this.financeService.getDashboardMetrics(workspaceId);
  }

  @Get('accounts')
  async getAccounts(@Param('workspaceId') workspaceId: string) {
    return this.financeService.getAccounts(workspaceId);
  }

  @Post('accounts')
  async createAccount(@Param('workspaceId') workspaceId: string, @Body() dto: CreateAccountDto) {
    return this.financeService.createAccount(workspaceId, dto);
  }

  @Post('accounts/:id')
  async updateAccount(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: any
  ) {
    return this.financeService.updateAccount(workspaceId, id, dto);
  }

  @Post('accounts/:id/delete')
  async deleteAccount(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.financeService.deleteAccount(workspaceId, id);
  }

  @Get('categories')
  async getCategories(@Param('workspaceId') workspaceId: string) {
    return this.financeService.getCategories(workspaceId);
  }

  @Post('categories')
  async createCategory(@Param('workspaceId') workspaceId: string, @Body() dto: CreateCategoryDto) {
    return this.financeService.createCategory(workspaceId, dto);
  }

  @Post('categories/:id')
  async updateCategory(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: any
  ) {
    return this.financeService.updateCategory(workspaceId, id, dto);
  }

  @Post('categories/:id/delete')
  async deleteCategory(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.financeService.deleteCategory(workspaceId, id);
  }

  @Get('transactions')
  async getTransactions(
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.financeService.getTransactions(
      workspaceId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Post('transactions')
  async createTransaction(
    @Param('workspaceId') workspaceId: string,
    @Req() req: any,
    @Body() dto: CreateTransactionDto,
  ) {
    const userId = req.user?.id;
    return this.financeService.createTransaction(workspaceId, userId, dto);
  }

  @Post('transactions/:id')
  async updateTransaction(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.financeService.updateTransaction(workspaceId, id, dto);
  }

  @Post('transactions/:id/delete')
  async deleteTransaction(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteTransaction(workspaceId, id);
  }

  @Post('rename')
  async renameWorkspace(@Param('workspaceId') workspaceId: string, @Body() body: { name: string }) {
    return this.financeService.renameWorkspace(workspaceId, body.name);
  }

  @Post('onboard-parse')
  async onboardParse(@Param('workspaceId') workspaceId: string, @Body() body: { text: string }) {
    return this.financeService.onboardParse(workspaceId, body.text);
  }

  // Workspace Sharing & Invitations
  @Post('invitations')
  async createInvitation(
    @Param('workspaceId') workspaceId: string,
    @Req() req: any,
    @Body() dto: CreateInvitationDto,
  ) {
    const userId = req.user.id;
    return this.invitationService.createInvitation(workspaceId, userId, dto);
  }

  @Get('invitations')
  async listInvitations(
    @Param('workspaceId') workspaceId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.invitationService.listWorkspaceInvitations(workspaceId, userId);
  }

  @Post('invitations/:id/delete')
  async revokeInvitation(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.invitationService.revokeInvitation(workspaceId, id, userId);
  }
}
