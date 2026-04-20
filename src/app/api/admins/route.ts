import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { verifyAccessToken } from '@shared/lib/auth/jwt';
import { APP_CONFIG } from '@/constants/config';
import dbConnect from '@shared/lib/db/mongoose';
import User from '@shared/models/User';
import bcrypt from 'bcryptjs';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest) => {
    await dbConnect();
    const admins = await User.find({ role: 'admin' })
      .select('email firstName lastName phone status createdAt lastLoginAt')
      .sort({ createdAt: 1 })
      .lean();

    const adminsWithSuperFlag = admins.map((admin) => ({
      ...admin,
      isSuperAdmin: admin.email === APP_CONFIG.superAdminEmail,
    }));

    return successResponse(adminsWithSuperFlag);
  })
);

export const POST = apiHandler(
  withAdmin(async (req: NextRequest) => {
    const token = req.cookies.get('admin_access_token')?.value;
    if (!token) return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);
    const payload = await verifyAccessToken(token);

    await dbConnect();
    const currentUser = await User.findById(payload.sub);
    if (!currentUser || currentUser.email !== APP_CONFIG.superAdminEmail) {
      return errorResponse('FORBIDDEN', 'Sadece süper admin yeni admin ekleyebilir', 403);
    }

    const body = await req.json();
    const { email, firstName, lastName, password, phone } = body;

    if (!email || !firstName || !lastName || !password) {
      return errorResponse('VALIDATION', 'Tüm alanlar zorunludur', 400);
    }

    if (password.length < 6) {
      return errorResponse('VALIDATION', 'Şifre en az 6 karakter olmalıdır', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return errorResponse('CONFLICT', 'Bu e-posta adresi zaten kullanılıyor', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newAdmin = await User.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      passwordHash,
      phone: phone || '',
      role: 'admin',
      status: 'active',
    });

    return successResponse({
      id: newAdmin._id,
      email: newAdmin.email,
      firstName: newAdmin.firstName,
      lastName: newAdmin.lastName,
    }, 201);
  })
);
