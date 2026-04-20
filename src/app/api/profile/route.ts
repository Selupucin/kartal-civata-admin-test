import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { verifyAccessToken } from '@shared/lib/auth/jwt';
import dbConnect from '@shared/lib/db/mongoose';
import User from '@shared/models/User';

export const GET = apiHandler(async (req: NextRequest) => {
  const token = req.cookies.get('admin_access_token')?.value;
  if (!token) return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);
  const payload = await verifyAccessToken(token);

  await dbConnect();
  const user = await User.findById(payload.sub).select('email firstName lastName phone role preferences');
  if (!user) return errorResponse('NOT_FOUND', 'Kullanıcı bulunamadı', 404);

  return successResponse({ user });
});

export const PUT = apiHandler(async (req: NextRequest) => {
  const token = req.cookies.get('admin_access_token')?.value;
  if (!token) return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);
  const payload = await verifyAccessToken(token);

  const body = await req.json();
  const { firstName, lastName, phone, preferences } = body;

  await dbConnect();

  // If only preferences are being updated
  if (preferences && !firstName && !lastName) {
    // Merge with existing preferences to avoid overwriting
    const existingUser = await User.findById(payload.sub).select('preferences') as any;
    const mergedPrefs = { ...existingUser?.preferences?.toObject?.() || {}, ...preferences };
    if (preferences.adminNotifications && existingUser?.preferences?.adminNotifications) {
      mergedPrefs.adminNotifications = { ...existingUser.preferences.adminNotifications.toObject?.() || {}, ...preferences.adminNotifications };
    }
    const user = await User.findByIdAndUpdate(
      payload.sub,
      { preferences: mergedPrefs },
      { new: true }
    ).select('email firstName lastName phone role preferences');

    if (!user) return errorResponse('NOT_FOUND', 'Kullanıcı bulunamadı', 404);
    return successResponse({ user });
  }

  if (!firstName || !lastName) {
    return errorResponse('VALIDATION', 'Ad ve soyad zorunludur', 400);
  }

  const updateData: any = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone?.trim() || '',
  };

  if (preferences) {
    updateData.preferences = preferences;
  }

  const user = await User.findByIdAndUpdate(
    payload.sub,
    updateData,
    { new: true }
  ).select('email firstName lastName phone role preferences');

  if (!user) return errorResponse('NOT_FOUND', 'Kullanıcı bulunamadı', 404);

  return successResponse({ user });
});
