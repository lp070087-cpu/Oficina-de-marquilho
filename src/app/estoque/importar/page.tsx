'use client';
// VERSÃO IMPORTAR 2026
import { useState } from 'react';

export default function EstoqueImportarPage() {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  function parseCSV(): any[] {
    if (!texto.trim()) return [];
    const lines = texto.trim().split('\n').filter(l=>l.trim());
    if (lines.length<2) return [];
    const headers = lines[0].toLowerCase().split(',').map(h=>h.trim().replace(/["']/g,''));
    const ci = headers.findIndex((h:string)=>h==='codigo'||h==='sku');
    const ni = headers.findIndex((h:string)=>h==='nome'||h==='descricao'||h==='produto');
    const pi = headers.findIndex((h:string)=>h==='preco'||h==='venda');
    const ci2 = headers.findIndex((h:string)=>h==='custo');
    const qi = headers.findIndex((h:string)=>h==='quantidade'||h==='qtd'||h==='estoque');
    return lines.slice(1).map(l=>{
      const cols = l.split(',').map((c:string)=>c.trim().replace(/["']/g,''));
      return { codigo:ci>=0?cols[ci]:'', nome:ni>=0?cols[ni]:'', precoVenda:pi>=0?cols[pi]?.replace(/[R$\s]/g,''):'', precoCusto:ci2>=0?cols[ci2]?.replace(/[R$\s]/g,''):'', quantidade:qi>=0?cols[qi]:'' };
    });
  }

  async function importar() {
    const linhas = parseCSV();
    if (linhas.length===0) { setMsg('Nenhum dado valido.'); return; }
    setLoading(true); setMsg('');
    const res = await fetch('/api/importar', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ linhas, categoriaDefaultId:'' }) });
    setResultado(await res.json());
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">IMPORTAR CSV</h1>
      <p className="text-sm text-slate-500 mb-6">Cole dados no formato CSV (codigo,nome,preco,custo,quantidade)</p>
      <textarea value={texto} onChange={e=>setTexto(e.target.value)} className="input-field font-mono text-xs mb-4" rows={12} placeholder="codigo,nome,preco,custo,quantidade&#10;CB001,Pastilha Freio CG 160,45.90,28.50,20"/>
      {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}
      {resultado&&(
        <div className={`border rounded-xl p-5 mb-4 ${resultado.erros?.length>0?'bg-amber-50 border-amber-200':'bg-emerald-50 border-emerald-200'}`}>
          <p className="font-bold">{resultado.criados} criados, {resultado.atualizados} atualizados.</p>
          {resultado.erros?.map((e:string,i:number)=>(<p key={i} className="text-[11px] text-amber-600">{e}</p>))}
        </div>
      )}
      <button onClick={importar} disabled={loading||!texto.trim()} className="btn-primary text-xs">{loading?'Importando...':'Importar'}</button>
    </div>
  );
}
