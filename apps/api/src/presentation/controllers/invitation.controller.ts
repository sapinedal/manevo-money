import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { InvitationService } from '../../use-cases/invitation.service';
import { JwtAuthGuard } from '../../infrastructure/security/jwt.guard';

@Controller('invitations')
export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  // Public route to inspect invitation details
  @Get(':token')
  async getInvitationDetails(@Param('token') token: string) {
    return this.invitationService.getInvitationDetails(token);
  }

  // Authenticated route to accept the invitation
  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(@Param('token') token: string, @Req() req: any) {
    const userId = req.user.id;
    const userEmail = req.user.email;
    return this.invitationService.acceptInvitation(token, userId, userEmail);
  }

  // Authenticated route to decline the invitation
  @Post(':token/decline')
  @UseGuards(JwtAuthGuard)
  async declineInvitation(@Param('token') token: string, @Req() req: any) {
    const userId = req.user.id;
    return this.invitationService.declineInvitation(token, userId);
  }
}
