// src/auth/dto/register.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z
    .string({ error: 'Nama wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(100),

  email: z.email('Format email tidak valid'),

  password: z
    .string({ error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password harus mengandung huruf besar, huruf kecil, dan angka',
    ),

  role: z.enum(['ADMIN', 'VIEWER']).default('VIEWER'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
