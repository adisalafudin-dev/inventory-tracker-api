import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateProductSchema = z.object({
  sku: z.string('SKU wajib diisi').min(1).max(50).trim().toUpperCase(),
  name: z
    .string('Nama produk wajib diisi')
    .min(2)
    .max(200)
    .trim()
    .toUpperCase(),
  description: z.string().max(2000).trim().optional(),
  imageUrl: z.url('Format tidak valid').optional(),
  costPrice: z
    .number('Harga modal wajib diisi')
    .positive('Harga modal harus lebih dari 0'),

  sellPrice: z
    .number('Harga modal wajib diisi')
    .positive('Harga jual harus lebih dari 0'),

  stock: z
    .number()
    .int('Stok harus berupa bilangan bulat')
    .min(0, 'Stok tidak boleh negatif')
    .default(0),

  lowStockAt: z.number().int().min(0).default(5),

  categoryId: z.cuid2('Format category ID tidak valid').optional(),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
