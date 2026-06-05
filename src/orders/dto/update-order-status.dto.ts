import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const UpdateOrderSchema = z
  .object({
    status: z.enum(
      [
        'PENDING',
        'PROCESSING',
        'SHIPPED',
        'COMPLETED',
        'CANCELLED',
        'RETURNED',
      ],
      'Status wajib diisi',
    ),
    // Wajib diisi jika status = SHIPPED
    shippingCourier: z.string().max(50).trim().optional(),
    trackingNumber: z.string().max(100).trim().optional(),
  })
  .refine((data) => {
    if (data.status === 'SHIPPED') {
      return !!data.shippingCourier && !!data.trackingNumber;
    }

    return true;
  }, 'Kurir dan Nomor Resi wajib diisi jika status pesanan SHIPPED');

export class UpdateOrderDto extends createZodDto(UpdateOrderSchema) {}
