// src/orders/dto/create-order.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateOrderSchema = z.object({
  orderNumber: z.string('Nomor order wajib diisi').min(1).max(100).trim(),

  platformId: z.cuid2('Format platform ID tidak valid'),

  buyerName: z.string().max(100).trim().optional(),
  buyerNote: z.string().max(500).trim().optional(),

  shippingFee: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),

  shippingCourier: z.string().max(50).trim().optional(),
  trackingNumber: z.string().max(100).trim().optional(),

  orderedAt: z.iso.datetime('Format tanggal tidak valid').optional(),

  // Minimal harus ada 1 item
  items: z
    .array(
      z.object({
        productId: z.cuid2('Format product ID tidak valid'),
        quantity: z.number().int().positive('Jumlah item minimal 1'),
      }),
    )
    .min(1, 'Order harus memiliki minimal 1 item'),
});

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
