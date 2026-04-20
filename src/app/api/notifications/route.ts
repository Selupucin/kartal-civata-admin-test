import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { verifyAccessToken } from '@shared/lib/auth/jwt';
import dbConnect from '@shared/lib/db/mongoose';
import Notification from '@shared/models/Notification';

export const GET = apiHandler(async (req: NextRequest) => {
  const token = req.cookies.get('admin_access_token')?.value;
  if (!token) return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);
  const payload = await verifyAccessToken(token);

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId: payload.sub })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId: payload.sub, isRead: false }),
  ]);

  return successResponse({ notifications, unreadCount });
});
