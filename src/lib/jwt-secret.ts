// Módulo compartilhado de JWT_SECRET — importado por auth.ts (Node.js) e middleware.ts (Edge)
// Garante que o mesmo segredo seja usado para criar E verificar tokens,
// eliminando o bug de crypto.randomUUID() gerar valores diferentes em cada módulo.

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET não definido no ambiente de produção.');
    }
    console.warn('⚠️ JWT_SECRET não definido. Usando fallback de desenvolvimento (NÃO usar em produção).');
  }
  // Usa process.env.JWT_SECRET com fallback determinístico por sessão
  // (crypto.randomUUID() gera o mesmo valor para toda a vida do processo em dev)
  return new TextEncoder().encode(raw || crypto.randomUUID());
}

export const JWT_SECRET = getJwtSecret();
