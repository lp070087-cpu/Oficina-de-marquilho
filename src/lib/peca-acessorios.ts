/**
 * TIPOS DE ACESSÓRIO — controle de cadastro de peças da categoria ACESSÓRIOS.
 *
 * Fonte ÚNICA compartilhada entre:
 *   - /estoque/central   (Estoque Central)
 *   - /dono/estoque      (Área da DONA)
 *
 * Reutiliza o campo EXISTENTE `Peca.subcategoria` (String?) para armazenar o
 * "tipo de acessório" — NENHUMA migration é necessária para esta parte.
 *
 * TAMANHO / GÊNERO:
 * - Armazenados nos campos `Peca.tamanho` (String?) e `Peca.genero` (String?).
 * - Capacete  → tamanho numérico (54, 56, 58, 60, 62, 64) — apenas TAMANHO.
 * - Capa de chuva → gênero (MASCULINO/FEMININO) + tamanho (P, M, G, GG).
 * - Demais tipos → ambos NULL.
 * - REGRA DE ESTOQUE: cada cadastro é UM tamanho/gênero (seleção única). Como
 *   cada Peca tem `codigo` único + `quantidade`/`quantidadeLoja` próprios, o
 *   estoque de cada tamanho fica naturalmente separado por SKU — sem sistema
 *   de variações. Ex.: CAPA-M-G (quantidade própria), CAPA-M-GG (outra peça).
 */

/** Slug canônico da categoria ACESSÓRIOS (ver prisma/seed.ts). */
export const CATEGORIA_ACESSORIOS_SLUG = 'acessorios';

/** Lista oficial (aprovada na instrução da DONA) de tipos de acessório. */
export const TIPOS_ACESSORIOS = [
  'Capacete',
  'Luva',
  'Cortador de pipa',
  'Capa de chuva',
  'Carregador de moto',
  'Suporte para celular',
] as const;

/** Tipo que exige o campo TAMANHO numérico do capacete. */
export const TIPO_CAPACETE = 'Capacete';

/** Tipo que exige GÊNERO + TAMANHO (P/M/G/GG). */
export const TIPO_CAPA_CHUVA = 'Capa de chuva';

/**
 * Lista OFICIAL (APROVADA pela DONA em 19/08/2026) de tamanhos de capacete.
 * Padrão de mercado brasileiro — circunferência da cabeça em cm, passos de 2.
 */
export const TAMANHOS_CAPACETE = ['54', '56', '58', '60', '62', '64'] as const;

/** Lista oficial de tamanhos de CAPA DE CHUVA. */
export const TAMANHOS_CAPA_CHUVA = ['P', 'M', 'G', 'GG'] as const;

/** Lista oficial de GÊNEROS de CAPA DE CHUVA. */
export const GENEROS_CAPA_CHUVA = ['MASCULINO', 'FEMININO'] as const;

/** Tipos de acessório que exigem seleção de TAMANHO (capacete + capa de chuva). */
export const TIPOS_ACESSORIOS_COM_TAMANHO: ReadonlySet<string> = new Set([TIPO_CAPACETE, TIPO_CAPA_CHUVA]);

/** Tipos de acessório que exigem seleção de GÊNERO (apenas capa de chuva). */
export const TIPOS_ACESSORIOS_COM_GENERO: ReadonlySet<string> = new Set([TIPO_CAPA_CHUVA]);

/** Normaliza para comparação (lowercase, sem acentos, sem espaços extras). */
export function normalizarChave(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta se uma categoria (objeto com `slug`/`nome`) é ACESSÓRIOS.
 * Usa slug OU nome normalizado (defensivo: alguns bancos podem ter variações de acento).
 */
export function ehCategoriaAcessorios(cat: { slug?: string; nome?: string } | null | undefined): boolean {
  if (!cat) return false;
  const slug = normalizarChave(cat.slug || '');
  const nome = normalizarChave(cat.nome || '');
  return slug === CATEGORIA_ACESSORIOS_SLUG || nome === CATEGORIA_ACESSORIOS_SLUG;
}

/** True se o tipo de acessório selecionado exige campo TAMANHO. */
export function tipoExigeTamanho(tipo: string | undefined | null): boolean {
  return !!tipo && TIPOS_ACESSORIOS_COM_TAMANHO.has(tipo);
}

/** True se o tipo de acessório selecionado exige campo GÊNERO. */
export function tipoExigeGenero(tipo: string | undefined | null): boolean {
  return !!tipo && TIPOS_ACESSORIOS_COM_GENERO.has(tipo);
}

/** True se o tipo selecionado é CAPACETE. */
export function tipoEhCapacete(tipo: string | undefined | null): boolean {
  return !!tipo && normalizarChave(tipo) === normalizarChave(TIPO_CAPACETE);
}

/** True se o tipo selecionado é CAPA DE CHUVA. */
export function tipoEhCapaChuva(tipo: string | undefined | null): boolean {
  return !!tipo && normalizarChave(tipo) === normalizarChave(TIPO_CAPA_CHUVA);
}

/** Lista de tamanhos válidos para o tipo selecionado (undefined → nenhum). */
export function tamanhosParaTipo(tipo: string | undefined | null): readonly string[] {
  if (tipoEhCapacete(tipo)) return TAMANHOS_CAPACETE;
  if (tipoEhCapaChuva(tipo)) return TAMANHOS_CAPA_CHUVA;
  return [];
}
