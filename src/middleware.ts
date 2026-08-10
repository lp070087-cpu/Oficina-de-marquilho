import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/jwt-secret';

// Domain configuration
const STORE_DOMAIN = process.env.NEXT_PUBLIC_STORE_DOMAIN || '';
const PANEL_DOMAIN = process.env.NEXT_PUBLIC_PANEL_DOMAIN || '';

// Routes that are only allowed on the main store domain
const STORE_ONLY_ROUTES = ['/vitrine', '/api/vitrine/clientes', '/api/vitrine/orcamentos'];
// Routes that require admin panel domain
const PANEL_REQUIRED_ROUTES = ['/dono', '/balcao', '/estoque'];

const roleRoutes: Record<string, string[]> = {
	'/dono': ['DONO'],
	'/balcao': ['BALCAO'],
	'/estoque': ['ESTOQUE'],
};

// API perms by role — segunda camada de proteção (APIs também têm getSession() inline)
const apiPerms: Record<string, string[]> = {
	'/api/fornecedores': ['DONO'],
	'/api/usuarios': ['DONO'],
	'/api/importar': ['DONO', 'ESTOQUE'],
	'/api/relatorios': ['DONO', 'ESTOQUE'],
	'/api/upload': ['DONO', 'BALCAO', 'ESTOQUE'],
	// FASE 4 — APIs admin internas
	'/api/financeiro': ['DONO'],
	'/api/dashboard': ['DONO', 'BALCAO', 'ESTOQUE'],
	'/api/admin': ['DONO'],
	// C21 — Expandir permissões: notificações, lembretes, eventos, notas, mensagens e configurações
	// também acessíveis por BALCAO e ESTOQUE (rotas já filtram por usuarioId inline)
	'/api/notificacoes': ['DONO', 'BALCAO', 'ESTOQUE'],
	'/api/eventos': ['DONO', 'BALCAO', 'ESTOQUE'],
	'/api/lembretes': ['DONO', 'BALCAO', 'ESTOQUE'],
	'/api/notas': ['DONO', 'BALCAO', 'ESTOQUE'],
	'/api/mensagens': ['DONO', 'BALCAO', 'ESTOQUE'],
	'/api/configuracoes': ['DONO', 'BALCAO', 'ESTOQUE'],
	// APIs operacionais compartilhadas
	'/api/mecanicos': ['DONO', 'ESTOQUE'],
	'/api/servicos': ['DONO', 'BALCAO'],
	'/api/checklist-templates': ['DONO', 'BALCAO'],
	'/api/revisoes': ['DONO', 'BALCAO'],
	'/api/transferencia': ['DONO', 'ESTOQUE'],
	'/api/whatsapp': ['DONO', 'BALCAO'],
	'/api/vendas': ['DONO', 'BALCAO'],
	'/api/pedidos': ['DONO', 'BALCAO'],
	'/api/caixa': ['DONO', 'BALCAO'],
	'/api/ordens': ['DONO', 'BALCAO'],
	'/api/estoque': ['DONO', 'ESTOQUE'],
};

const publicPaths = [
	'/api/auth/login', '/api/vitrine', '/api/categorias', '/vitrine',
	// C2 — Permitir acesso público ao portal do cliente (login/cadastro via /cliente e /api/cliente)
	'/api/cliente', '/cliente',
	'/uploads', '/icon-192.png', '/icon-512.png', '/manifest.json', '/sw.js',
];

// Security headers applied to all responses
function applySecurityHeaders(response: NextResponse): NextResponse {
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	// HSTS: max-age=1 ano, inclui subdomínios (remover preload se não registrado)
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	// Permissions-Policy: restringe APIs sensíveis do navegador
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
}

// Retorna resposta com headers de segurança (para uso em early returns)
function nextWithHeaders(request: NextRequest): NextResponse {
	return applySecurityHeaders(NextResponse.next());
}

export async function middleware(request: NextRequest) {
	const { pathname, hostname } = request.nextUrl;

	// Allow static and public
	if (pathname.startsWith('/_next') || publicPaths.includes(pathname)) {
		return applySecurityHeaders(NextResponse.next());
	}
	if (publicPaths.some(p => pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))) {
		return applySecurityHeaders(NextResponse.next());
	}

	// Domain routing (only in production with custom domains)
	if (process.env.NODE_ENV === 'production' && STORE_DOMAIN && PANEL_DOMAIN) {
		const isStoreDomain = hostname === STORE_DOMAIN || hostname === 'www.' + STORE_DOMAIN;
		const isPanelDomain = hostname === PANEL_DOMAIN;

		if (isStoreDomain && PANEL_REQUIRED_ROUTES.some(r => pathname.startsWith(r))) {
			const panelUrl = new URL(pathname, 'https://' + PANEL_DOMAIN);
			return applySecurityHeaders(NextResponse.redirect(panelUrl));
		}
		if (isPanelDomain && STORE_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
			const storeUrl = new URL(pathname, 'https://' + STORE_DOMAIN);
			return applySecurityHeaders(NextResponse.redirect(storeUrl));
		}
	}

	// Login page is always allowed
	if (pathname === '/') return nextWithHeaders(request);

	const token = request.cookies.get('token')?.value;
	if (!token) {
		// For vitrine routes (public store), allow without auth
		if (pathname.startsWith('/vitrine') || pathname.startsWith('/api/vitrine/clientes') || pathname.startsWith('/api/vitrine/orcamentos') || pathname.startsWith('/api/categorias')) {
			return nextWithHeaders(request);
		}
		return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
	}

	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		const role = payload.role as string;

		// API permission checks
		for (const [prefix, allowedRoles] of Object.entries(apiPerms)) {
			if (pathname.startsWith(prefix) && !allowedRoles.includes(role)) {
				return applySecurityHeaders(NextResponse.json({ error: 'Nao autorizado' }, { status: 403 }));
			}
		}

		// Role-based routing
		for (const [prefix, roles] of Object.entries(roleRoutes)) {
			if (pathname.startsWith(prefix) && !roles.includes(role)) {
				const redirectMap: Record<string, string> = {
					DONO: '/dono', BALCAO: '/balcao', ESTOQUE: '/estoque',
				};
				return applySecurityHeaders(NextResponse.redirect(new URL(redirectMap[role] || '/', request.url)));
			}
		}

		// FASE 4 — tipoBalcao enforcement (server-side, not just Sidebar hiding)
		if (role === 'BALCAO' && pathname.startsWith('/balcao')) {
			const tipoBalcao = payload.tipoBalcao as string | undefined;
			// Rotas restritas a VENDA_LOJA (PDV, venda avulsa, caixa)
			const vendaOnlyRoutes = ['/balcao/pdv', '/balcao/venda', '/balcao/caixa'];
			if (tipoBalcao === 'SERVICOS' && vendaOnlyRoutes.some(r => pathname.startsWith(r))) {
				return applySecurityHeaders(NextResponse.redirect(new URL('/balcao', request.url)));
			}
		}

		return nextWithHeaders(request);
	} catch {
		return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
	}
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
