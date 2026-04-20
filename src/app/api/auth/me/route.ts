import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { verifyAccessToken } from '@shared/lib/auth/jwt';
import { APP_CONFIG } from '@/constants/config';
import dbConnect from '@shared/lib/db/mongoose';
import User from '@shared/models/User';

export const GET = apiHandler(async (req: NextRequest) => {
  const token = req.cookies.get('admin_access_token')?.value;

  if (!token) {
    return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);
  }

  try {
    const payload = await verifyAccessToken(token);

    if (payload.role !== 'admin') {
      return errorResponse('FORBIDDEN', 'Bu panel sadece admin kullanıcılar içindir', 403);
    }

    await dbConnect();
    const user = await User.findById(payload.sub);

    if (!user || user.status !== 'active') {
      return errorResponse('UNAUTHORIZED', 'Geçersiz kullanıcı', 401);
    }

    return successResponse({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone || '',
        isSuperAdmin: user.email === APP_CONFIG.superAdminEmail,
      },
    });
  } catch {
    return errorResponse('TOKEN_EXPIRED', 'Oturum süresi doldu', 401);
  }
});
