'use client';

import { useState, useEffect } from 'react';

interface PecaSaida { peca: string; codigo: string; quantidade: number; preco: number; os: number; cliente: string; data: string; balcao: string; }

function getPeriodoRange(periodo: string) {
  const hoje = new Date(); hoje.setHours(23,59,59,999);
  let inicio = new Date(hoje);
  if (periodo==='hoje') inicio.setHours(0,0,0,0);
  else if (periodo==='semana') inicio.setDate(hoje.getDate()-7);
  else if (periodo==='mes') inicio.setMonth(hoje.getMonth()-1);
  else if (periodo==='ano') inicio.setFullYear(hoje.getFullYear()-1);
  else inicio = new Date(2000,0,1);
  return { inicio: inicio.toISOString(), fim: hoje.toISOString() };
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState('hoje');
  const [saidas, setSaidas] = useState<PecaSaida[]>([]);
  const [loading, setLoading] = useState(true);
  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  useEffect(() => {
    const range = getPeriodoRange(periodo);
    const p = new URLSearchParams({ inicio:range.inicio, fim:range.fim });
    fetch(`/api/relatorios?${p}`).then(r=>r.json()).then(d=>{setSaidas(d.saidas||[]);setLoading(false);});
  }, [periodo]);

  const total = saidas.reduce((s,i)=>s+i.quantidade,0);
  const valor = saidas.reduce((s,i)=>s+i.preco*i.quantidade,0);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">RELATORIOS DE SAIDAS</h1>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[{k:'hoje',l:'Hoje'},{k:'semana',l:'7 dias'},{k:'mes',l:'30 dias'},{k:'ano',l:'12 meses'},{k:'tudo',l:'Tudo'}].map(p=>(
          <button key={p.k} onClick={()=>setPeriodo(p.k)} className={`px-3 py-1.5 rounded text-xs font-medium border ${periodo===p.k?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200'}`}>{p.l}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-stat"><p className="text-[11px] text-slate-500 uppercase">Pecas saidas</p><p className="text-2xl font-bold">{total}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 uppercase">Valor total</p><p className="text-2xl font-bold">{fm(valor)}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 uppercase">Itens diferentes</p><p className="text-2xl font-bold">{saidas.length}</p></div>
      </div>
      {loading?<p className="text-sm text-slate-400">Carregando...</p>:saidas.length===0?(
        <div className="card text-center py-16"><p className="text-sm text-slate-400">Nenhuma saida no periodo.</p></div>
      ):(
        <div className="card-table overflow-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/60"><th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">OS</th><th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Data</th><th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th><th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Peca</th><th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Qtd</th><th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Valor</th></tr></thead>
          <tbody>{saidas.map((s,i)=>(<tr key={i} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}><td className="py-2 px-3 font-semibold text-brand-600 text-xs">#{s.os}</td><td className="py-2 px-3 text-xs text-slate-500">{new Date(s.data).toLocaleDateString('pt-BR')}</td><td className="py-2 px-3 text-xs text-slate-700">{s.cliente}</td><td className="py-2 px-3 text-xs">{s.peca}</td><td className="py-2 px-3 text-xs text-center font-bold">{s.quantidade}</td><td className="py-2 px-3 text-xs text-right font-bold">{fm(s.preco*s.quantidade)}</td></tr>))}</tbody>
        </table></div>
      )}
    </div>
  );
}
