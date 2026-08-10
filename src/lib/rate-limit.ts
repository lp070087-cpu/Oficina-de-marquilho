/**
 * Rate Limiter — in-memory, zero dependencies
 *
 * Protege endpoints sensíveis contra brute-force e DoS.
 * Armazena contadores por IP em um Map com janela de tempo.
 * Limpo periodicamente para evitar vazamento de memória.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  reset: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpeza de entradas expiradas a cada 60s
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

function getClientIp(request: Request): string {
  // C22 — Em produção, usar x-forwarded-for (proxy confiável/Vercel/Nginx)
  // O header x-forwarded-for é seguro quando atrás de proxy reverso confiável
  // (Nginx/Vercel definem o primeiro IP como o real do cliente)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Fallback: x-real-ip ou cabeçalho customizado
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // Último fallback (dev/localhost)
  return '127.0.0.1';
}

interface RateLimitOptions {
  /** Identificador único para esta rota (ex: 'auth:login') */
  key: string;
  /** Número máximo de requisições na janela */
  maxRequests: number;
  /** Janela de tempo em milissegundos (padrão: 60s) */
  windowMs?: number;
}

/**
 * Verifica se uma requisição excedeu o limite de taxa.
 * Retorna { limited, remaining, reset }.
 *
 * Uso:
 *   const rl = checkRateLimit(req, { key: 'auth:login', maxRequests: 5 });
 *   if (rl.limited) return NextResponse.json({ error: 'Muitas requisições' }, { status: 429 });
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): RateLimitResult {
  cleanup();

  const windowMs = options.windowMs || 60_000;
  const now = Date.now();
  const ip = getClientIp(request);
  const storeKey = `${options.key}:${ip}`;

  const existing = store.get(storeKey);

  if (!existing || now > existing.resetTime) {
    // Primeira requisição ou janela expirada
    store.set(storeKey, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { limited: false, remaining: options.maxRequests - 1, reset: now + windowMs };
  }

  existing.count++;

  if (existing.count > options.maxRequests) {
    return { limited: true, remaining: 0, reset: existing.resetTime };
  }

  return {
    limited: false,
    remaining: options.maxRequests - existing.count,
    reset: existing.resetTime,
  };
}

/**
 * Retorna os headers HTTP padrão para rate limiting (RateLimit-*).
 * Adicionar à resposta quando a rota usa checkRateLimit.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.limited ? 0 : result.remaining >= 0 ? 0 : 0)),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  };
}
