/**
 * Regra oficial de visibilidade da Vitrine (definida pela DONA, correção 2026-08-18):
 * um produto SÓ aparece na loja virtual se TODAS as condições forem verdadeiras:
 *   - ativo
 *   - quantidadeLoja > 0  (tem estoque na loja para vender)
 *   - precoVenda > 0      (produto com preço R$0 NUNCA aparece — não inventar preço)
 * OBS: a flag manual `vitrine` foi REMOVIDA da regra — produtos ativos, com estoque
 * na loja e preço válido aparecem automaticamente (correção da DONA).
 */
export const VITRINE_VISIBILITY = {
  ativo: true,
  quantidadeLoja: { gt: 0 },
  precoVenda: { gt: 0 },
} as const;

/** Campos escalares pesquisáveis da busca da Vitrine (mesma lógica tokenizada do sistema interno). */
export const CAMPOS_BUSCA_VITRINE = [
  'nome',
  'codigo',
  'codigoBarras',
  'marca',
  'descricao',
  'descricaoCurta',
  'compatibilidade',
  'subcategoria',
  'tamanho',
  'genero',
] as const;

/**
 * Busca tokenizada da Vitrine com suporte a CATEGORIA (relação `categoria.nome`).
 * Ex.: "freio iron bros" → cada palavra deve casar com nome/codigo/marca/... OU
 * com o nome da categoria (categoria=Freios, marca=IRON, compatibilidade=BROS).
 * Retorna array de condições para compor `where.AND`.
 */
export function buildBuscaVitrine(q: string): any[] {
  const palavras = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return palavras.map(palavra => ({
    OR: [
      ...CAMPOS_BUSCA_VITRINE.map(campo => ({ [campo]: { contains: palavra, mode: 'insensitive' } })),
      { categoria: { nome: { contains: palavra, mode: 'insensitive' } } },
    ],
  }));
}

/** Select padrão de categoria para a Vitrine (inclui parentId para resolver subcategorias). */
export const CATEGORIA_SELECT = {
  select: { nome: true, slug: true, parentId: true },
} as const;

/** Número de WhatsApp da loja para links de dúvida (padrão internacional sem '+'/'('). */
export const WHATSAPP_LOJA = '558198143879';

/**
 * PREÇO PÚBLICO OFICIAL DA VITRINE (fonte única).
 *
 * Precedência (rodada de melhorias 2026-08-19, item 6 — "preço exclusivo da Vitrine"):
 *   1. precoVitrine  → override definido SOMENTE na área da DONA (Vitrine). NUNCA altera
 *                      precoVenda / precoOferta → PDV, OS, Caixa, Financeiro e Notas ficam intactos.
 *   2. precoOferta   → quando a oferta existe e é menor que o preço de venda (comportamento legado).
 *   3. precoVenda    → preço normal do estoque (fallback quando NÃO há override e NÃO há oferta).
 *
 * Ex.: Estoque R$110 / Vitrine R$99 → precoVitrine=99, precoVenda continua 110; a Vitrine exibe 99.
 * A fórmula `precoVitrine ?? (oferta ? precoOferta : precoVenda)` garante que o override só
 * vale para a Vitrine — os fluxos internos continuam lendo precoVenda/precoOferta diretamente.
 */
export function precoPublico(p: any): number {
  if (!p) return 0;
  const pv = p.precoVitrine != null ? Number(p.precoVitrine) : NaN;
  if (Number.isFinite(pv) && pv > 0) return pv;
  const temOferta = p.oferta && p.precoOferta != null && Number(p.precoOferta) > 0;
  if (temOferta && Number(p.precoOferta) < Number(p.precoVenda)) return Number(p.precoOferta);
  return Number(p.precoVenda) || 0;
}

/**
 * Nomes normalizados para ORDENAÇÃO de categorias no topo da Vitrine (item 2).
 * NORMALIZAÇÃO SÓ PARA ORDENAÇÃO — nunca altera os dados reais (nome/slug permanecem intactos).
 * Ordem oficial: 1. CAPACETES, 2. CAPAS, 3. ACESSÓRIOS — depois as demais (ordem alfabética).
 */
export function normalizarNome(nome: string): string {
  return (nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const NOMES_PRIORIDADE_VITRINE = ['capacete', 'capas', 'acessorio'];

/** Retorna o índice de prioridade (0, 1, 2) ou 99 para as demais. */
export function indicePrioridadeCategoria(nome: string): number {
  const n = normalizarNome(nome);
  const idx = NOMES_PRIORIDADE_VITRINE.findIndex(p => n.includes(p) || p.includes(n));
  return idx === -1 ? 99 : idx;
}

/** Comparador de ordenação de categorias para a Vitrine (prioridade primeiro, depois alfabético). */
export function compararCategoriasVitrine(a: { nome: string }, b: { nome: string }): number {
  const ia = indicePrioridadeCategoria(a.nome);
  const ib = indicePrioridadeCategoria(b.nome);
  if (ia !== ib) return ia - ib;
  return normalizarNome(a.nome).localeCompare(normalizarNome(b.nome), 'pt-BR');
}

/**
 * Remove campos internos do payload público da Vitrine.
 * NUNCA expor: preço de custo, custo médio, estoque mínimo, estoque central (quantidade).
 * `quantidadeLoja` é mantido (é o estoque vendável, usado para limite do carrinho e
 * indicação de disponibilidade — sem exibir o número ao cliente).
 * `precoVitrine` é mantido (override público de preço — leitura permitida; escrita só DONO).
 */
export function publicarPeca(p: any) {
  if (!p) return p;
  const { precoCusto, custoMedio, estoqueMinimo, quantidade, localizacao, ...publico } = p;
  return publico;
}

/**
 * Helper para exibir o atributo de tamanho/gênero de um acessório na Vitrine.
 * Capacete → "Tamanho: 58" · Capa de chuva → "Masculino • G".
 * Retorna null quando não aplicável (nenhum tamanho/gênero cadastrado).
 */
export function rotuloAtributosAcessorio(p: any): string | null {
  if (!p) return null;
  const genero = p.genero ? String(p.genero) : null;
  const tamanho = p.tamanho ? String(p.tamanho) : null;
  if (!genero && !tamanho) return null;
  if (genero && tamanho) return `${genero} • ${tamanho}`;
  if (genero) return genero;
  // Só tamanho → Capacete ("Tamanho: 58"). Caso defensivo: se não for capacete, "Tamanho X".
  const sub = normalizarNome(p.subcategoria || '');
  if (sub === 'capacete') return `Tamanho: ${tamanho}`;
  return `Tamanho ${tamanho}`;
}

/** Gera slug a partir de um nome (marca, etc). */
export function slugDeNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
