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
 * Remove campos internos do payload público da Vitrine.
 * NUNCA expor: preço de custo, custo médio, estoque mínimo, estoque central (quantidade).
 * `quantidadeLoja` é mantido (é o estoque vendável, usado para limite do carrinho e
 * indicação de disponibilidade — sem exibir o número ao cliente).
 */
export function publicarPeca(p: any) {
  if (!p) return p;
  const { precoCusto, custoMedio, estoqueMinimo, quantidade, localizacao, ...publico } = p;
  return publico;
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
