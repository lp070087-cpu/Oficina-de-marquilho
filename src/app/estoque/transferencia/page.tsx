'use client';

import { useState, useEffect } from 'react';

interface Peca { id:string; nome:string; codigo:string; quantidade:number; quantidadeLoja:number; marca?:string; categoria:{nome:string}; }

export default function TransferenciaPage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [selected, setSelected] = useState<Peca|null>(null);
  const [qtd, setQtd] = useState('1');
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');

  useEffect(() => { fetch('/api/pecas').then(r=>r.json()).then(setPecas); }, []);

  const filter = pecas.filter(p => !busca||p.nome.toLowerCase().includes(busca.toLowerCase())||p.codigo.toLowerCase().includes(busca.toLowerCase()));

  async function transferir() {
    if (!selected) return;
    const qv = parseInt(qtd)||1;
    if (qv > selected.quantidade) { setMsg(`Saldo insuficiente no estoque central. Disponivel: ${selected.quantidade}`); return; }
    setLoading(true); setMsg('');
    const res = await fetch('/api/transferencia', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ pecaId:selected.id, quantidade:qv, de:'CENTRAL', para:'LOJA' })
    });
    if (res.ok) {
      const updated = await res.json();
      setSelected(updated);
      setQtd('1');
      setMsgOk(`${qv} un. transferidas para a loja.`);
      // Refresh list
      fetch('/api/pecas').then(r=>r.json()).then(setPecas);
    } else { const e = await res.json(); setMsg(e.error||'Erro.'); }
    setLoading(false);
  }

  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">TRANSFERIR PARA LOJA</h1>
      <p className="text-sm text-slate-500 mb-6">Envie produtos do estoque central para o estoque da loja</p>
      {msgOk&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-bold">{msgOk}</div>}
      {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto..." className="input-field mb-4"/>

      {!selected&&(
        <div className="card overflow-auto max-h-64">
          <table className="w-full text-xs"><tbody>{filter.slice(0,20).map(p=>(
            <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={()=>{setSelected(p);setQtd('1');}}>
              <td className="py-2 px-3 font-medium text-xs">{p.nome}</td><td className="py-2 px-3 text-slate-400 font-mono">{p.codigo}</td><td className="py-2 px-3 text-center font-bold text-slate-700">Central: {p.quantidade}</td><td className="py-2 px-3 text-center text-brand-600">Loja: {p.quantidadeLoja||0}</td>
            </tr>
          ))}</tbody></table>
        </div>
      )}

      {selected&&(
        <div className="card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{selected.nome}</h3>
            <p className="text-xs text-slate-500">SKU: {selected.codigo}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span><strong>Central:</strong> {selected.quantidade} un.</span>
              <span><strong>Loja:</strong> {selected.quantidadeLoja||0} un.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 uppercase">Qtd a transferir</label>
            <input type="number" value={qtd} onChange={e=>setQtd(e.target.value)} className="input-field w-24 text-center text-lg font-bold" min="1" max={selected.quantidade}/>
            <button onClick={transferir} disabled={loading} className="btn-primary text-xs flex-1">Transferir → Loja</button>
          </div>
          <button onClick={()=>setSelected(null)} className="btn-secondary text-xs">Cancelar</button>
        </div>
      )}
    </div>
  );
}
