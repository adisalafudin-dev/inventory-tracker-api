// src/platforms/platforms.module.ts
import { Module } from '@nestjs/common';
import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';

@Module({
  controllers: [PlatformsController],
  providers: [PlatformsService],
  exports: [PlatformsService], // ← dipakai OrdersModule
})
export class PlatformsModule {}
