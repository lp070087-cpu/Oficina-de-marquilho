'use client';

import { useState, useEffect, useMemo } from 'react';

interface EntradaTimeline {
  tipo: 'MOVIMENTACAO' | 'TRANSFERENCIA' | 'OS';
  subtipo?: string;
  data: string;
  quantidade: number;
  origem?: string;
  destino?: string;
  de?: string;
  para?: string;
  usuario?: string;
  observacao?: string;
  osNumero?: string;
  cliente?: string;
  precoUnitario?: number;
  adaptado?: boolean;
}

interface HistoricoPecaProps {
  pecaId: string;
  pecaNome: string;
}

type Filtro = 'TODOS' | 'MOVIMENTACAO' | 'TRANSFERENCIA' | 'OS';

export default function HistoricoPeca({ pecaId, pecaNome }: HistoricoPecaProps) {
  const [entradas, setEntradas] = useState<EntradaTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 20;

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pecas/historico?pecaId=${pecaId}`);
        const data = await res.json();
        setEntradas(Array.isArray(data) ? data : []);
      } catch {
        setEntradas([]);
      }
      setLoading(false);
    }
    if (pecaId) carregar();
  }, [pecaId]);

  const filtradas = useMemo(() => {
    if (filtro === 'TODOS') return entradas;
    return entradas.filter(e => e.tipo === filtro);
  }, [entradas, filtro]);

  const paginadas = useMemo(() => {
    return filtradas.slice(0, pagina * ITENS_POR_PAGINA);
  }, [filtradas, pagina]);

  const temMais = paginadas.length < filtradas.length;

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-6">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Carregando historico...</p>
      </div>
    );
  }

  const contagens = {
    TODOS: entradas.length,
    MOVIMENTACAO: entradas.filter(e => e.tipo === 'MOVIMENTACAO').length,
    TRANSFERENCIA: entradas.filter(e => e.tipo === 'TRANSFERENCIA').length,
    OS: entradas.filter(e => e.tipo === 'OS').length,
  };

  const tabs: { key: Filtro; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'MOVIMENTACAO', label: 'Movimentacoes' },
    { key: 'TRANSFERENCIA', label: 'Transferencias' },
    { key: 'OS', label: 'Ordens de Servico' },
  ];

  function getIcon(entrada: EntradaTimeline) {
    switch (entrada.tipo) {
      case 'MOVIMENTACAO':
        if (entrada.subtipo === 'ENTRADA' || entrada.subtipo === 'AJUSTE') return { icon: '📥', bg: 'bg-emerald-50 text-emerald-700', label: 'Entrada' };
        if (entrada.subtipo === 'SAIDA' || entrada.subtipo === 'VENDA') return { icon: '📤', bg: 'bg-red-50 text-red-700', label: 'Saida' };
        return { icon: '📦', bg: 'bg-slate-50 text-slate-700', label: entrada.subtipo || 'Movimentacao' };
      case 'TRANSFERENCIA':
        return { icon: '🚚', bg: 'bg-blue-50 text-blue-700', label: 'Transferencia' };
      case 'OS':
        return { icon: '🔧', bg: 'bg-purple-50 text-purple-700', label: 'OS' };
    }
  }

  function getDetalhe(entrada: EntradaTimeline) {
    switch (entrada.tipo) {
      case 'MOVIMENTACAO':
        return `${entrada.quantidade} un. · ${entrada.origem || ''}${entrada.destino ? ' → ' + entrada.destino : ''}`;
      case 'TRANSFERENCIA':
        return `${entrada.quantidade} un. · ${entrada.de} → ${entrada.para}`;
      case 'OS':
        return `${entrada.quantidade} un. · OS #${entrada.osNumero} · ${entrada.cliente}${entrada.adaptado ? ' (Adaptado)' : ''}`;
    }
  }

  const fmtData = (d: string) => {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Historico</h4>
        <span className="text-[10px] text-slate-400">{entradas.length} registros</span>
      </div>

      {/* Tabs de filtro */}
      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFiltro(tab.key); setPagina(1); }}
            className={`flex-1 text-[11px] font-medium px-2 py-1.5 rounded-md transition-colors relative ${
              filtro === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {contagens[tab.key] > 0 && (
              <span className={`ml-1 text-[9px] ${filtro === tab.key ? 'text-brand-600' : 'text-slate-400'}`}>
                ({contagens[tab.key]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtradas.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-xs text-slate-400">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-1">
          {paginadas.map((entrada, i) => {
            const { icon, bg, label } = getIcon(entrada);
            return (
              <div key={i} className="flex gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                {/* Linha do tempo visual */}
                <div className="relative flex flex-col items-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm ${bg}`}>
                    {icon}
                  </span>
                  {i < paginadas.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 mt-1 group-hover:bg-brand-200 transition-colors" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">{label}</p>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtData(entrada.data)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{getDetalhe(entrada)}</p>
                  {entrada.usuario && (
                    <p className="text-[10px] text-slate-400 mt-0.5">por: {entrada.usuario}</p>
                  )}
                  {entrada.observacao && (
                    <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">{entrada.observacao}</p>
                  )}
                  {entrada.tipo === 'OS' && entrada.precoUnitario && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Preco un.: {Number(entrada.precoUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {temMais && (
        <button
          onClick={() => setPagina(p => p + 1)}
          className="w-full text-xs font-medium text-brand-600 hover:text-brand-700 py-2 rounded-lg hover:bg-brand-50 transition-colors"
        >
          Carregar mais ({filtradas.length - paginadas.length} restantes)
        </button>
      )}
    </div>
  );
}
