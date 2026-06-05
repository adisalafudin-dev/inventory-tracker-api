import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Buat kategori baru' })
  @ApiResponse({ status: 201, description: 'Kategori berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Validasi gagal' })
  @ApiResponse({ status: 409, description: 'Nama kategori sudah digunakan' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua kategori beserta jumlah produknya' })
  @ApiResponse({ status: 200, description: 'Daftar kategori berhasil diambil' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ubah data kategori' })
  @ApiResponse({ status: 201, description: 'Kategori berhasil update' })
  @ApiResponse({ status: 400, description: 'Validasi gagal' })
  @ApiResponse({ status: 409, description: 'Nama kategori sudah digunakan' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus data kategori' })
  @ApiResponse({ status: 201, description: 'Kategori berhasil di hapus' })
  @ApiResponse({ status: 400, description: 'Validasi gagal' })
  @ApiResponse({ status: 409, description: 'Nama kategori tidak ditemukan' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
