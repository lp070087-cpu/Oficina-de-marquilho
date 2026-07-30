'use client';

import { useState, useEffect, useCallback } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CentroCustos() {
  const [centros, setCentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCentros = useCallback(async () => {
    try {
      const r = await fetch('/api/financeiro/centro-custos');
      if (r.ok) setCentros(await r.json());
    } catch { setCentros([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCentros(); }, [fetchCentros]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Centros de Custo</h3>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {centros.map(c => (
              <div key={c.id} className="border border-slate-200 rounded-xl p-4 hover:border-brand-200 transition-colors">
                <p className="text-sm font-bold text-slate-700">{c.nome}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.tipo} • {c._count?.lancamentos || 0} lançamentos</p>
                {c.descricao && <p className="text-[10px] text-slate-500 mt-1">{c.descricao}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
