'use client';

import type { FichaCadastro } from './cadastro.types';

export interface Categoria { id: string; nome: string; slug: string; }

export interface PecaResult {
  id: string; nome: string; codigo: string; codigoBarras?: string;
  precoVenda: number; precoCusto: number; quantidade: number; quantidadeLoja: number;
  estoqueMinimo: number; marca?: string; compatibilidade?: string;
  categoria: { nome: string; id: string; slug: string };
  subcategoria?: string; localizacao?: string;
}

export interface Message {
  id: string; role: 'user' | 'assistant'; content: string;
  data?: any; actions?: ActionCard[];
  trace?: InterpretationTrace;
  fichaCadastro?: FichaCadastro;
}

export interface ActionCard {
  type: 'confirm_cadastro' | 'confirm_edicao' | 'confirm_ajuste_qtd' | 'confirm_ajuste_preco' | 'list_estoque_baixo' | 'list_sem_estoque' | 'list_produtos';
  title: string; description: string; payload: any; onConfirm?: string;
}

export interface Conversa {
  id: string; titulo: string; data: Date; messages: Message[]; favorita: boolean;
}

export interface ParsedCommand {
  intent: 'adicionar' | 'alterar_preco' | 'alterar_qtd' | 'mostrar_baixo' | 'mostrar_zerado' | 'mostrar_vendidos' | 'mostrar_parados' | 'buscar' | 'ajudar' | 'desconhecido';
  produto?: string; quantidade?: number; preco?: number;
  marca?: string; sku?: string; raw: string;
  confianca: number;
  matchedPattern: string;
}

export interface InterpretationTrace {
  frase: string;
  intent: string;
  intentLabel: string;
  acao: string;
  confianca: number;
  params: string[];
  sucesso: boolean;
  resumo: string;
  icon: string;
}

export interface HistoricoAcao {
  id: string;
  horario: Date;
  tipo: string;
  resumo: string;
  resultado: 'sucesso' | 'erro' | 'pendente';
  icon: string;
  confianca: number;
  intent: string;
}
