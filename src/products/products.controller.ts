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

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(ZodValidationPipe)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Ambil semua produk dengan filter' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Cari by nama atau SKU',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({ name: 'lowStock', required: false, enum: ['true', 'false'] })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail satu produk' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat produk baru' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sebagian field produk' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

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
