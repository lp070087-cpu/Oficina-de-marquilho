'use client';

import { useState, useEffect, useCallback } from 'react';

interface KpiData {
  receitaHoje: number; receitaOntem: number; receitaSemana: number; receitaMes: number; receitaAno: number;
  lucroBruto: number; lucroLiquido: number; margem: number;
  ticketMedio: number; qtdVendas: number; qtdOs: number; qtdCompras: number;
  contasReceber: number; contasReceberQtd: number; contasPagar: number; contasPagarQtd: number;
  saldoAtual: number; saldoPrevisto: number; valorEstoque: number;
  receitaDiaria: { data: string; valor: number }[];
  receitaMensal: { mes: string; valor: number }[];
  periodo: { inicio: string; fim: string; tipo: string };
}

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DashboardFinanceiro() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/financeiro/dashboard?periodo=${periodo}`);
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [periodo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>;
  }

  const kpiGrid = [
    { label: 'Receita Hoje', value: fm(data.receitaHoje), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Receita Ontem', value: fm(data.receitaOntem), color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
    { label: 'Receita Semana', value: fm(data.receitaSemana), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Receita Mês', value: fm(data.receitaMes), color: 'text-brand-700', bg: 'bg-brand-50 border-brand-200' },
    { label: 'Receita Ano', value: fm(data.receitaAno), color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
    { label: 'Lucro Bruto', value: fm(data.lucroBruto), color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Lucro Líquido', value: fm(data.lucroLiquido), color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    { label: 'Margem', value: `${data.margem}%`, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Ticket Médio', value: fm(data.ticketMedio), color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
    { label: 'Vendas', value: String(data.qtdVendas), color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
    { label: 'OS', value: String(data.qtdOs), color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
    { label: 'Compras', value: String(data.qtdCompras), color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex items-center gap-2">
        {['hoje', 'semana', 'mes', 'ano'].map(p => (
          <button key={p} onClick={() => setPeriodo(p)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${periodo === p ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Ano'}
          </button>
        ))}
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {kpiGrid.map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4 border`}>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">{k.label}</p>
            <p className={`text-xl font-black ${k.color} mt-1`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Saldo, Contas, Estoque */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 uppercase">Saldo Atual</p>
          <p className={`text-xl font-black ${data.saldoAtual >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fm(data.saldoAtual)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 uppercase">Saldo Previsto</p>
          <p className="text-xl font-black text-blue-700">{fm(data.saldoPrevisto)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 uppercase">A Receber</p>
          <p className="text-xl font-black text-amber-700">{fm(data.contasReceber)}</p>
          <p className="text-[9px] text-slate-400">{data.contasReceberQtd} contas</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 uppercase">A Pagar</p>
          <p className="text-xl font-black text-red-700">{fm(data.contasPagar)}</p>
          <p className="text-[9px] text-slate-400">{data.contasPagarQtd} contas</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 uppercase">Valor Estoque</p>
          <p className="text-xl font-black text-slate-700">{fm(data.valorEstoque)}</p>
        </div>
      </div>

      {/* Gráfico: Receita Diária */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">📈 Receita Diária (30 dias)</h3>
        <div className="flex items-end gap-0.5 h-40">
          {data.receitaDiaria.map((d, i) => {
            const maxVal = Math.max(...data.receitaDiaria.map(x => x.valor), 1);
            const h = (d.valor / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative" title={`${d.data}: ${fm(d.valor)}`}>
                <div className="w-full bg-brand-500 rounded-t-sm hover:bg-brand-600 transition-all" style={{ height: `${h}%`, minHeight: d.valor > 0 ? 2 : 0 }} />
                <span className="text-[8px] text-slate-400 mt-1 rotate-45 origin-left whitespace-nowrap hidden sm:block">{d.data.split('-')[2]}</span>
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">{fm(d.valor)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico: Receita Mensal */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">📊 Receita Mensal (12 meses)</h3>
        <div className="flex items-end gap-2 h-32">
          {data.receitaMensal.map((d, i) => {
            const maxVal = Math.max(...data.receitaMensal.map(x => x.valor), 1);
            const h = (d.valor / maxVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative" title={`${d.mes}: ${fm(d.valor)}`}>
                <div className="w-full bg-violet-500 rounded-t-sm hover:bg-violet-600 transition-all" style={{ height: `${h}%`, minHeight: d.valor > 0 ? 2 : 0 }} />
                <span className="text-[8px] text-slate-400 mt-1 hidden sm:block">{d.mes.split('-')[1]}/{d.mes.split('-')[0].slice(2)}</span>
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">{fm(d.valor)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
