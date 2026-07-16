'use client';

import { useState } from 'react';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';

interface Peca { id:string; nome:string; codigo:string; codigoBarras?:string; quantidade:number; estoqueMinimo:number; marca?:string; categoria:{nome:string}; }

export default function EstoqueScannerPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [found, setFound] = useState<Peca|null>(null);
  const [qtd, setQtd] = useState('1');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');

  async function buscar(code:string) {
    if (!code.trim()) return;
    setLoading(true); setMsg(''); setFound(null);
    const res = await fetch(`/api/pecas?barcode=${encodeURIComponent(code.trim())}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length>0) setFound(data[0]);
    else setMsg('Produto nao encontrado.');
    setLoading(false);
  }

  function handleDetected(code:string) { setShowScanner(false); setManualCode(code); buscar(code); }

  async function entrada() {
    if (!found) return;
    const qv = parseInt(qtd)||1;
    setLoading(true);
    await fetch(`/api/pecas/${found.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...found, quantidade:found.quantidade+qv, categoriaId:found.categoria.nome }) });
    await fetch('/api/relatorios/movimentacao', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pecaId:found.id, tipo:'ENTRADA', quantidade:qv, valorUnitario:0, observacao:'Entrada via scanner' }) });
    setFound(null); setQtd('1'); setManualCode('');
    setMsgOk(`${qv} un. adicionadas.`);
    setLoading(false);
  }

  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">ENTRADA SCANNER</h1>
      <p className="text-sm text-slate-500 mb-6">Escaneie o codigo de barras ou digite manualmente</p>
      <button onClick={()=>setShowScanner(true)} className="btn-primary inline-flex items-center gap-2 text-xs w-full justify-center mb-4">📷 Escanear com camera</button>
      <div className="flex gap-2 mb-6"><input value={manualCode} onChange={e=>setManualCode(e.target.value)} className="input-field flex-1" placeholder="Codigo de barras..." onKeyDown={e=>{if(e.key==='Enter')buscar(manualCode);}}/><button onClick={()=>buscar(manualCode)} className="btn-primary text-xs px-4">Buscar</button></div>
      {msgOk&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-bold">{msgOk}</div>}
      {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}
      {loading&&<p className="text-xs text-slate-400">Buscando...</p>}

      {found&&(
        <div className="card space-y-4">
          <div><h3 className="text-sm font-bold text-slate-800">{found.nome}</h3><p className="text-xs text-slate-500">{found.marca||found.categoria.nome} — SKU: {found.codigo}</p><p className="text-xs text-slate-400">Estoque atual: <strong>{found.quantidade}</strong></p></div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 uppercase">Qtd recebida</label>
            <input type="number" value={qtd} onChange={e=>setQtd(e.target.value)} className="input-field w-24 text-center text-lg font-bold" min="1"/>
            <button onClick={entrada} disabled={loading} className="btn-primary text-xs flex-1">Confirmar entrada</button>
          </div>
          <button onClick={()=>setFound(null)} className="btn-secondary text-xs">Cancelar</button>
        </div>
      )}
      {showScanner && <BarcodeScanner onDetected={handleDetected} onClose={()=>setShowScanner(false)}/>}
    </div>
  );
}
