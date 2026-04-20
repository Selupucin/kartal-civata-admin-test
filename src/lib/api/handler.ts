import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { errorResponse } from '@/lib/api/response';
import { logSystemError } from '@/lib/logger/systemLog';

type RouteHandler = (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function apiHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        if (error.statusCode >= 500) {
          logSystemError({
            level: 'error',
            source: 'admin',
            message: error.message,
            path: new URL(req.url).pathname,
            method: req.method,
            statusCode: error.statusCode,
          });
        }
        return errorResponse(
          error.code,
          error.message,
          error.statusCode,
          (error as any).details
        );
      }

      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Geçersiz veri',
          400,
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }

      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Unhandled API error:', err);

      logSystemError({
        level: 'error',
        source: 'admin',
        message: err.message,
        stack: err.stack,
        path: new URL(req.url).pathname,
        method: req.method,
        statusCode: 500,
      });

      return errorResponse('INTERNAL_ERROR', 'Sunucu hatası', 500);
    }
  };
}
