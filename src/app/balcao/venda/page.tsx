'use client';

import { useState, useEffect } from 'react';

interface Peca { id:string; nome:string; codigo:string; codigoBarras?:string; precoVenda:number; quantidadeLoja:number; quantidade:number; marca?:string; categoria:{nome:string}; }

export default function VendaAvulsaPage() {
  const [busca, setBusca] = useState('');
  const [barcode, setBarcode] = useState('');
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');
  const [selected, setSelected] = useState<Peca|null>(null);
  const [qtd, setQtd] = useState('1');

  async function buscar() {
    setLoading(true); setMsg(''); setSelected(null);
    const q = barcode ? `barcode=${encodeURIComponent(barcode)}` : `q=${encodeURIComponent(busca)}`;
    const res = await fetch(`/api/pecas?${q}`);
    const data = await res.json();
    setPecas(Array.isArray(data)?data:[]);
    if (Array.isArray(data) && data.length===1) setSelected(data[0]);
    setLoading(false);
  }

  async function vender() {
    if (!selected) return;
    const qv = parseInt(qtd)||1;
    const disp = selected.quantidadeLoja || selected.quantidade;
    if (qv > disp) { setMsg(`Estoque insuficiente. Disponivel: ${disp}`); return; }
    setLoading(true);
    await fetch(`/api/pecas/${selected.id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ ...selected, quantidadeLoja: Math.max(0,(selected.quantidadeLoja||selected.quantidade)-qv), quantidade: selected.quantidadeLoja>0?selected.quantidade:selected.quantidade-qv, categoriaId:selected.categoria.nome })
    });
    await fetch('/api/relatorios/movimentacao', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ pecaId:selected.id, tipo:'VENDA', quantidade:qv, valorUnitario:selected.precoVenda, origem:'LOJA' })
    });
    setSelected(null); setQtd('1'); setBusca(''); setBarcode('');
    setMsgOk(`Venda registrada: ${qv}x ${selected.nome} — ${(Number(selected.precoVenda)*qv).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`);
    setLoading(false);
  }

  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">VENDA AVULSA</h1>
      <p className="text-sm text-slate-500 mb-6">Busque o produto e registre a saida da loja</p>
      {msgOk&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-bold">{msgOk}</div>}
      {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

      <div className="flex gap-2 mb-4">
        <input value={busca} onChange={e=>setBusca(e.target.value)} className="input-field" placeholder="Nome ou SKU..." onKeyDown={e=>{if(e.key==='Enter')buscar();}}/>
        <input value={barcode} onChange={e=>setBarcode(e.target.value)} className="input-field w-48" placeholder="Cod. barras..." onKeyDown={e=>{if(e.key==='Enter')buscar();}}/>
        <button onClick={buscar} disabled={loading} className="btn-primary text-xs">Buscar</button>
      </div>

      {loading&&<p className="text-xs text-slate-400 mb-4">Buscando...</p>}

      {pecas.length>1&&!selected&&(
        <div className="card overflow-auto mb-4">
          <table className="w-full text-xs"><tbody>{pecas.map(p=>(
            <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={()=>setSelected(p)}>
              <td className="py-2 px-3 font-medium">{p.nome}</td><td className="py-2 px-3 text-slate-400 font-mono">{p.codigo}</td><td className="py-2 px-3 text-right font-bold">{fm(Number(p.precoVenda))}</td></tr>
          ))}</tbody></table>
        </div>
      )}

      {selected&&(
        <div className="card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{selected.nome}</h3>
            <p className="text-xs text-slate-500">{selected.marca||selected.categoria.nome} — SKU: {selected.codigo}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span><strong>Disponivel:</strong> {selected.quantidadeLoja||selected.quantidade} un.</span>
              <span><strong>Preco:</strong> {fm(Number(selected.precoVenda))}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 uppercase">Qtd</label>
            <input type="number" value={qtd} onChange={e=>setQtd(e.target.value)} className="input-field w-24 text-center text-lg font-bold" min="1"/>
            <button onClick={vender} disabled={loading} className="btn-primary text-xs flex-1">Registrar venda — {fm(Number(selected.precoVenda)*(parseInt(qtd)||1))}</button>
          </div>
          <div className="flex gap-2"><button onClick={()=>setSelected(null)} className="btn-secondary text-xs">Cancelar</button><button onClick={()=>{setSelected(null);setBusca('');setBarcode('');}} className="btn-secondary text-xs">Nova busca</button></div>
        </div>
      )}
    </div>
  );
}
