// src/common/pagination/pagination.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive('Page minimal 1')),

  limit: z
    .string()
    .default('20')
    .transform(Number)
    .pipe(
      z.number().int().positive().max(100, 'Limit maksimal 100 per halaman'),
    ),
});

export class PaginationDto extends createZodDto(PaginationSchema) {}

// Tipe untuk meta yang kita kembalikan di response
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Tipe response akhir yang dibungkus pagination
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
