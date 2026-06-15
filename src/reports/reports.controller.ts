// src/reports/reports.controller.ts
import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { Role } from 'generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Ringkasan dashboard bulan ini (live)' })
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Produk yang stoknya di bawah threshold' })
  @ApiResponse({ status: 200, description: 'Daftar produk low stock' })
  getLowStock() {
    return this.reportsService.getLowStockProducts();
  }

  @Roles(Role.ADMIN) // Hanya admin yang bisa buat order baru
  @Post('monthly/generate')
  @ApiOperation({ summary: 'Generate atau refresh laporan bulanan' })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'month', required: true, example: 5 })
  generateMonthly(@Query('year') year: string, @Query('month') month: string) {
    // Query params selalu string — convert ke number
    return this.reportsService.generateMonthlyReport(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('monthly')
  @ApiOperation({ summary: 'List semua laporan bulanan yang sudah digenerate' })
  getMonthlyReports() {
    return this.reportsService.getMonthlyReports();
  }
}
