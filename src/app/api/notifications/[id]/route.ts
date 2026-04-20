import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { verifyAccessToken } from '@shared/lib/auth/jwt';
import dbConnect from '@shared/lib/db/mongoose';
import Notification from '@shared/models/Notification';

export const PUT = apiHandler(async (req: NextRequest, context: any) => {
  const { id } = await context.params;
  const token = req.cookies.get('admin_access_token')?.value;
  if (!token) return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);
  const payload = await verifyAccessToken(token);

  await dbConnect();

  if (id === 'read-all') {
    await Notification.updateMany(
      { userId: payload.sub, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return successResponse({ message: 'Tüm bildirimler okundu' });
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: payload.sub },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    return errorResponse('NOT_FOUND', 'Bildirim bulunamadı', 404);
  }

  return successResponse(notification);
});
