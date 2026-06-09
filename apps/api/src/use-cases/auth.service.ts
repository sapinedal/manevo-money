import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RegisterDto, LoginDto } from '../presentation/dtos/auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Este correo electrónico ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
        },
      });

      // 2. Create Default Workspace
      const workspaceSlug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-workspace-${Date.now().toString().slice(-4)}`;
      const workspace = await tx.workspace.create({
        data: {
          name: `${dto.name}'s Workspace`,
          slug: workspaceSlug,
        },
      });

      // 3. Create Workspace Member (OWNER)
      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: Role.OWNER,
        },
      });

      // 4. Create Default Categories for this Workspace
      const defaultCategories = [
        { name: 'Alimentación', icon: 'utensils', color: 'hsl(142, 70%, 45%)' },
        { name: 'Transporte', icon: 'car', color: 'hsl(217, 91%, 60%)' },
        { name: 'Vivienda', icon: 'home', color: 'hsl(25, 95%, 53%)' },
        { name: 'Entretenimiento', icon: 'film', color: 'hsl(280, 87%, 65%)' },
        { name: 'Salud', icon: 'heart', color: 'hsl(350, 89%, 60%)' },
        { name: 'Educación', icon: 'book', color: 'hsl(45, 93%, 47%)' },
        { name: 'Ingresos', icon: 'trending-up', color: 'hsl(120, 100%, 25%)' },
      ];

      await tx.category.createMany({
        data: defaultCategories.map(cat => ({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          workspaceId: workspace.id,
          isSystem: false,
        })),
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        defaultWorkspaceId: workspace.id,
      };
    });

    const tokenPayload = { id: result.id, email: result.email, name: result.name };
    const token = await this.jwtService.signAsync(tokenPayload, {
      secret: process.env.JWT_SECRET || 'fallback-secret-key-12345',
      expiresIn: '7d',
    });

    const userWithMemberships = await this.me(result.id);

    return {
      token,
      user: userWithMemberships,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          take: 1,
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload = { id: user.id, email: user.email, name: user.name };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'fallback-secret-key-12345',
      expiresIn: '7d',
    });

    const userWithMemberships = await this.me(user.id);

    return {
      token,
      user: userWithMemberships,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return user;
  }
}
