import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';

export const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';
export const SUPABASE_URL = 'http://127.0.0.1:54321';
export const ISSUER = `${SUPABASE_URL}/auth/v1`;

interface BuildTokenOptions {
  userId?: string;
  role?: string;
  audience?: string;
  secret?: string;
  expired?: boolean;
}

export async function buildToken(
  options: BuildTokenOptions = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const userId = options.userId ?? randomUUID();
  const expiresIn = options.expired ? -10 : 3600;

  return new SignJWT({
    role: options.role ?? 'authenticated',
    email: 'test@example.com',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setAudience(options.audience ?? 'authenticated')
    .setIssuer(ISSUER)
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(new TextEncoder().encode(options.secret ?? JWT_SECRET));
}
