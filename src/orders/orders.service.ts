import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformsService } from '../platforms/platforms.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderStatus } from 'generated/prisma/enums';
import { UpdateOrderDto } from './dto/update-order-status.dto';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { Prisma } from 'generated/prisma/client';
import {
  getPaginationParams,
  paginate,
} from 'src/common/pagination/paginate.helper';

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED', 'RETURNED'],
  COMPLETED: [], // status final
  CANCELLED: [], // status final
  RETURNED: [], // status final
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private platformsService: PlatformsService,
  ) {}

  async findOneOrFail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        platform: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order dengan ID "${id}" tidak ditemukan`);
    }

    return order;
  }

  async findOne(id: string) {
    return this.findOneOrFail(id);
  }

  async create(dto: CreateOrderDto) {
    const platform = await this.platformsService.findOneOrFail(dto.platformId);
    if (!platform.isActive) {
      throw new BadRequestException(
        `Platform "${platform.name}" sedang tidak aktif`,
      );
    }

    // ── Validasi 2: orderNumber harus unik
    const existingOrder = await this.prisma.order.findUnique({
      where: { orderNumber: dto.orderNumber },
    });
    if (existingOrder) {
      throw new BadRequestException(
        `Nomor order "${dto.orderNumber}" sudah ada`,
      );
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));

      throw new NotFoundException(
        `Produk dengan ID berikut tidak ditemukan: ${missingIds.join(', ')}`,
      );
    }

    const errors: string[] = [];

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;

      if (!product.isActive) {
        errors.push(
          `Produk "${product.name}" (${product.sku}) sedang tidak aktif`,
        );
      }

      if (product.stock < item.quantity) {
        errors.push(
          `Stok "${product.name}" tidak cukup. Tersedia: ${product.stock}, diminta: ${item.quantity}`,
        );
      }
    }

    if (errors.length > 0) {
      throw new UnprocessableEntityException(errors);
    }

    const itemsWithPrice = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const subtotal = Number(product.sellPrice) * item.quantity;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(product.sellPrice), // harga jual saat ini
        unitCost: Number(product.costPrice), // harga modal saat ini
        subtotal,
      };
    });

    const itemsTotal = itemsWithPrice.reduce((sum, i) => sum + i.subtotal, 0);
    const totalAmount = itemsTotal + dto.shippingFee - dto.discount;

    if (totalAmount < 0) {
      throw new BadRequestException('Total amount tidak boleh negatif');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: dto.orderNumber,
          platformId: dto.platformId,
          buyerName: dto.buyerName,
          buyerNote: dto.buyerNote,
          shippingFee: dto.shippingFee,
          discount: dto.discount,
          totalAmount,
          shippingCourier: dto.shippingCourier,
          trackingNumber: dto.trackingNumber,
          orderedAt: dto.orderedAt ? new Date(dto.orderedAt) : new Date(),
          items: {
            create: itemsWithPrice,
          },
        },
        include: {
          platform: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      });

      for (const item of itemsWithPrice) {
        const product = products.find((p) => p.id === item.productId)!;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity, // negatif = stok keluar
            type: 'OUT',
            reason: `Penjualan Order #${dto.orderNumber}`,
          },
        });
      }

      return newOrder;
    });

    return order;
  }

  async findAll(query: QueryOrderDto & PaginationDto) {
    const { status, platformId, search, page, limit } = query;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
      ...(platformId && { platformId }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { buyerName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const { skip, take } = getPaginationParams(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          platform: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
        skip,
        take,
        orderBy: { orderedAt: 'desc' },
      }),

      this.prisma.order.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async updateStatus(id: string, dto: UpdateOrderDto) {
    const order = await this.findOneOrFail(id);

    // Validasi: apakah transisi status ini diizinkan?
    const allowedNext = STATUS_TRANSITIONS[order.status];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Tidak bisa mengubah status dari "${order.status}" ke "${dto.status}". ` +
          `Status yang diizinkan: ${allowedNext.join(', ') || 'tidak ada (status final)'}`,
      );
    }

    const shouldRestoreStock =
      dto.status === 'CANCELLED' || dto.status === 'RETURNED';

    // Set timestamp otomatis berdasarkan status baru
    const timestampData: Record<string, Date | null> = {};
    if (dto.status === 'SHIPPED') timestampData.shippedAt = new Date();
    if (dto.status === 'COMPLETED') timestampData.completedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: {
          status: dto.status,
          shippingCourier: dto.shippingCourier ?? order.shippingCourier,
          trackingNumber: dto.trackingNumber ?? order.trackingNumber,
          ...timestampData,
        },
        include: {
          platform: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      });

      if (shouldRestoreStock) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity, // positif = stok masuk kembali
              type: dto.status === 'RETURNED' ? 'RETURN' : 'ADJUSTMENT',
              reason:
                dto.status === 'RETURNED'
                  ? `Retur dari Order #${order.orderNumber}`
                  : `Pembatalan Order #${order.orderNumber}`,
            },
          });
        }
      }

      return updatedOrder;
    });
  }
}
