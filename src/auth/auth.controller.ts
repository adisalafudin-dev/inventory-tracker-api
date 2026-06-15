// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { UsePipes } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { UseGuards } from '@nestjs/common';
import { Role, type User } from 'generated/prisma/client';
import { Roles } from './decorators/roles.decorator';

@ApiTags('Auth')
@UsePipes(ZodValidationPipe)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // 👇 Pakai throttle "auth": max 5x per 60 detik
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Daftar akun baru' })
  @Roles(Role.ADMIN)
  @ApiResponse({ status: 429, description: 'Terlalu banyak percobaan' })
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('X-Custom-Message', 'Akun berhasil dibuat!');
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // 👇 Login paling ketat — max 5x per 60 detik
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login dengan email dan password' })
  @ApiResponse({ status: 429, description: 'Terlalu banyak percobaan' })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('X-Custom-Message', 'Login berhasil');
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil saya' })
  getMe(@GetUser() user: User) {
    return user;
  }
}
