import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateCategoryDto = z.object({
  name: z.string({ error: 'Nama kategori wajib diisi' }).min(2).max(100).trim(),
});

export class UpdateCategoryDto extends createZodDto(updateCategoryDto) {}
