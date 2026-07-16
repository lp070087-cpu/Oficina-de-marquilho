import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'marquinho-motopecas-jwt-secret-key-2026-super-segura'
);

// Domain configuration
const STORE_DOMAIN = process.env.NEXT_PUBLIC_STORE_DOMAIN || '';
const PANEL_DOMAIN = process.env.NEXT_PUBLIC_PANEL_DOMAIN || '';

// Routes that are only allowed on the main store domain
const STORE_ONLY_ROUTES = ['/vitrine', '/api/vitrine/clientes', '/api/vitrine/orcamentos'];
// Routes that require admin panel domain
const PANEL_REQUIRED_ROUTES = ['/dono', '/balcao', '/mecanico', '/estoque'];

const roleRoutes: Record<string, string[]> = {
  '/dono': ['DONO'],
  '/balcao': ['BALCAO'],
  '/mecanico': ['MECANICO'],
  '/estoque': ['ESTOQUE'],
};

// API perms by role
const apiPerms: Record<string, string[]> = {
  '/api/fornecedores': ['DONO'],
  '/api/usuarios': ['DONO'],
  '/api/importar': ['DONO', 'ESTOQUE'],
  '/api/relatorios': ['DONO', 'ESTOQUE'],
  '/api/upload': ['DONO', 'BALCAO', 'ESTOQUE'],
};

const publicPaths = [
  '/api/auth/login', '/api/vitrine', '/api/categorias', '/vitrine',
  '/uploads', '/icon-192.png', '/icon-512.png', '/manifest.json', '/sw.js',
];

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Allow static and public
  if (pathname.startsWith('/_next') || publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  if (publicPaths.some(p => pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))) {
    return NextResponse.next();
  }

  // Domain routing (only in production with custom domains)
  if (process.env.NODE_ENV === 'production' && STORE_DOMAIN && PANEL_DOMAIN) {
    const isStoreDomain = hostname === STORE_DOMAIN || hostname === 'www.' + STORE_DOMAIN;
    const isPanelDomain = hostname === PANEL_DOMAIN;

    if (isStoreDomain && PANEL_REQUIRED_ROUTES.some(r => pathname.startsWith(r))) {
      const panelUrl = new URL(pathname, 'https://' + PANEL_DOMAIN);
      return NextResponse.redirect(panelUrl);
    }
    if (isPanelDomain && STORE_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
      const storeUrl = new URL(pathname, 'https://' + STORE_DOMAIN);
      return NextResponse.redirect(storeUrl);
    }
  }

  // Login page is always allowed
  if (pathname === '/') return NextResponse.next();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    // For vitrine routes (public store), allow without auth
    if (pathname.startsWith('/vitrine') || pathname.startsWith('/api/vitrine/clientes') || pathname.startsWith('/api/vitrine/orcamentos') || pathname.startsWith('/api/categorias')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    const tipoBalcao = (payload.tipoBalcao as string) || '';

    // API permission checks
    for (const [prefix, allowedRoles] of Object.entries(apiPerms)) {
      if (pathname.startsWith(prefix) && !allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
      }
    }

    // Role-based routing
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
