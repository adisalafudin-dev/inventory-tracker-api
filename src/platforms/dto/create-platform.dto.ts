// src/platforms/dto/create-platform.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePlatformSchema = z.object({
  name: z.string('Nama platform wajib diisi').min(2).max(50).trim(),
  logoUrl: z.url('Format URL tidak valid').optional(),
});

export class CreatePlatformDto extends createZodDto(CreatePlatformSchema) {}
