// src/common/guards/throttler.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  // Override pesan error default (yang dalam bahasa Inggris)
  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa saat.',
    );
  }
}
