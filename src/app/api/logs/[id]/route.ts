import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { withAdmin, AuthenticatedRequest } from '@/lib/api/middleware';
import { APP_CONFIG } from '@/constants/config';
import dbConnect from '@shared/lib/db/mongoose';
import SystemLog from '@shared/models/SystemLog';

// PUT /api/logs/[id] — mark as resolved
export const PUT = apiHandler(
  withAdmin(async (req: AuthenticatedRequest, context) => {
    if (req.user?.email !== APP_CONFIG.superAdminEmail) {
      return errorResponse('FORBIDDEN', 'Bu sayfaya erişim yetkiniz yok', 403);
    }

    const { id } = await context!.params;
    await dbConnect();

    const log = await SystemLog.findByIdAndUpdate(
      id,
      { resolvedAt: new Date(), resolvedBy: req.user!.id },
      { new: true }
    );

    if (!log) return errorResponse('NOT_FOUND', 'Log bulunamadı', 404);
    return successResponse({ log });
  })
);

// DELETE /api/logs/[id] — delete single log
export const DELETE = apiHandler(
  withAdmin(async (req: AuthenticatedRequest, context) => {
    if (req.user?.email !== APP_CONFIG.superAdminEmail) {
      return errorResponse('FORBIDDEN', 'Bu sayfaya erişim yetkiniz yok', 403);
    }

    const { id } = await context!.params;
    await dbConnect();

    const log = await SystemLog.findByIdAndDelete(id);
    if (!log) return errorResponse('NOT_FOUND', 'Log bulunamadı', 404);
    return successResponse({ message: 'Log silindi' });
  })
);
