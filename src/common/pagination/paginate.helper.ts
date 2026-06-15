// src/common/pagination/paginate.helper.ts
import { PaginationMeta, PaginatedResult } from './pagination.dto';

// Helper ini menerima data yang sudah di-fetch + total count
// lalu membungkusnya dengan meta pagination
export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const lastPage = Math.ceil(total / limit);
  const hasNextPage = page < lastPage;
  const hasPrevPage = page > 1;

  const meta: PaginationMeta = {
    total,
    page,
    limit,
    lastPage: lastPage === 0 ? 1 : lastPage,
    hasNextPage,
    hasPrevPage,
  };

  return { data, meta };
}

// Hitung berapa row yang di-skip berdasarkan page dan limit
// Contoh: page=3, limit=10 → skip=20
export function getPaginationParams(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
