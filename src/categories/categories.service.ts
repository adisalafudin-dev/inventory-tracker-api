import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateCategoryDto) {
    const categoryExist = await this.prisma.category.findUnique({
      where: {
        name: dto.name,
      },
    });

    if (categoryExist) {
      throw new ConflictException(
        `Kategori dengan nama "${dto.name}" sudah ada`,
      );
    }

    const category = await this.prisma.category.create({
      data: dto,
    });

    return category;
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      createdAt: cat.createdAt,
      productCount: cat._count.products,
    }));
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Kategori tidak ditemukan`);
    }

    const categoryWithSameName = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });

    if (categoryWithSameName) {
      throw new ConflictException(
        `Kategori dengan nama "${dto.name}" sudah ada`,
      );
    }

    return this.prisma.category.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async remove(id: string) {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Kategori tidak ditemukan`);
    }

    return this.prisma.category.delete({
      where: {
        id,
      },
    });
  }

  async findOneOrFail(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundException(`Kategori tidak ditemukan`);
    }

    return category;
  }
}
