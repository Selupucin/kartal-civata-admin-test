import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { verifyAccessToken } from '@shared/lib/auth/jwt';
import { verifyPassword } from '@shared/lib/auth/passwords';
import dbConnect from '@shared/lib/db/mongoose';
import User from '@shared/models/User';
import bcrypt from 'bcryptjs';

export const PUT = apiHandler(async (req: NextRequest) => {
  const token = req.cookies.get('admin_access_token')?.value;
  if (!token) return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);
  const payload = await verifyAccessToken(token);

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return errorResponse('VALIDATION', 'Mevcut şifre ve yeni şifre zorunludur', 400);
  }

  if (newPassword.length < 6) {
    return errorResponse('VALIDATION', 'Yeni şifre en az 6 karakter olmalıdır', 400);
  }

  await dbConnect();
  const user = await User.findById(payload.sub).select('+passwordHash');
  if (!user) return errorResponse('NOT_FOUND', 'Kullanıcı bulunamadı', 404);

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return errorResponse('VALIDATION', 'Mevcut şifre hatalı', 400);
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ _id: payload.sub }, { $set: { passwordHash: newHash } });

  return successResponse({ message: 'Şifre başarıyla güncellendi' });
});
