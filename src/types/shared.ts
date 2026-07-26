/**
 * Tipos compartilhados para Peca e Categoria.
 * Centraliza definições que estavam duplicadas em 15+ arquivos.
 *
 * NOTA: Estas são as formas "completas" usadas nas páginas.
 * O módulo assistente-ia usa PecaResult/Categoria em Types/assistente.types.ts
 * que são versões específicas para o contexto da IA.
 */

export interface Peca {
  id: string;
  codigo: string;
  codigoBarras?: string;
  nome: string;
  marca?: string;
  quantidade: number;
  quantidadeLoja: number;
  estoqueMinimo: number;
  precoVenda: number;
  precoCusto: number;
  compatibilidade?: string;
  ativo: boolean;
  vitrine?: boolean;
  vitrinePreco?: number;
  categoriaId: string;
  categoria?: Categoria;
  createdAt?: string;
  fornecedor?: string;
  localizacao?: string;
  categorias?: string; // usado em alguns contextos como string agregada
}

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  _count?: { pecas: number };
}

/** Subcategoria para navegação hierárquica */
export interface Subcategoria {
  slug: string;
  nome: string;
  pecas: Peca[];
}
