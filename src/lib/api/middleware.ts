import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { errorResponse } from '@/lib/api/response';
import { UserRole } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export function withAdmin(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest, context?: any) => {
    const token = req.cookies.get('admin_access_token')?.value;

    if (!token) {
      return errorResponse('UNAUTHORIZED', 'Giriş yapmanız gerekiyor', 401);
    }

    try {
      const payload = await verifyAccessToken(token);

      if (payload.role !== 'admin') {
        return errorResponse('FORBIDDEN', 'Bu panel sadece admin kullanıcılar içindir', 403);
      }

      req.user = {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as UserRole,
      };
    } catch {
      return errorResponse('TOKEN_EXPIRED', 'Oturum süresi doldu', 401);
    }

    return handler(req, context);
  };
}
