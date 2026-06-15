import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { OrdersController } from './orders/orders.controller';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { PlatformsModule } from './platforms/platforms.module';
import { ReportsModule } from './reports/reports.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guards';
import { validateEnv } from './config/env.validation';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),

    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          // Default: 100 request per 60 detik untuk semua route
          name: 'global',
          ttl: 60_000, // milliseconds
          limit: 100,
        },
        {
          // Auth: lebih ketat — 5 request per 60 detik
          // Diterapkan via @Throttle({ auth: ... }) di AuthController
          name: 'auth',
          ttl: 60_000,
          limit: 5,
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    CategoriesModule,
    PlatformsModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Guard global: semua route otomatis dicek role-nya
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
  controllers: [OrdersController],
})
export class AppModule {}
