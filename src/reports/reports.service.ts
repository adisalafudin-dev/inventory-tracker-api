import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async getCogsForPeriod(from: Date, to: Date): Promise<number> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          completedAt: { gte: from, lte: to },
        },
      },
      select: { unitCost: true, quantity: true },
    });

    return items.reduce(
      (sum, item) => sum + Number(item.unitCost) * item.quantity,
      0,
    );
  }

  async getDashboard() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [orderCountByStatus, revenueThisMonth, topProducts, totalProducts] =
      await Promise.all([
        // order count based on status
        this.prisma.order.groupBy({
          by: ['status'],
          _count: { id: true },
        }),

        // keuntungan bulan ini
        this.prisma.orderItem.aggregate({
          where: {
            order: {
              status: 'COMPLETED',
              completedAt: { gte: firstOfMonth },
            },
          },
          _sum: {
            subtotal: true,
          },
        }),

        // top produk dari order items
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              status: 'COMPLETED',
              completedAt: { gte: firstOfMonth },
            },
          },
          _sum: { quantity: true, subtotal: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),

        // jumlah produk yang aktif
        this.prisma.product.count({ where: { isActive: true } }),
      ]);

    //cogs adalah pengeluaran bulan ini
    const cogsThisMonth = await this.getCogsForPeriod(firstOfMonth, now);

    // order berdasarkan status yang lebih rapi
    const orderSummary = orderCountByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    //untuk mendapatkan top products
    const topProductIds = topProducts.map((p) => p.productId);
    const productNames = await this.prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, sku: true },
    });

    const topProductsFormatted = topProducts.map((item) => {
      const product = productNames.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name ?? 'Unknown',
        sku: product?.sku ?? '-',
        qtySold: item._sum.quantity ?? 0,
        revenue: item._sum.subtotal ?? 0,
      };
    });

    const revenue = Number(revenueThisMonth._sum.subtotal ?? 0);
    const cogs = cogsThisMonth;
    const profit = revenue - cogs;

    return {
      period: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        label: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
      },
      orders: orderSummary,
      financial: {
        revenue,
        cogs,
        profit,
        margin:
          revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(2)) : 0,
      },
      inventory: {
        totalActiveProducts: totalProducts,
      },
      topProducts: topProductsFormatted,
    };
  }

  async getLowStockProducts() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        lowStockAt: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { stock: 'asc' },
    });

    const lowStock = products.filter((p) => p.stock <= p.lowStockAt);

    return {
      count: lowStock.length,
      products: lowStock.map((p) => ({
        ...p,
        deficit: p.lowStockAt - p.stock + 1,
      })),
    };
  }

  async generateMonthlyReport(year: number, month: number) {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Bulan harus antara 1 dan 12');
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      throw new BadRequestException(
        'Tidak bisa generate laporan untuk bulan yang belum terjadi',
      );
    }

    // Tentukan range tanggal untuk bulan tersebut
    const startDate = new Date(year, month - 1, 1); // 1 Jan 2026 00:00:00
    const endDate = new Date(year, month, 0, 23, 59, 59); // 31 Jan 2026 23:59:59

    const completedOrders = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate, lte: endDate },
      },
      include: { items: true },
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    let unitsSold = 0;

    for (const { totalAmount, items } of completedOrders) {
      totalRevenue += Number(totalAmount);

      for (const { unitCost, quantity } of items) {
        totalCogs += Number(unitCost) * quantity;
        unitsSold += quantity;
      }
    }

    const totalProfit = totalRevenue - totalCogs;
    const orderCount = completedOrders.length;

    const report = await this.prisma.monthlyReport.upsert({
      where: { year_month: { year, month } },
      create: {
        year,
        month,
        totalRevenue,
        totalCogs,
        totalProfit,
        orderCount,
        unitsSold,
      },
      update: {
        totalRevenue,
        totalCogs,
        totalProfit,
        orderCount,
        unitsSold,
        generatedAt: new Date(), // catat kapan terakhir di-refresh
      },
    });

    return {
      ...report,
      margin:
        totalRevenue > 0
          ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2))
          : 0,
    };
  }

  async getMonthlyReports() {
    const reports = await this.prisma.monthlyReport.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return reports.map((r) => ({
      ...r,
      margin:
        Number(r.totalRevenue) > 0
          ? parseFloat(
              ((Number(r.totalProfit) / Number(r.totalRevenue)) * 100).toFixed(
                2,
              ),
            )
          : 0,
    }));
  }
}
