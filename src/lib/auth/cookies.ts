import { NextResponse } from 'next/server';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const baseCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'lax',
  path: '/',
};

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe?: boolean
): NextResponse {
  response.cookies.set('kartal_access_token', accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60, // 1 hour
  });

  response.cookies.set('kartal_refresh_token', refreshToken, {
    ...baseCookieOptions,
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days if remember me, else 7 days
  });

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('kartal_access_token');
  response.cookies.delete('kartal_refresh_token');
  return response;
}
