// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule], // ← import agar CategoriesService bisa di-inject
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // ← export untuk dipakai OrdersModule nanti
})
export class ProductsModule {}
