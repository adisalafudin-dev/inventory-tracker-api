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
import { Prisma } from 'generated/prisma/browser';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import {
  getPaginationParams,
  paginate,
} from 'src/common/pagination/paginate.helper';

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

  async findAll(query: QueryProductDto & PaginationDto) {
    const { search, category, lowStock, isActive, page, limit } = query;

    const where: Prisma.ProductWhereInput = {
      isActive,
      ...(category && { categoryId: category }),
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
    };

    if (lowStock) {
      const lowStockRows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM   products
        WHERE  stock <= "lowStockAt"
        AND    "isActive" = ${isActive}
      `;

      const lowStockIds = lowStockRows.map((row) => row.id);

      if (lowStockIds.length === 0) return [];

      where.id = { in: lowStockIds };
    }

    const { skip, take } = getPaginationParams(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: where,
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.product.count({ where: where }),
    ]);

    return paginate(data, total, page, limit);
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
