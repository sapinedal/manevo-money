import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './infrastructure/database/prisma.service';
import { AuthService } from './use-cases/auth.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { FinanceService } from './use-cases/finance.service';
import { FinanceController } from './presentation/controllers/finance.controller';
import { InvitationService } from './use-cases/invitation.service';
import { InvitationController } from './presentation/controllers/invitation.controller';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'fallback-secret-key-12345',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, FinanceController, InvitationController],
  providers: [PrismaService, AuthService, FinanceService, InvitationService],
})
export class AppModule {}
