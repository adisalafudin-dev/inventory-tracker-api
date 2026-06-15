// src/platforms/platforms.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Platforms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(ZodValidationPipe)
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Get()
  @ApiOperation({ summary: 'List semua platform' })
  findAll() {
    return this.platformsService.findAll();
  }

  @Roles('ADMIN') // Hanya admin yang bisa tambah platform baru
  @Post()
  @ApiOperation({ summary: 'Tambah platform baru (Tokopedia, Shopee, dst)' })
  create(@Body() dto: CreatePlatformDto) {
    return this.platformsService.create(dto);
  }

  @Roles('ADMIN') // Hanya admin yang bisa aktifkan/nonaktifkan platform
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Aktifkan / nonaktifkan platform' })
  toggle(@Param('id') id: string) {
    return this.platformsService.toggleActive(id);
  }
}
