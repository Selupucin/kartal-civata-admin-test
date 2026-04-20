import { NextResponse } from 'next/server';
import { PaginationMeta } from '../../types';

export function successResponse<T>(data: T, status = 200, meta?: PaginationMeta) {
  return NextResponse.json(
    { success: true as const, data, ...(meta && { meta }) },
    { status }
  );
}

export function errorResponse(code: string, message: string, status = 400, details?: any) {
  return NextResponse.json(
    {
      success: false as const,
      error: { code, message, ...(details && { details }) },
    },
    { status }
  );
}

export function createdResponse<T>(data: T) {
  return successResponse(data, 201);
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}
