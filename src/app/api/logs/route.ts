import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@/lib/api/response';
import { withAdmin, AuthenticatedRequest } from '@/lib/api/middleware';
import { APP_CONFIG } from '@/constants/config';
import dbConnect from '@/lib/db/mongoose';
import SystemLog from '@/models/SystemLog';

// GET /api/logs — list logs (super admin only)
export const GET = apiHandler(
  withAdmin(async (req: AuthenticatedRequest) => {
    // Super admin check
    if (req.user?.email !== APP_CONFIG.superAdminEmail) {
      return errorResponse('FORBIDDEN', 'Bu sayfaya erişim yetkiniz yok', 403);
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const level = searchParams.get('level');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const resolved = searchParams.get('resolved');

    await dbConnect();

    const filter: Record<string, unknown> = {};
    if (level && ['info', 'warn', 'error', 'fatal'].includes(level)) {
      filter.level = level;
    }
    if (source && ['site', 'admin', 'api', 'system'].includes(source)) {
      filter.source = source;
    }
    if (resolved === 'true') {
      filter.resolvedAt = { $ne: null };
    } else if (resolved === 'false') {
      filter.resolvedAt = null;
    }
    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }

    const [logs, total] = await Promise.all([
      SystemLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SystemLog.countDocuments(filter),
    ]);

    // Stats
    const stats = await SystemLog.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap: Record<string, number> = { info: 0, warn: 0, error: 0, fatal: 0 };
    stats.forEach((s) => {
      statsMap[s._id] = s.count;
    });

    return successResponse({
      logs,
      stats: statsMap,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// DELETE /api/logs — clear old logs (super admin only)
export const DELETE = apiHandler(
  withAdmin(async (req: AuthenticatedRequest) => {
    if (req.user?.email !== APP_CONFIG.superAdminEmail) {
      return errorResponse('FORBIDDEN', 'Bu sayfaya erişim yetkiniz yok', 403);
    }

    const { searchParams } = new URL(req.url);
    const olderThanDays = parseInt(searchParams.get('olderThan') || '30');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    await dbConnect();

    const result = await SystemLog.deleteMany({ createdAt: { $lt: cutoff } });

    return successResponse({
      deleted: result.deletedCount,
      message: `${olderThanDays} günden eski ${result.deletedCount} log silindi`,
    });
  })
);
