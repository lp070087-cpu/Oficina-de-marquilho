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
