'use client';

import { useState, useEffect, useCallback } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DRE() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/financeiro/dre?periodo=${periodo}`);
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [periodo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function fecharPeriodo() {
    await fetch('/api/financeiro/fechamento', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periodo }),
    });
    fetchData();
  }

  if (loading || !data) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="input-field text-xs py-1.5" />
          {data.fechado && <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-full font-bold">FECHADO</span>}
        </div>
        {!data.fechado && (
          <button onClick={fecharPeriodo} className="btn-primary text-xs px-4 py-2">Fechar Período</button>
        )}
      </div>

      {/* DRE Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-800 text-white px-5 py-3">
          <h3 className="text-sm font-bold">DRE — {data.periodo}</h3>
          {data.comparativo && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              {data.comparativo.variacao >= 0 ? '+' : ''}{data.comparativo.variacao}% vs mês anterior
            </p>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          <DRELinha label="Receita Bruta" valor={fm(data.receitaBruta)} />
          <DRELinha label="(-) Descontos" valor={fm(data.descontos)} negativo />
          <DRELinha label="= Receita Líquida" valor={fm(data.receitaLiquida)} destaque />
          <DRELinha label="(-) Custos (CMV)" valor={fm(data.custos)} negativo />
          <DRELinha label="= Lucro Bruto" valor={fm(data.lucroBruto)} destaque positivo />
          <DRELinha label="(-) Despesas" valor={fm(data.despesas)} negativo />
          <DRELinha label="= Lucro Operacional" valor={fm(data.lucroOperacional)} destaque positivo />
          <DRELinha label="= Lucro Líquido" valor={fm(data.lucroLiquido)} grande positivo={data.lucroLiquido >= 0} />
          <DRELinha label="Margem" valor={`${data.margem}%`} destaque />
        </div>
      </div>

      {/* Despesas por Centro de Custo */}
      {data.despesasCentro && data.despesasCentro.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Despesas por Centro de Custo</h3>
          <div className="space-y-2">
            {data.despesasCentro.map((d: any) => (
              <div key={d.centro} className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{d.centro}</span>
                <span className="text-xs font-bold text-red-600">{fm(d.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DRELinha({ label, valor, negativo, destaque, positivo, grande }: { label: string; valor: string; negativo?: boolean; destaque?: boolean; positivo?: boolean; grande?: boolean }) {
  const cls = negativo ? 'text-red-600' : positivo === false ? 'text-red-700' : destaque ? 'text-slate-800 font-extrabold' : 'text-slate-600';
  return (
    <div className={`flex items-center justify-between px-5 py-3 ${destaque ? 'bg-slate-50' : ''}`}>
      <span className={`text-xs ${destaque ? 'font-bold text-slate-700' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-xs ${cls} ${grande ? 'text-base' : ''}`}>{valor}</span>
    </div>
  );
}
