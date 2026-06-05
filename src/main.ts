import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 3000;

  // ── 1. Global Prefix ───────────────────────────────────────────────────────
  // All routes become /api/v1/...
  app.setGlobalPrefix('api');

  // ── 2. API Versioning ──────────────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── 3. Global Exception Filter ────────────────────────────────────────────
  // Must be registered before the validation pipe so it can catch pipe errors
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── 5. CORS ────────────────────────────────────────────────────────────────
  const allowedOrigins = config.get<string>('ALLOWED_ORIGINS');
  const corsOrigins = allowedOrigins ? allowedOrigins.split(',') : '*';

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // ── 6. Swagger (disable in production) ───────────────────────────────────
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestJS Production API')
      .setDescription('A scalable REST API built with NestJS + Prisma')
      .setVersion('1.0')
      .addBearerAuth() // Adds the "Authorize" button to Swagger UI
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Remember the Bearer token across page reloads
      },
    });
  }

  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at:        http://localhost:${port}/api/docs`);
}

bootstrap();
