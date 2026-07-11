import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'marquinho-motopecas-jwt-secret-key-2026-super-segura'
);

const roleRoutes: Record<string, string[]> = {
  '/dono': ['DONO'],
  '/balcao': ['BALCAO'],
  '/mecanico': ['MECANICO'],
  '/estoque': ['ESTOQUE'],
};

const publicPaths = ['/api/auth/login', '/api/vitrine', '/api/categorias', '/vitrine', '/uploads', '/icon-192.png', '/icon-512.png', '/manifest.json', '/sw.js'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and public paths
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/vitrine') ||
    pathname.startsWith('/api/categorias') ||
    pathname.startsWith('/vitrine') ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    for (const [prefix, roles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(prefix) && !roles.includes(role)) {
        const redirectMap: Record<string, string> = {
          DONO: '/dono', BALCAO: '/balcao', MECANICO: '/mecanico', ESTOQUE: '/estoque',
        };
        return NextResponse.redirect(new URL(redirectMap[role] || '/', request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
