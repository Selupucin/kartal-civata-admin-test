import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@shared/lib/api/response';

export const POST = apiHandler(async (_req: NextRequest) => {
  const response = successResponse({ message: 'Çıkış yapıldı' });
  response.cookies.delete('admin_access_token');
  response.cookies.delete('admin_refresh_token');
  return response;
});
