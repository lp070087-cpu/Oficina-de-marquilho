'use client';

import { useState, useEffect, useCallback } from 'react';

interface HistoricoItem {
  id: string;
  tipo: string;
  descricao?: string | null;
  usuario?: string | null;
  createdAt: string;
}

const TIPO_ICONE: Record<string, { bg: string; text: string; icon: string }> = {
  CRIACAO:         { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'M12 4v16m8-8H4' },
  MUDANCA_STATUS:  { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  TROCA_MECANICO:  { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  INCLUSAO_PECA:   { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  REMOCAO_PECA:    { bg: 'bg-red-50', text: 'text-red-700', icon: 'M6 18L18 6M6 6l12 12' },
  PAGAMENTO:       { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ENTREGA:         { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'M5 13l4 4L19 7' },
  FINALIZACAO:     { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
};

interface HistoricoOSProps {
  osId: string;
}

export default function HistoricoOS({ osId }: HistoricoOSProps) {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorico = useCallback(async () => {
    try {
      const r = await fetch(`/api/ordens/${osId}/historico`);
      setHistorico(Array.isArray(await r.json()) ? await r.json() : []);
    } catch { setHistorico([]); }
    setLoading(false);
  }, [osId]);

  useEffect(() => { fetchHistorico(); }, [fetchHistorico]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-slate-400">Nenhum histórico registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {historico.map((h, i) => {
        const estilo = TIPO_ICONE[h.tipo] || TIPO_ICONE.MUDANCA_STATUS;
        return (
          <div key={h.id} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full ${estilo.bg} flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-4 h-4 ${estilo.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={estilo.icon}/>
                </svg>
              </div>
              {i < historico.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1"/>}
            </div>
            {/* Conteudo */}
            <div className={`pb-4 ${i === historico.length - 1 ? '' : ''} flex-1`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-semibold uppercase ${estilo.text}`}>
                  {h.tipo.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(h.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {h.descricao && (
                <p className="text-xs text-slate-600 mt-0.5">{h.descricao}</p>
              )}
              {h.usuario && (
                <p className="text-[10px] text-slate-400 mt-0.5">por {h.usuario}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
