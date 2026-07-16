import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'marquinho-motopecas-jwt-secret-key-2026-super-segura'
);

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'DONO' | 'BALCAO' | 'MECANICO' | 'ESTOQUE';
  tipoBalcao?: string | null;
  emAlmoco?: boolean;
}

export async function createToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(allowedRoles?: string[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/');
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect('/');
  }
  return session;
}

export function roleToPath(role: string): string {
  switch (role) {
    case 'DONO': return '/dono';
    case 'BALCAO': return '/balcao';
    case 'MECANICO': return '/mecanico';
    case 'ESTOQUE': return '/estoque';
    default: return '/';
  }
}
