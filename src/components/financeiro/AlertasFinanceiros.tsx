'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AlertasFinanceiros() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertas = useCallback(async () => {
    try {
      const r = await fetch('/api/financeiro/alertas?apenasAtivos=true');
      if (r.ok) setAlertas(await r.json());
    } catch { setAlertas([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlertas(); }, [fetchAlertas]);

  async function resolver(id: string) {
    await fetch('/api/financeiro/alertas', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    fetchAlertas();
  }

  const ICONS: Record<string, string> = {
    CONTA_VENCENDO: '⏰', CONTA_VENCIDA: '🔴', FLUXO_NEGATIVO: '📉',
    CAIXA_NEGATIVO: '💸', BAIXO_LUCRO: '⚠️', DESPESA_ALTA: '📊',
    FORNECEDOR_ATRASO: '🏭', CLIENTE_INADIMPLENTE: '👤',
  };

  const SEVERIDADE: Record<string, string> = {
    CRITICA: 'border-red-400 bg-red-50', ALTA: 'border-amber-400 bg-amber-50',
    MEDIA: 'border-yellow-300 bg-yellow-50', BAIXA: 'border-blue-200 bg-blue-50',
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>;
  }

  return (
    <div className="space-y-3">
      {alertas.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          </div>
          <p className="text-sm font-semibold text-slate-600">Tudo em ordem</p>
          <p className="text-xs text-slate-400 mt-1">Nenhum alerta financeiro pendente</p>
        </div>
      ) : (
        alertas.map(a => (
          <div key={a.id} className={`border rounded-xl p-4 flex items-start gap-3 ${SEVERIDADE[a.severidade] || 'border-slate-200 bg-white'}`}>
            <span className="text-lg">{ICONS[a.tipo] || '📌'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-700">{a.titulo}</p>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-white">{a.severidade}</span>
              </div>
              {a.mensagem && <p className="text-[11px] text-slate-500 mt-1">{a.mensagem}</p>}
              <p className="text-[9px] text-slate-400 mt-2">{new Date(a.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            {!a.resolvido && (
              <button onClick={() => resolver(a.id)} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-slate-500 hover:bg-slate-50">
                Resolver
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
