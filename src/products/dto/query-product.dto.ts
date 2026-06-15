// src/products/dto/query-product.dto.ts
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from 'src/common/pagination/pagination.dto';
import { z } from 'zod';

export const QueryProductSchema = z
  .object({
    search: z.string().trim().optional(),

    category: z.cuid2('Format category ID tidak valid').optional(),
    // contoh: ?category=clxxx123

    lowStock: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true') // ubah string → boolean
      .optional(),

    isActive: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .default(true), // default hanya tampilkan produk aktif
  })
  .extend(PaginationSchema);

export class QueryProductDto extends createZodDto(QueryProductSchema) {}
