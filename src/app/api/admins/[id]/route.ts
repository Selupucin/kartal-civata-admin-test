import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { APP_CONFIG } from '@/constants/config';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';

export const DELETE = apiHandler(
  withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const token = req.cookies.get('admin_access_token')?.value;
    if (!token) return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);

    const payload = await verifyAccessToken(token);
    await dbConnect();

    const currentUser = await User.findById(payload.sub);
    if (!currentUser || currentUser.email !== APP_CONFIG.superAdminEmail) {
      return errorResponse('FORBIDDEN', 'Sadece süper admin diğer adminleri silebilir', 403);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return errorResponse('NOT_FOUND', 'Kullanıcı bulunamadı', 404);
    }

    if (targetUser.email === APP_CONFIG.superAdminEmail) {
      return errorResponse('FORBIDDEN', 'Süper admin silinemez', 403);
    }

    if (targetUser.role !== 'admin') {
      return errorResponse('VALIDATION', 'Bu kullanıcı admin değil', 400);
    }

    await User.updateOne({ _id: id }, { $set: { role: 'user', status: 'suspended' } });

    return successResponse({ message: 'Admin başarıyla silindi' });
  })
);
