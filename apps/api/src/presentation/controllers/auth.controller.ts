import { Controller, Post, Get, Body, Res, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../../use-cases/auth.service';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import { JwtAuthGuard } from '../../infrastructure/security/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(dto);
    
    response.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result.user;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    
    response.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token');
    return { message: 'Sesión cerrada exitosamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: any) {
    const userId = request.user.id;
    return this.authService.me(userId);
  }
}
