// Tipos compartilhados para o sistema de Entrada Inteligente de Estoque

export type FormatoEntrada = 'csv' | 'excel' | 'pdf' | 'imagem' | 'ia';

export interface ProdutoExtraido {
  id: string; // uuid temporário para key no React
  codigo: string;
  codigoBarras: string;
  ean: string;
  nome: string;
  descricao: string;
  marca: string;
  categoria: string;
  subcategoria: string;
  compatibilidade: string;
  modelo: string;
  ano: string;
  aplicacao: string;
  fornecedor: string;
  precoCusto: string;
  precoVenda: string;
  quantidade: string;
  quantidadeLoja: string;
  estoqueMinimo: string;
  unidade: string;
  localizacao: string;
  observacoes: string;

  // Metadata
  status: 'novo' | 'existente' | 'duplicado' | 'erro';
  pecaExistente?: any;
  erroValidacao?: string;
  selecionado: boolean;
}

export interface StatsRevisao {
  total: number;
  novos: number;
  existentes: number;
  duplicados: number;
  comErro: number;
  selecionados: number;
  totalUnidades: number;
}

export interface ResultadoImportacao {
  criados: number;
  atualizados: number;
  ignorados: number;
  duplicados: number;
  erros: number;
  totalProcessado: number;
  tempoMs: number;
  arquivo: string;
  formato: FormatoEntrada;
  data: string;
  linhasComErro: string[];
}

export interface LogImportacao extends ResultadoImportacao {
  id: string;
  usuario: string;
  createdAt: string;
}
