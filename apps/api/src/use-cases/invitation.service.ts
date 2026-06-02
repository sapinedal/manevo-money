import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreateInvitationDto } from '../presentation/dtos/invitations.dto';
import { InvitationStatus, Role } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class InvitationService {
  constructor(private prisma: PrismaService) {}

  // Generate an invitation link
  async createInvitation(workspaceId: string, invitedById: string, dto: CreateInvitationDto) {
    // 1. Verify workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('El espacio de trabajo no existe.');
    }

    // 2. Verify inviter is an owner or admin of the workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitedById,
          workspaceId,
        },
      },
    });

    if (!member || (member.role !== Role.OWNER && member.role !== Role.ADMIN)) {
      throw new ForbiddenException('No tienes permisos para invitar usuarios a este espacio.');
    }

    // 3. Check if user is already a member
    const existingMember = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          where: { workspaceId }
        }
      }
    });

    if (existingMember && existingMember.memberships.length > 0) {
      throw new BadRequestException('El usuario ya es miembro de este espacio de trabajo.');
    }

    // 4. Generate random secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // 5. Create invitation (delete any previous pending invitation for the same email and workspace to keep it clean)
    await this.prisma.workspaceInvitation.deleteMany({
      where: {
        workspaceId,
        email: dto.email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
    });

    return this.prisma.workspaceInvitation.create({
      data: {
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        expiresAt,
        workspaceId,
        invitedById,
        status: InvitationStatus.PENDING,
      },
      include: {
        workspace: {
          select: { name: true }
        }
      }
    });
  }

  // Get invitation details (public)
  async getInvitationDetails(token: string) {
    const invite = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { name: true }
        },
        invitedBy: {
          select: { name: true, email: true }
        }
      }
    });

    if (!invite) {
      throw new NotFoundException('Invitación no encontrada.');
    }

    if (invite.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Esta invitación ya ha sido ${invite.status === InvitationStatus.ACCEPTED ? 'aceptada' : 'rechazada'}.`);
    }

    if (new Date() > invite.expiresAt) {
      // Update status to EXPIRED
      await this.prisma.workspaceInvitation.update({
        where: { id: invite.id },
        data: { status: InvitationStatus.EXPIRED }
      });
      throw new BadRequestException('Esta invitación ha expirado.');
    }

    return invite;
  }

  // Accept invitation
  async acceptInvitation(token: string, userId: string, userEmail: string) {
    const invite = await this.getInvitationDetails(token);

    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException(`Esta invitación fue enviada a ${invite.email}, pero iniciaste sesión como ${userEmail}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Check if member already exists
      const existingMember = await tx.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: invite.workspaceId,
          },
        },
      });

      let membership;
      if (!existingMember) {
        // 2. Create WorkspaceMember
        membership = await tx.workspaceMember.create({
          data: {
            userId,
            workspaceId: invite.workspaceId,
            role: invite.role,
          },
          include: {
            workspace: true,
          }
        });
      } else {
        membership = existingMember;
      }

      // 3. Update invitation status
      await tx.workspaceInvitation.update({
        where: { id: invite.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          inviteeId: userId,
        },
      });

      return membership;
    });
  }

  // Decline invitation
  async declineInvitation(token: string, userId: string) {
    const invite = await this.getInvitationDetails(token);

    return this.prisma.workspaceInvitation.update({
      where: { id: invite.id },
      data: {
        status: InvitationStatus.REJECTED,
        inviteeId: userId,
      },
    });
  }

  // List all invitations of a workspace
  async listWorkspaceInvitations(workspaceId: string, userId: string) {
    // Verify member permissions
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!member || (member.role !== Role.OWNER && member.role !== Role.ADMIN)) {
      throw new ForbiddenException('No tienes permisos para ver las invitaciones de este espacio.');
    }

    return this.prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: {
          select: { name: true, email: true }
        }
      }
    });
  }

  // Revoke / Delete invitation
  async revokeInvitation(workspaceId: string, id: string, userId: string) {
    // Verify member permissions
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!member || (member.role !== Role.OWNER && member.role !== Role.ADMIN)) {
      throw new ForbiddenException('No tienes permisos para revocar invitaciones.');
    }

    return this.prisma.workspaceInvitation.delete({
      where: { id, workspaceId },
    });
  }
}
