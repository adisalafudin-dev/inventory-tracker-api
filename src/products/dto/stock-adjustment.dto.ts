import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const StockAdjustmentSchema = z.object({
  quantity: z
    .number('Jumlah stok wajib diisi')
    .int('Jumlah bilangan harus bulat')
    .refine((val) => val !== 0, 'Jumlah bilangan tidak boleh 0'),

  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN'], {
    error: 'Tipe pergerakan stok waji diisi',
  }),

  reason: z.string().max(255).trim().optional(),
});

export class StockAdjustmentDto extends createZodDto(StockAdjustmentSchema) {}
