import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoriesService } from 'src/categories/categories.service';
import { QueryProductDto } from './dto/query-product.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
  ) {}

  async findOneOrFail(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${id}" tidak ditemukan`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new ConflictException(
        `SKU "${createProductDto.sku}" sudah digunakan`,
      );
    }

    if (createProductDto.categoryId) {
      await this.categoriesService.findOneOrFail(createProductDto.categoryId);
    }

    return this.prisma.product.create({
      data: {
        sku: createProductDto.sku,
        name: createProductDto.name,
        description: createProductDto.description,
        imageUrl: createProductDto.imageUrl,
        costPrice: createProductDto.costPrice,
        sellPrice: createProductDto.sellPrice,
        stock: createProductDto.stock,
        lowStockAt: createProductDto.lowStockAt,
        categoryId: createProductDto.categoryId,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: QueryProductDto) {
    const { search, category, lowStock, isActive } = query;

    return this.prisma.product.findMany({
      where: {
        // Filter 1: isActive (default true)
        isActive,

        ...(category && { categoryId: category }),
        ...(lowStock && {
          stock: {
            lte: this.prisma.product.fields.lowStockAt,
          },
        }),
        ...(search && {
          OR: [
            {
              name: { contains: search, mode: 'insensitive' },
            },
            {
              sku: { contains: search, mode: 'insensitive' },
            },
          ],
        }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.findOneOrFail(id);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOneOrFail(id);

    if (updateProductDto.sku) {
      const skuConflict = await this.prisma.product.findFirst({
        where: {
          sku: updateProductDto.sku,
          NOT: { id },
        },
      });

      if (skuConflict) {
        throw new ConflictException(
          `SKU "${updateProductDto.sku}" sudah digunakan`,
        );
      }
    }

    if (updateProductDto.categoryId) {
      await this.categoriesService.findOneOrFail(updateProductDto.categoryId);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOneOrFail(id);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  }

  async adjustStock(id: string, dto: StockAdjustmentDto, userId?: string) {
    const product = await this.findOneOrFail(id);

    const newStock = product.stock + dto.quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Stok tidak cukup. Stok saat ini: ${product.stock}, pengurangan: ${Math.abs(dto.quantity)}`,
      );
    }

    const [updatedProduct, movement] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id },
        data: { stock: newStock },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
        },
      }),

      this.prisma.stockMovement.create({
        data: {
          productId: id,
          quantity: dto.quantity,
          type: dto.type,
          reason: dto.reason,
          userId: userId ?? null,
        },
      }),
    ]);

    return {
      product: updatedProduct,
      movement,
      isLowStock: newStock <= product.lowStockAt,
    };
  }
}
