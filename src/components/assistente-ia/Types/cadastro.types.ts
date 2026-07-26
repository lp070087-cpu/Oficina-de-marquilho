'use client';
export type ModoCadastro = 'texto' | 'foto' | 'audio' | 'codigo';
export type StatusCampo = 'preenchido' | 'pendente';

export interface FichaCadastro {
  codigo: string;
  nome: string;
  categoria: string;
  categoriaId: string;
  marca: string;
  aplicacao: string;
  preco: string;
  quantidade: string;
  fornecedor: string;
  localizacao: string;
  observacoes: string;
  imagemPreview: string | null;
  statusGeral: 'rascunho' | 'completo' | 'validando';
}

export interface CampoStatus { campo: string; label: string; valor: string; status: StatusCampo; icon: string; }

export const FICHA_CADASTRO_INICIAL: FichaCadastro = {
  codigo: '', nome: '', categoria: '', categoriaId: '',
  marca: '', aplicacao: '', preco: '', quantidade: '1',
  fornecedor: '', localizacao: '', observacoes: '', imagemPreview: null,
  statusGeral: 'rascunho',
};
