'use client';

import { useState, useEffect } from 'react';

export default function BalcaoDashboard() {
  const [stats, setStats] = useState({ totalPecas:0, osAbertas:0, osEmAndamento:0, osConcluidas:0 });
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [pecasRes, ordensRes] = await Promise.all([
          fetch('/api/pecas').then(r=>r.json()),
          fetch('/api/ordens').then(r=>r.json()),
        ]);
        const pecas = Array.isArray(pecasRes) ? pecasRes : [];
        const ordensData = Array.isArray(ordensRes) ? ordensRes : [];
        setStats({
          totalPecas: pecas.length,
          osAbertas: ordensData.filter((o:any)=>o.status==='ABERTA').length,
          osEmAndamento: ordensData.filter((o:any)=>['EM_ANDAMENTO','AGUARDANDO_PECAS'].includes(o.status)).length,
          osConcluidas: ordensData.filter((o:any)=>['PRONTA','CONCLUIDA'].includes(o.status)).length,
        });
        setOrdens(ordensData.slice(0, 20));
      } catch { setError('Falha ao carregar dados.'); }
      setLoading(false);
    }
    load();
  }, []);

  const formatMoney = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const statusColor: Record<string,string> = { ABERTA:'bg-sky-50 text-sky-700',EM_ANDAMENTO:'bg-amber-50 text-amber-700',AGUARDANDO_PECAS:'bg-orange-50 text-orange-700',PRONTA:'bg-violet-50 text-violet-700',CONCLUIDA:'bg-emerald-50 text-emerald-700',CANCELADA:'bg-red-50 text-red-700' };
  const statusLabel: Record<string,string> = { ABERTA:'Aberta',EM_ANDAMENTO:'Em andamento',AGUARDANDO_PECAS:'Aguard. pecas',PRONTA:'Pronta',CONCLUIDA:'Concluida',CANCELADA:'Cancelada' };

  return (
    <div className="p-6 space-y-6">
      {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs">{error}</div>}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-stat"><p className="text-[11px] text-slate-500 font-medium uppercase mb-2">Pecas no estoque</p><p className="text-2xl font-bold text-slate-800">{stats.totalPecas}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 font-medium uppercase mb-2">OS abertas</p><p className="text-2xl font-bold text-sky-600">{stats.osAbertas}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 font-medium uppercase mb-2">Em andamento</p><p className="text-2xl font-bold text-amber-600">{stats.osEmAndamento}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 font-medium uppercase mb-2">Concluidas</p><p className="text-2xl font-bold text-emerald-600">{stats.osConcluidas}</p></div>
      </div>
      <div className="card-table">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Ordens recentes</h3></div>
        <div className="overflow-auto"><table className="w-full text-[13px]">
          <thead><tr className="border-b border-slate-100 bg-slate-50/60"><th className="text-left py-3 px-6 font-medium text-slate-500">OS</th><th className="text-left py-3 px-6 font-medium text-slate-500">Cliente</th><th className="text-left py-3 px-6 font-medium text-slate-500">Moto</th><th className="text-left py-3 px-6 font-medium text-slate-500">Mecanico</th><th className="text-center py-3 px-6 font-medium text-slate-500">Status</th><th className="text-right py-3 px-6 font-medium text-slate-500">Valor</th></tr></thead>
          <tbody>{loading?<tr><td colSpan={6} className="py-10 text-center text-slate-400">Carregando...</td></tr>:ordens.length===0?<tr><td colSpan={6} className="py-10 text-center text-slate-400">Nenhuma OS</td></tr>:ordens.map((os,i)=>(<tr key={os.id} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}><td className="py-3 px-6 font-semibold text-brand-600">#{os.numero}</td><td className="py-3 px-6 text-slate-700 font-medium">{os.nomeCliente}</td><td className="py-3 px-6 text-slate-500">{os.modeloMoto}</td><td className="py-3 px-6 text-slate-500">{os.mecanico?.name||'-'}</td><td className="py-3 px-6 text-center"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColor[os.status]||'bg-slate-50 text-slate-500'}`}>{statusLabel[os.status]||os.status}</span></td><td className="py-3 px-6 text-right font-semibold text-slate-700">{formatMoney(Number(os.valorTotal)||0)}</td></tr>))}</tbody>
        </table></div>
      </div>
    </div>
  );
}
