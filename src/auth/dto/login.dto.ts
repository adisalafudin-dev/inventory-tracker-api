import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Please provide a valid email address'),

  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
