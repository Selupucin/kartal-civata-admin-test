import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@/lib/api/response';
import { verifyPassword } from '@/lib/auth/passwords';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/validations/auth';
import { AuthenticationError } from '@/lib/errors';
import { APP_CONFIG } from '@/constants/config';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';
import { logSystemError } from '@/lib/logger/systemLog';

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const data = loginSchema.parse(body);

  await dbConnect();

  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  if (!user) {
    throw new AuthenticationError('E-posta veya şifre hatalı');
  }

  // Only admins can login to admin panel
  if (user.role !== 'admin') {
    throw new AuthenticationError('Bu panel sadece admin kullanıcılar içindir');
  }

  // Check account lock
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new AuthenticationError('Hesabınız geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.');
  }

  // Check account status
  if (user.status !== 'active') {
    throw new AuthenticationError('Hesabınız askıya alınmıştır');
  }

  const isValid = await verifyPassword(data.password, user.passwordHash);

  if (!isValid) {
    const updates: any = { $inc: { loginAttempts: 1 } };
    if (user.loginAttempts + 1 >= APP_CONFIG.loginMaxAttempts) {
      updates.$set = { lockUntil: new Date(Date.now() + APP_CONFIG.loginLockDuration) };
    }
    await User.updateOne({ _id: user._id }, updates);
    throw new AuthenticationError('E-posta veya şifre hatalı');
  }

  // Reset login attempts on success
  await User.updateOne(
    { _id: user._id },
    { $set: { loginAttempts: 0, lockUntil: null, lastLoginAt: new Date() } }
  );

  const accessToken = await signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const refreshToken = await signRefreshToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const response = successResponse({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });

  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  const rememberMe = body.rememberMe === true;

  response.cookies.set('admin_access_token', accessToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });

  response.cookies.set('admin_refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
  });

  // Log admin login
  logSystemError({
    level: 'info',
    source: 'admin',
    message: `Admin girişi: ${user.email}`,
    path: '/api/auth/login',
    method: 'POST',
    userId: user._id.toString(),
    metadata: { action: 'admin_login', email: user.email },
  });

  return response;
});
