/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodIssue } from 'zod';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
}

@Catch() // No argument = catch ALL exceptions (HttpException + unexpected errors)
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected internal error occurred';
    let error = 'Internal Server Error';

    if (exception instanceof ZodValidationException) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';

      // Flatten all Zod field errors into a readable string array
      // e.g. ["email: Please provide a valid email", "password: min 8 chars"]
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      const zodError: any = exception.getZodError();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      message = zodError.issues.map(
        (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`,
      );
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // class-validator returns { message: string[], error: string, statusCode: number }
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string | string[]) ?? exception.message;
        error = (res.error as string) ?? exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      // Unexpected errors: log them fully for debugging, but send a
      // generic message to the client to avoid leaking internals.
      this.logger.error(
        `Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Log 5xx errors as errors, 4xx as warnings
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(JSON.stringify(errorResponse));
    } else {
      this.logger.warn(JSON.stringify(errorResponse));
    }

    response.status(statusCode).json(errorResponse);
  }
}
