'use client';

import { useState, useEffect, useCallback } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Comissoes() {
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/financeiro/comissoes${filtro ? `?status=${filtro}` : ''}`);
      if (r.ok) setComissoes(await r.json());
    } catch { setComissoes([]); }
    setLoading(false);
  }, [filtro]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function pagarComissao(id: string) {
    await fetch('/api/financeiro/comissoes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'PAGA' }),
    });
    fetchData();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'PENDENTE', 'PAGA', 'CANCELADA'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${filtro === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {f || 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        <div className="space-y-2">
          {comissoes.map(c => (
            <div key={c.id} className="flex flex-wrap items-center justify-between p-3 bg-white border border-slate-200 rounded-xl gap-2">
              <div>
                <p className="text-sm font-bold text-slate-700">{c.usuario}</p>
                <p className="text-[10px] text-slate-400">{c.tipoFuncionario} • {c.periodo} • {c.percentual}%</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-violet-700">{fm(Number(c.valor))}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === 'PAGA' ? 'bg-emerald-100 text-emerald-700' : c.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                {c.status === 'PENDENTE' && (
                  <button onClick={() => pagarComissao(c.id)} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200">Pagar</button>
                )}
              </div>
            </div>
          ))}
          {comissoes.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Nenhuma comissão registrada</p>}
        </div>
      )}
    </div>
  );
}
