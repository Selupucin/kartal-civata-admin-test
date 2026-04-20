import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export async function signAccessToken(payload: { sub: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: { sub: string; email: string; role: string }): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  if ((payload as TokenPayload).type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  if ((payload as TokenPayload).type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload as TokenPayload;
}

export async function signPasswordResetToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'reset' as any })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET);
}

export async function verifyPasswordResetToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as TokenPayload;
}
