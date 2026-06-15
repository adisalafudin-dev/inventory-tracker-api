// src/products/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { Role } from 'generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(ZodValidationPipe)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // src/products/products.controller.ts — update endpoint findAll
  @Get()
  @ApiOperation({ summary: 'List produk dengan filter dan pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'lowStock', required: false, enum: ['true', 'false'] })
  findAll(@Query() query: QueryProductDto & PaginationDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail satu produk' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles(Role.ADMIN) // Hanya admin yang bisa buat order baru
  @Post()
  @ApiOperation({ summary: 'Buat produk baru' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles(Role.ADMIN) // Hanya admin yang bisa buat order baru
  @Patch(':id')
  @ApiOperation({ summary: 'Update sebagian field produk' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles(Role.ADMIN) // Hanya admin yang bisa buat order baru
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Nonaktifkan produk (soft delete)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ── STOCK ADJUSTMENT ───────────────────────────────────────────────────────
  @Patch(':id/stock')
  @ApiOperation({ summary: 'Tambah atau kurangi stok produk' })
  @ApiParam({ name: 'id', description: 'CUID produk' })
  @ApiResponse({ status: 200, description: 'Stok berhasil diperbarui' })
  @ApiResponse({ status: 400, description: 'Stok tidak cukup' })
  adjustStock(
    @Param('id') id: string,
    @Body() dto: StockAdjustmentDto,
    @GetUser('id') userId: string, // ambil ID admin yang melakukan adjustment
  ) {
    return this.productsService.adjustStock(id, dto, userId);
  }
}
