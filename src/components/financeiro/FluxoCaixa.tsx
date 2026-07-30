'use client';

import { useState, useEffect, useCallback } from 'react';

interface FluxoData {
  periodo: { inicio: string; fim: string };
  entradasTotal: number; saidasTotal: number; saldo: number;
  saldoPrevisto: number; entradasPrevistas: number; saidasPrevistas: number;
  saldoDiario: { dia: string; entradas: number; saidas: number; saldo: number }[];
  movimentacoes: any[];
}

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FluxoCaixa() {
  const [data, setData] = useState<FluxoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesAno, setMesAno] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/financeiro/fluxo-caixa?mes=${mesAno}`);
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [mesAno]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>;
  }

  return (
    <div className="space-y-6">
      {/* Seletor mês */}
      <div className="flex items-center gap-3">
        <input type="month" value={mesAno} onChange={e => setMesAno(e.target.value)}
          className="input-field text-xs py-1.5" />
        <span className="text-[11px] text-slate-500">
          {new Date(data.periodo.inicio).toLocaleDateString('pt-BR')} — {new Date(data.periodo.fim).toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-[10px] text-emerald-600 uppercase font-semibold">Entradas</p>
          <p className="text-xl font-black text-emerald-700">{fm(data.entradasTotal)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-[10px] text-red-500 uppercase font-semibold">Saídas</p>
          <p className="text-xl font-black text-red-700">{fm(data.saidasTotal)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${data.saldo >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Saldo</p>
          <p className={`text-xl font-black ${data.saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fm(data.saldo)}</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="text-[10px] text-violet-600 uppercase font-semibold">Prev. Entradas</p>
          <p className="text-xl font-black text-violet-700">{fm(data.entradasPrevistas)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-[10px] text-orange-600 uppercase font-semibold">Prev. Saídas</p>
          <p className="text-xl font-black text-orange-700">{fm(data.saidasPrevistas)}</p>
        </div>
      </div>

      {/* Saldo previsto destacado */}
      <div className={`rounded-xl border p-5 ${data.saldoPrevisto >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Saldo Previsto (com previsões)</p>
            <p className={`text-2xl font-black mt-1 ${data.saldoPrevisto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {fm(data.saldoPrevisto)}
            </p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.saldoPrevisto >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {data.saldoPrevisto >= 0 ? (
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
            ) : (
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
            )}
          </div>
        </div>
      </div>

      {/* Fluxo diário */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-700">Fluxo Diário</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left py-2 px-4 font-semibold text-slate-500">Dia</th>
                <th className="text-right py-2 px-4 font-semibold text-slate-500">Entradas</th>
                <th className="text-right py-2 px-4 font-semibold text-slate-500">Saídas</th>
                <th className="text-right py-2 px-4 font-semibold text-slate-500">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data.saldoDiario.map((d, i) => (
                <tr key={d.dia} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="py-2 px-4 font-medium text-slate-700">{new Date(d.dia + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="py-2 px-4 text-right text-emerald-600 font-semibold">{fm(d.entradas)}</td>
                  <td className="py-2 px-4 text-right text-red-500 font-semibold">{fm(d.saidas)}</td>
                  <td className={`py-2 px-4 text-right font-bold ${d.saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fm(d.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movimentações */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Movimentações</h3>
          <span className="text-[10px] text-slate-400">{data.movimentacoes.length} registros</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {data.movimentacoes.slice(0, 100).map((m: any) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.tipo === 'RECEITA' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {m.tipo === 'RECEITA' ? '+' : '-'}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">{m.descricao || m.categoria}</p>
                  <p className="text-[10px] text-slate-400">{new Date(m.data).toLocaleDateString('pt-BR')} • {m.centroCusto?.nome}</p>
                </div>
              </div>
              <span className={`text-xs font-bold ${m.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-red-600'}`}>{fm(Number(m.valor))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
