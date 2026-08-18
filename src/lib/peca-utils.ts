import type { SessionUser } from '@/lib/auth';

/**
 * Sentinela de UI usada para o bucket "Sem subcategoria".
 * Deve existir SOMENTE na interface — nunca pode ser gravado na coluna subcategoria do banco.
 */
export const SUBCAT_SENTINELS = ['__sem_subcategoria__', '__sem_subcategoria__ '];

/**
 * Normaliza o valor de subcategoria vindo do frontend.
 * Sentinela "Sem subcategoria" ou string vazia → null (banco).
 * Qualquer outro valor → string limpa.
 */
export function normalizarSubcategoria(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '' || SUBCAT_SENTINELS.includes(s)) return null;
  return s;
}

/**
 * Regra oficial do sistema: somente DONO e ESTOQUE podem alterar
 * preço de venda e preço de custo. BALCAO/MECANICO apenas consultam.
 */
export function podeEditarPrecos(session: SessionUser | null): boolean {
  return !!session && (session.role === 'DONO' || session.role === 'ESTOQUE');
}

/**
 * Busca tokenizada (server-side, Prisma where).
 * Divide a query em palavras e exige que TODAS as palavras apareçam em PELO MENOS
 * um dos campos (AND de palavras × OR de campos), sempre case-insensitive.
 * Ex.: "pastilha freio cg" → cada palavra deve casar com nome/codigo/barras/marca/...
 * Retorna um array de condições para compor `where.AND` (ou `AND: []` se vazio).
 */
export function buildBuscaPorPalavras(q: string, campos: string[]): any[] {
  const palavras = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return palavras.map(palavra => ({
    OR: campos.map(campo => ({ [campo]: { contains: palavra, mode: 'insensitive' } })),
  }));
}

/** Campos de texto pesquisáveis de uma Peca (server + client). */
export const CAMPOS_BUSCA_PECA = [
  'nome',
  'codigo',
  'codigoBarras',
  'marca',
  'descricao',
  'subcategoria',
  'compatibilidade',
  'descricaoCurta',
  'localizacao',
] as const;

/**
 * Busca tokenizada client-side: TODAS as palavras da query devem aparecer em
 * PELO MENOS um dos campos informados (AND de palavras × OR de campos), sempre
 * case-insensitive. Ex.: "pastilha freio" casa com nome contendo "pastilha de
 * freio", "pastilha" e "freio" aparecendo separados, etc.
 */
export function pecaMatchBusca<T extends object>(p: T, q: string, campos: readonly string[]): boolean {
  const palavras = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return true;
  const rec = p as Record<string, unknown>;
  return palavras.every(palavra =>
    campos.some(campo => String(rec[campo] ?? '').toLowerCase().includes(palavra))
  );
}
