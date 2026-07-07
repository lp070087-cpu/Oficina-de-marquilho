'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Orcamento { id:string;numero:number;status:string;total:number;modeloMoto?:string;observacao?:string;createdAt:string;itens:{quantidade:number;precoUnitario:number;peca:{nome:string;codigo:string;categoria:{nome:string}}}[]; }

export default function MinhaContaPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState<any>(null);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{const c=sessionStorage.getItem('marquinho-cliente');if(!c){router.push('/vitrine/login');return;}const d=JSON.parse(c);setCliente(d);fetch(`/api/vitrine/orcamentos?clienteId=${d.id}`).then(r=>r.json()).then(data=>{setOrcamentos(data);setLoading(false);});},[router]);

  function sair(){sessionStorage.removeItem('marquinho-cliente');router.push('/vitrine');}
  const fm=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const sl:Record<string,string>={PENDENTE:'Pendente',APROVADO:'Aprovado',RECUSADO:'Recusado',CONCLUIDO:'Concluido'};
  const sc:Record<string,string>={PENDENTE:'bg-amber-50 text-amber-700',APROVADO:'bg-emerald-50 text-emerald-700',RECUSADO:'bg-red-50 text-red-700',CONCLUIDO:'bg-slate-50 text-slate-600'};
  if(!cliente)return null;

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#111] text-white"><div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4"><button onClick={()=>router.push('/vitrine')} className="text-slate-400 hover:text-white text-sm">← Vitrine</button><div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/25"><span className="font-extrabold text-white text-xs">MP</span></div><span className="font-extrabold text-sm">Minha Conta</span><span className="flex-1 text-right text-xs text-slate-400">{cliente.nome}</span><button onClick={sair} className="text-xs text-slate-400 hover:text-white">Sair</button></div></header>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-extrabold text-slate-800 mb-6">Meus Orcamentos</h1>
        {loading?<p className="text-sm text-slate-400">Carregando...</p>:orcamentos.length===0?(
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center"><p className="text-sm text-slate-400">Nenhum orcamento encontrado.</p></div>
        ):(
          <div className="space-y-4">{orcamentos.map(o=>(
            <div key={o.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><span className="text-sm font-extrabold text-brand-600">#{o.numero}</span><span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sc[o.status]}`}>{sl[o.status]}</span></div><span className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span></div>
              {o.modeloMoto&&<p className="text-xs text-slate-500 mb-2">Moto: {o.modeloMoto}</p>}
              <div className="space-y-1 mb-3">{o.itens.map((item,i)=>(<div key={i} className="flex items-center justify-between text-xs"><span className="text-slate-700">{item.peca.nome} <span className="text-slate-400">({item.peca.codigo})</span></span><span className="text-slate-500">{item.quantidade}x {fm(Number(item.precoUnitario))}</span></div>))}</div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100"><span className="text-xs text-slate-500">Total: <strong className="text-slate-800 text-sm">{fm(Number(o.total))}</strong></span></div>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
