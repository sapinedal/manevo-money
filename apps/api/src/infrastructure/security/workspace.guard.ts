import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Appended by JwtAuthGuard
    
    // Resolve workspace id from URL params, query string, or header
    const workspaceId = 
      request.params.workspaceId || 
      request.query.workspaceId || 
      request.headers['x-workspace-id'];

    if (!user) {
      throw new ForbiddenException('Missing user authentication.');
    }

    if (!workspaceId) {
      throw new ForbiddenException('Missing workspace context parameter.');
    }

    // Resolve user membership in the workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id || user.sub, // supports standard JWT user payloads
          workspaceId: workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied: You do not belong to this workspace.');
    }

    // Store membership details inside the request for controllers to consume
    request.workspaceMember = membership;

    // Resolve role annotations
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Simple membership is enough
    }

    const hasRole = requiredRoles.includes(membership.role);
    if (!hasRole) {
      throw new ForbiddenException('Access denied: Insufficient privileges inside this workspace.');
    }

    return true;
  }
}
