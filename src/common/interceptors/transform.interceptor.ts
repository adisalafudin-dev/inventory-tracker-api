// src/common/interceptors/transform.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

// Bentuk envelope yang akan selalu kita return
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Ambil pesan dari header khusus jika ada
    // Berguna untuk custom message per endpoint (lihat cara pakai di bawah)
    const customMessage = response.getHeader('X-Custom-Message') as
      | string
      | undefined;

    // next.handle() menjalankan route handler dan menghasilkan Observable
    // pipe(map(...)) menangkap hasilnya dan kita transformasi
    return next.handle().pipe(
      map((data) => {
        // Hapus header sementara agar tidak terkirim ke client
        if (customMessage) response.removeHeader('X-Custom-Message');

        return {
          success: true,
          statusCode: response.statusCode,
          message: customMessage ?? this.getDefaultMessage(request.method),
          data,
        };
      }),
    );
  }

  // Pesan default berdasarkan HTTP method
  private getDefaultMessage(method: string): string {
    const messages: Record<string, string> = {
      GET: 'Data berhasil diambil',
      POST: 'Data berhasil dibuat',
      PATCH: 'Data berhasil diperbarui',
      PUT: 'Data berhasil diperbarui',
      DELETE: 'Data berhasil dihapus',
    };
    return messages[method] ?? 'Berhasil';
  }
}
