'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AuditoriaFinanceira() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`/api/financeiro/auditoria${filtro ? `?entidade=${filtro}` : ''}`);
      if (r.ok) setRegistros(await r.json());
    } catch { setRegistros([]); }
    setLoading(false);
  }, [filtro]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ACAO_BADGE: Record<string, string> = {
    CRIADO: 'bg-blue-100 text-blue-700', ALTERADO: 'bg-amber-100 text-amber-700',
    CANCELADO: 'bg-red-100 text-red-700', ESTORNADO: 'bg-orange-100 text-orange-700',
    PAGO: 'bg-emerald-100 text-emerald-700', RECEBIDO: 'bg-emerald-100 text-emerald-700',
    CONCILIADO: 'bg-violet-100 text-violet-700', FECHADO: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'LancamentoFinanceiro', 'ContaReceber', 'ContaPagar', 'Comissao', 'FechamentoPeriodo'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${filtro === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {f || 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        <div className="space-y-1">
          {registros.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${ACAO_BADGE[r.acao] || 'bg-slate-100'}`}>{r.acao}</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-700">{r.descricao}</p>
                <p className="text-[9px] text-slate-400">{r.entidade} • {r.usuario || 'Sistema'}</p>
              </div>
              <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString('pt-BR')}</span>
            </div>
          ))}
          {registros.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Nenhum registro de auditoria</p>}
        </div>
      )}
    </div>
  );
}
