'use client';

import { useState, useEffect } from 'react';
interface Peca { id:string; nome:string; codigo:string; quantidadeLoja:number; quantidade:number; estoqueMinimo:number; marca?:string; precoVenda:number; categoria:{nome:string}; }

export default function EstoqueLojaPage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => { fetch('/api/pecas').then(r=>r.json()).then(d=>{setPecas(d);setLoading(false);}); }, []);

  const filter = pecas.filter(p => !busca||p.nome.toLowerCase().includes(busca.toLowerCase())||p.codigo.toLowerCase().includes(busca.toLowerCase()));
  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">ESTOQUE DA LOJA</h1>
      <p className="text-sm text-slate-500 mb-4">Produtos disponiveis para venda e uso em OS</p>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." className="input-field max-w-md mb-4"/>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-stat"><p className="text-[11px] text-slate-500 uppercase">Total itens</p><p className="text-2xl font-bold">{pecas.length}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 uppercase">Unidades na loja</p><p className="text-2xl font-bold">{pecas.reduce((s,p)=>s+(p.quantidadeLoja||0),0)}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 uppercase">Valor loja</p><p className="text-2xl font-bold">{fm(pecas.reduce((s,p)=>s+Number(p.precoVenda)*(p.quantidadeLoja||0),0))}</p></div>
      </div>
      {loading?<p className="text-sm text-slate-400">Carregando...</p>:(
        <div className="card-table overflow-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/60"><th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">SKU</th><th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Nome</th><th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Central</th><th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Loja</th><th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Preco</th></tr></thead>
          <tbody>{filter.map((p,i)=>(
            <tr key={p.id} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
              <td className="py-2 px-3 font-mono text-xs text-slate-500">{p.codigo}</td><td className="py-2 px-3 text-slate-700 font-medium text-xs">{p.nome}</td>
              <td className="py-2 px-3 text-center text-xs font-bold text-slate-700">{p.quantidade}</td><td className="py-2 px-3 text-center text-xs font-bold text-brand-600">{p.quantidadeLoja||0}</td>
              <td className="py-2 px-3 text-right text-xs font-bold">{fm(Number(p.precoVenda))}</td>
            </tr>
          ))}</tbody></table></div>
      )}
    </div>
  );
}
