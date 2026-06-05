// src/platforms/platforms.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlatformDto } from './dto/create-platform.dto';

@Injectable()
export class PlatformsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.platform.findMany({ orderBy: { name: 'asc' } });
  }

  async findOneOrFail(id: string) {
    const platform = await this.prisma.platform.findUnique({ where: { id } });
    if (!platform) {
      throw new NotFoundException(`Platform dengan ID "${id}" tidak ditemukan`);
    }
    return platform;
  }

  async create(dto: CreatePlatformDto) {
    const existing = await this.prisma.platform.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Platform "${dto.name}" sudah ada`);
    }
    return this.prisma.platform.create({ data: dto });
  }

  // Toggle aktif/nonaktif platform
  async toggleActive(id: string) {
    const platform = await this.findOneOrFail(id);
    return this.prisma.platform.update({
      where: { id },
      data: { isActive: !platform.isActive },
    });
  }
}
