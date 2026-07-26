import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ⚠️ Em produção, JWT_SECRET DEVE estar definido no ambiente.
// O fallback abaixo existe apenas para desenvolvimento local.
// Em produção, a ausência de JWT_SECRET causará erro de inicialização.
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET não definido no ambiente de produção.');
  }
  console.warn('⚠️ JWT_SECRET não definido. Usando fallback de desenvolvimento (NÃO usar em produção).');
}
const JWT_SECRET = new TextEncoder().encode(
  JWT_SECRET_RAW || crypto.randomUUID()
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
