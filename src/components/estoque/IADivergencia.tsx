'use client';

import { useState } from 'react';
import type { PecaResult } from '@/components/assistente-ia/Types/assistente.types';

interface IADivergenciaProps {
  peca: {
    id: string; nome: string; codigo: string;
    quantidade: number; quantidadeLoja: number;
    estoqueMinimo: number; precoCusto: number; precoVenda: number;
  };
  historico: any[];
}

interface CausaPossivel {
  causa: string;
  descricao: string;
  confianca: number;
  icon: string;
}

export default function IADivergencia({ peca, historico }: IADivergenciaProps) {
  const [analisando, setAnalisando] = useState(false);
  const [causas, setCausas] = useState<CausaPossivel[]>([]);

  function analisar() {
    setAnalisando(true);
    const sugestoes: CausaPossivel[] = [];

    // Análise baseada nos dados disponíveis
    const entradas = historico.filter((h: any) =>
      h.tipo === 'MOVIMENTACAO' && (h.subtipo === 'ENTRADA' || h.subtipo === 'AJUSTE')
    );
    const saidas = historico.filter((h: any) =>
      h.tipo === 'MOVIMENTACAO' && (h.subtipo === 'SAIDA' || h.subtipo === 'VENDA' || h.subtipo === 'USO_OS')
    );
    const transferencias = historico.filter((h: any) => h.tipo === 'TRANSFERENCIA');
    const osEntradas = historico.filter((h: any) => h.tipo === 'OS');

    const totalEntradas = entradas.reduce((s: number, e: any) => s + (e.quantidade || 0), 0);
    const totalSaidas = saidas.reduce((s: number, s2: any) => s + (s2.quantidade || 0), 0);
    const totalTransf = transferencias.reduce((s: number, t: any) => {
      if (t.de === 'LOJA' && t.para === 'CENTRAL') return s - (t.quantidade || 0);
      if (t.de === 'CENTRAL' && t.para === 'LOJA') return s + (t.quantidade || 0);
      return s;
    }, 0);

    // Divergência: quantidade atual != (entradas - saídas ± transferências)
    const esperado = totalEntradas - totalSaidas - totalTransf;
    const divergencia = peca.quantidade - esperado;

    if (peca.quantidade <= 0 && totalEntradas > 0) {
      sugestoes.push({
        causa: 'Venda sem baixa no sistema',
        descricao: `${totalEntradas} un. deram entrada mas produto esta zerado. Possivelmente as saidas nao foram registradas.`,
        confianca: 82,
        icon: '🛒',
      });
    }

    if (divergencia < 0 && Math.abs(divergencia) > 0) {
      sugestoes.push({
        causa: 'Possivel saida nao registrada',
        descricao: `Diferenca de ${Math.abs(divergencia)} un. entre o esperado (${esperado}) e o atual (${peca.quantidade}).`,
        confianca: 78,
        icon: '📤',
      });
    }

    if (peca.quantidadeLoja > peca.quantidade && peca.quantidadeLoja > 0) {
      sugestoes.push({
        causa: 'Transferencia sem registro',
        descricao: `Loja tem ${peca.quantidadeLoja} un. e central tem ${peca.quantidade}. Transferencias podem nao ter sido registradas.`,
        confianca: 71,
        icon: '🚚',
      });
    }

    if (totalEntradas === 0 && peca.quantidade > 0) {
      sugestoes.push({
        causa: 'Cadastro inicial sem registro de entrada',
        descricao: `Produto possui ${peca.quantidade} un. em estoque mas nao ha registro de entrada. Provavelmente foi cadastrado manualmente.`,
        confianca: 65,
        icon: '📝',
      });
    }

    if (peca.quantidade <= peca.estoqueMinimo && totalEntradas > 0) {
      sugestoes.push({
        causa: 'Estoque abaixo do minimo',
        descricao: `Minimo configurado: ${peca.estoqueMinimo} un. Atual: ${peca.quantidade}. Necessaria reposicao.`,
        confianca: 90,
        icon: '⚠️',
      });
    }

    if (peca.precoCusto <= 0 && peca.precoVenda > 0) {
      sugestoes.push({
        causa: 'Erro de cadastro — Custo zerado',
        descricao: `Preco de venda: R$ ${Number(peca.precoVenda).toFixed(2)} mas custo esta zerado. Margem nao calculavel.`,
        confianca: 88,
        icon: '💰',
      });
    }

    if (peca.precoVenda <= 0 && peca.quantidade > 0) {
      sugestoes.push({
        causa: 'Produto sem preco de venda',
        descricao: 'O produto possui estoque mas nao tem preco de venda cadastrado.',
        confianca: 95,
        icon: '🏷️',
      });
    }

    // Se não encontrou causas específicas
    if (sugestoes.length === 0) {
      sugestoes.push({
        causa: 'Nenhuma divergencia detectada',
        descricao: 'O estoque parece consistente com os registros de movimentacao.',
        confianca: 60,
        icon: '✅',
      });
    }

    // Simula delay da IA
    setTimeout(() => {
      setCausas(sugestoes);
      setAnalisando(false);
    }, 600);
  }

  const confiancaCor = (c: number) =>
    c >= 85 ? 'text-emerald-600 bg-emerald-50' : c >= 70 ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-50';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Análise de Divergencia (IA)</h4>
        <button
          onClick={analisar}
          disabled={analisando}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
        >
          {analisando ? '🧠 Analisando...' : causas.length > 0 ? '🔄 Reanalisar' : '🧠 Analisar'}
        </button>
      </div>

      {analisando && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-xs text-slate-500">IA analisando movimentacoes do produto...</p>
        </div>
      )}

      {!analisando && causas.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-400 uppercase font-medium">
            Possiveis causas ({causas.length})
          </p>
          {causas.map((c, i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{c.icon}</span>
                  <p className="text-xs font-semibold text-slate-800">{c.causa}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${confiancaCor(c.confianca)}`}>
                  {c.confianca}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 ml-7">{c.descricao}</p>
            </div>
          ))}
          <p className="text-[9px] text-amber-500 italic mt-2">
            ⚠️ Estas sao apenas sugestoes da IA. Nenhuma alteracao foi feita automaticamente. Verifique antes de agir.
          </p>
        </div>
      )}
    </div>
  );
}
