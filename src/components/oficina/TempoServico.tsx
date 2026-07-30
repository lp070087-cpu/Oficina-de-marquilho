'use client';

import { useState, useCallback } from 'react';

interface TempoServicoProps {
  osId: string;
  tempoEstimado?: number | null;
  inicioServico?: string | null;
  fimServico?: string | null;
  onUpdate?: () => void;
}

export default function TempoServico({ osId, tempoEstimado: estimadoInicial, inicioServico: inicioInicial, fimServico: fimInicial, onUpdate }: TempoServicoProps) {
  const [tempoEstimado, setTempoEstimado] = useState(estimadoInicial || null);
  const [inicioServico, setInicioServico] = useState(inicioInicial || null);
  const [fimServico, setFimServico] = useState(fimInicial || null);
  const [editandoEstimado, setEditandoEstimado] = useState(false);
  const [valorEstimado, setValorEstimado] = useState(String(tempoEstimado || ''));
  const [agora, setAgora] = useState(new Date());

  // Atualizar relogio a cada 30s
  useState(() => {
    const t = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(t);
  });

  async function acaoTempo(acao: 'INICIAR' | 'FINALIZAR') {
    try {
      const res = await fetch(`/api/ordens/${osId}/tempo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      });
      const data = await res.json();
      if (res.ok) {
        if (acao === 'INICIAR') setInicioServico(data.inicioServico);
        if (acao === 'FINALIZAR') setFimServico(data.fimServico);
        onUpdate?.();
      }
    } catch { /* ignore */ }
  }

  async function salvarEstimado() {
    const min = parseInt(valorEstimado) || 0;
    try {
      const res = await fetch(`/api/ordens/${osId}/tempo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'ESTIMAR', tempoEstimado: min }),
      });
      if (res.ok) {
        setTempoEstimado(min);
        setEditandoEstimado(false);
        onUpdate?.();
      }
    } catch { /* ignore */ }
  }

  // Calcular tempo gasto
  const inicio = inicioServico ? new Date(inicioServico) : null;
  const fim = fimServico ? new Date(fimServico) : null;
  const tempoGasto = inicio ? Math.round(((fim || agora).getTime() - inicio.getTime()) / 60000) : 0;
  const tempoRestante = tempoEstimado ? Math.max(0, tempoEstimado - tempoGasto) : null;
  const excedido = tempoEstimado && tempoGasto > tempoEstimado;

  const formatMin = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min}min` : `${min}min`;
  };

  const status = !inicioServico ? 'AGUARDANDO' : fimServico ? 'FINALIZADO' : 'EM_ANDAMENTO';

  return (
    <div className="space-y-4">
      {/* Status visual */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
          status === 'FINALIZADO' ? 'bg-emerald-50 border border-emerald-200' :
          status === 'EM_ANDAMENTO' ? 'bg-brand-50 border border-brand-200' :
          'bg-slate-50 border border-slate-200'
        }`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            status === 'FINALIZADO' ? 'bg-emerald-500' : status === 'EM_ANDAMENTO' ? 'bg-brand-500' : 'bg-slate-400'
          }`} />
          <span className={`text-sm font-bold ${
            status === 'FINALIZADO' ? 'text-emerald-700' : status === 'EM_ANDAMENTO' ? 'text-brand-700' : 'text-slate-600'
          }`}>
            {status === 'FINALIZADO' ? 'Serviço Finalizado' : status === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Aguardando Início'}
          </span>
        </div>
      </div>

      {/* Cards de tempo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Tempo Estimado */}
        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
          <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Estimado</p>
          {editandoEstimado ? (
            <div className="flex items-center gap-1">
              <input type="number" value={valorEstimado} onChange={e => setValorEstimado(e.target.value)}
                className="input-field text-xs w-16 text-center" min="0" autoFocus />
              <button onClick={salvarEstimado} className="text-emerald-600 p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></button>
              <button onClick={() => { setEditandoEstimado(false); setValorEstimado(String(tempoEstimado || '')); }} className="text-red-500 p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
          ) : (
            <p className="text-lg font-bold text-slate-700 cursor-pointer hover:text-brand-600" onClick={() => setEditandoEstimado(true)}>
              {tempoEstimado ? formatMin(tempoEstimado) : '—'}
            </p>
          )}
        </div>

        {/* Tempo Gasto */}
        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
          <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Gasto</p>
          <p className={`text-lg font-bold ${excedido ? 'text-red-600' : 'text-slate-700'}`}>
            {inicioServico ? formatMin(tempoGasto) : '—'}
            {!fimServico && inicioServico && <span className="text-[10px] text-slate-400 ml-1">(atual)</span>}
          </p>
        </div>

        {/* Tempo Restante */}
        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
          <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Restante</p>
          <p className={`text-lg font-bold ${excedido ? 'text-red-600' : 'text-emerald-600'}`}>
            {tempoRestante !== null ? formatMin(tempoRestante) : '—'}
            {excedido && <span className="text-[10px] ml-1">⚠ Excedido</span>}
          </p>
        </div>

        {/* Excedido */}
        <div className={`rounded-xl p-3 text-center border ${excedido ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Excedido</p>
          <p className={`text-lg font-bold ${excedido ? 'text-red-600' : 'text-slate-400'}`}>
            {excedido ? `+${formatMin(tempoGasto - (tempoEstimado || 0))}` : '0 min'}
          </p>
        </div>
      </div>

      {/* Botoes de acao */}
      <div className="flex items-center gap-3">
        {!inicioServico && (
          <button onClick={() => acaoTempo('INICIAR')} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Iniciar Serviço
          </button>
        )}
        {inicioServico && !fimServico && (
          <button onClick={() => acaoTempo('FINALIZAR')} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            Finalizar Serviço
          </button>
        )}
        {fimServico && (
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Serviço concluído em {fim ? new Date(fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        )}
      </div>
    </div>
  );
}
