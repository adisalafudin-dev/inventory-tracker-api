// src/orders/dto/query-order.dto.ts
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from 'src/common/pagination/pagination.dto';
import { z } from 'zod';

export const QueryOrderSchema = z
  .object({
    status: z
      .enum([
        'PENDING',
        'PROCESSING',
        'SHIPPED',
        'COMPLETED',
        'CANCELLED',
        'RETURNED',
      ])
      .optional(),

    platformId: z.cuid2().optional(),

    search: z.string().trim().optional(),
    // Cari by orderNumber atau buyerName
  })
  .extend(PaginationSchema);

export class QueryOrderDto extends createZodDto(QueryOrderSchema) {}
