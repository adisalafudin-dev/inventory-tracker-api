import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z
    .string()
    .default('3000')
    .transform(Number) // ubah string '3000' → number 3000
    .pipe(z.number().positive()),

  // Database
  DATABASE_URL: z
    .string('DATABASE_URL wajib diisi di .env')
    .url('DATABASE_URL harus berformat URL yang valid'),

  // JWT
  JWT_SECRET: z
    .string('JWT_SECRET wajib diisi di .env')
    .min(32, 'JWT_SECRET minimal 32 karakter demi keamanan'),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Rate limiting (opsional, ada default)
  THROTTLE_TTL: z.string().default('60000').transform(Number),
  THROTTLE_LIMIT: z.string().default('100').transform(Number),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  ❌ ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    console.error('\n[EnvValidation] Environment variable tidak valid:\n');
    console.error(errors);
    console.error('\nPerbaiki file .env kamu lalu coba lagi.\n');

    // Hentikan app dengan exit code 1 (error)
    process.exit(1);
  }

  console.log('[EnvValidation] ✅ Semua environment variable valid');
  return result.data;
}
