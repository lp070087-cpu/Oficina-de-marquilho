import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { JWT_SECRET } from '@/lib/jwt-secret';
import prisma from '@/lib/prisma';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'DONO' | 'BALCAO' | 'MECANICO' | 'ESTOQUE';
  tipoBalcao?: string | null;
  emAlmoco?: boolean;
  iat?: number;
}

const ehAtendente = (u: SessionUser) => u.role === 'BALCAO' && u.tipoBalcao === 'VENDA_LOJA';

// Sessões de atendente caem assim que a DONA revoga o acesso ou troca a senha.
async function sessaoAtendenteValida(s: SessionUser): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: s.id }, select: { active: true, deletedAt: true, tipoBalcao: true, passwordUpdatedAt: true } });
  if (!u?.active || u.deletedAt || u.tipoBalcao !== 'VENDA_LOJA') return false;
  return !u.passwordUpdatedAt || Math.floor(u.passwordUpdatedAt.getTime() / 1000) <= (s.iat ?? 0);
}

export async function createToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ehAtendente(user) ? '12h' : '24h')
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
  const session = await verifyToken(token);
  if (session && ehAtendente(session) && !(await sessaoAtendenteValida(session))) return null;
  return session;
}

export async function requireAuth(allowedRoles?: string[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/');
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect('/');
  }
  return session;
}

export function roleToPath(role: string, tipoBalcao?: string | null): string {
  switch (role) {
    case 'DONO': return '/dono';
    case 'BALCAO': return tipoBalcao === 'VENDA_LOJA' ? '/balcao/atendimento' : tipoBalcao === 'SERVICOS' ? '/balcao/recebimento' : '/balcao';
    case 'ESTOQUE': return '/estoque';
    default: return '/';
  }
}

// --- Vitrine (cliente) Auth ---

export interface VitrineSession {
  clienteId: string;
  nome: string;
  telefone: string;
}

export async function createVitrineToken(cliente: { id: string; nome: string; telefone: string }): Promise<string> {
  const token = await new SignJWT({
    clienteId: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    role: 'CLIENTE',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
  return token;
}

export async function getVitrineSession(reqOrToken: string): Promise<VitrineSession | null> {
  try {
    // Aceita token diretamente ou extrai do header Authorization
    let token = reqOrToken;
    if (reqOrToken.startsWith('Bearer ')) {
      token = reqOrToken.slice(7);
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'CLIENTE') return null;
    return {
      clienteId: payload.clienteId as string,
      nome: payload.nome as string,
      telefone: payload.telefone as string,
    };
  } catch {
    return null;
  }
}
