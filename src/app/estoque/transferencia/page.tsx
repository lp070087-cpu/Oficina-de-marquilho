'use client';

import { useState, useEffect } from 'react';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import EstoqueCategorias from '@/components/estoque/EstoqueCategorias';

interface Categoria { id:string; nome:string; slug:string; }
interface Peca { id:string; nome:string; codigo:string; codigoBarras?:string; imagemUrl?:string; quantidade:number; quantidadeLoja:number; estoqueMinimo:number; marca?:string; compatibilidade?:string; categoria:{nome:string;id:string;slug:string}; }

type Filtro = 'todos'|'nome'|'sku'|'barcode'|'interno';

export default function TransferenciaPage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [catSlug, setCatSlug] = useState('');
  const [selected, setSelected] = useState<Peca|null>(null);
  const [qtd, setQtd] = useState('1');
  const [showScanner, setShowScanner] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/pecas').then(r=>r.json()).then(setPecas);
    fetch('/api/categorias').then(r=>r.json()).then(setCategorias);
    fetch('/api/relatorios/movimentacao?tipo=TRANSFERENCIA').then(r=>r.json()).then(setHistorico);
  }, []);

  function buscarPor(codigo:string) {
    const res = fetch(`/api/pecas?barcode=${encodeURIComponent(codigo)}`).then(r=>r.json());
    res.then((data:any[]) => { if (data.length>0) { setSelected(data[0]); setQtd('1'); } else setMsg('Nenhum produto com esse codigo.'); });
  }

  const catSelecionada = categorias.find(c=>c.slug===catSlug);
  const filter = pecas.filter(p => {
    if (catSlug && p.categoria.slug !== catSlug) return false;
    if (!busca) return true;
    const q = busca.toLowerCase();
    if (filtro==='todos') return p.nome.toLowerCase().includes(q)||p.codigo.toLowerCase().includes(q)||(p.codigoBarras||'').includes(q);
    if (filtro==='nome') return p.nome.toLowerCase().includes(q);
    if (filtro==='sku') return p.codigo.toLowerCase().includes(q);
    if (filtro==='barcode') return (p.codigoBarras||'').includes(q);
    if (filtro==='interno') return p.codigo.toLowerCase().includes(q)||(p.codigoBarras||'').includes(q);
    return true;
  });

  async function transferir() {
    if (!selected) return;
    const qv = parseInt(qtd)||1;
    if (qv > selected.quantidade) { setMsg(`Saldo insuficiente. Central: ${selected.quantidade}`); return; }
    setLoading(true); setMsg('');
    const res = await fetch('/api/transferencia', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pecaId:selected.id, quantidade:qv, de:'CENTRAL', para:'LOJA' }) });
    if (res.ok) {
      const updated = await res.json();
      setSelected(updated);
      setQtd('1');
      setMsgOk(`${qv} un. de "${selected.nome}" transferidas.`);
      fetch('/api/pecas').then(r=>r.json()).then(setPecas);
      fetch('/api/relatorios/movimentacao?tipo=TRANSFERENCIA').then(r=>r.json()).then(setHistorico);
    } else { const e = await res.json(); setMsg(e.error||'Erro.'); }
    setLoading(false);
  }

  function handleDetected(code:string) { setShowScanner(false); buscarPor(code); }

  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Coluna esquerda - lista de produtos */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">TRANSFERIR PARA LOJA</h1>
        <p className="text-sm text-slate-500 mb-4">Estoque Central → Estoque da Loja</p>
        {msgOk&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-bold">{msgOk}</div>}
        {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

        {/* Filtros e busca */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            {([['todos','Todos'],['nome','Nome'],['sku','SKU'],['barcode','Cod.Barras'],['interno','Interno']] as [Filtro,string][]).map(([k,l])=>(
              <button key={k} onClick={()=>setFiltro(k)} className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${filtro===k?'bg-brand-600 text-white':'text-slate-500 hover:bg-slate-50'}`}>{l}</button>
            ))}
          </div>
          <div className="flex-1 flex gap-2">
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." className="input-field flex-1 text-xs"/>
            <button onClick={()=>setShowScanner(true)} className="btn-primary text-xs inline-flex items-center gap-1 px-3">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
            </button>
          </div>
        </div>

        <EstoqueCategorias active={catSlug} onChange={setCatSlug}/>

        <div className="card-table overflow-auto max-h-[60vh]">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50/60 sticky top-0">
              <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase">Produto</th>
              <th className="text-center py-2.5 px-3 font-semibold text-slate-500 uppercase">Central</th>
              <th className="text-center py-2.5 px-3 font-semibold text-slate-500 uppercase">Loja</th>
              <th className="text-right py-2.5 px-3 font-semibold text-slate-500 uppercase">Qtd</th>
            </tr></thead>
            <tbody>{filter.slice(0,50).map(p=>(
              <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer ${selected?.id===p.id?'bg-brand-50':''}`} onClick={()=>{setSelected(p);setQtd('1');}}>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    {p.imagemUrl?<img src={p.imagemUrl} className="w-8 h-8 rounded object-cover"/>:<div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-300"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>}
                    <div>
                      <p className="font-medium text-slate-700">{p.nome}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.codigo} {p.codigoBarras?`| ${p.codigoBarras}`:''}</p>
                      <p className="text-[10px] text-slate-400">{p.categoria.nome}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2 px-3 text-center font-bold text-slate-700">{p.quantidade}</td>
                <td className="py-2 px-3 text-center font-bold text-brand-600">{p.quantidadeLoja||0}</td>
                <td className="py-2 px-3 text-right">
                  <button onClick={(e)=>{e.stopPropagation();setSelected(p);setQtd('1');}} className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded font-bold">+</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Coluna direita - detalhe + ação */}
      <div className="w-full lg:w-96 border-l border-slate-200 bg-white p-6 flex flex-col">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Detalhes da Transferencia</h2>
        {selected ? (
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              {selected.imagemUrl ? <img src={selected.imagemUrl} className="w-16 h-16 rounded-lg object-cover"/> :
                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>}
              <div>
                <h3 className="text-sm font-bold text-slate-800">{selected.nome}</h3>
                <p className="text-xs text-slate-500">{selected.marca||selected.categoria.nome}</p>
                <p className="text-[10px] text-slate-400 font-mono">SKU: {selected.codigo}</p>
                {selected.codigoBarras && <p className="text-[10px] text-slate-400 font-mono">Barcode: {selected.codigoBarras}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase">Central</p>
                <p className="text-lg font-bold text-slate-800">{selected.quantidade}</p>
              </div>
              <div className="bg-brand-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase">Loja</p>
                <p className="text-lg font-bold text-brand-700">{selected.quantidadeLoja||0}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Quantidade a transferir</label>
              <div className="flex items-center gap-2">
                <input type="number" value={qtd} onChange={e=>setQtd(e.target.value)} className="input-field w-full text-center text-lg font-bold" min="1" max={selected.quantidade}/>
                <button onClick={transferir} disabled={loading||!qtd} className="btn-primary text-xs px-6 py-3 whitespace-nowrap">
                  {loading?'Transferindo...':'Transferir →'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Maximo: {selected.quantidade} un.</p>
            </div>

            <button onClick={()=>setSelected(null)} className="btn-secondary text-xs w-full">Cancelar</button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-slate-400 text-xs space-y-2">
            <div>
              <svg className="w-12 h-12 mx-auto mb-2 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              <p>Selecione um produto<br/>na lista ao lado ou<br/>escaneie o codigo de barras</p>
            </div>
          </div>
        )}

        {/* Historico */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-600 uppercase mb-2">Ultimas transferencias</h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {historico.slice(0,8).map((h:any,i:number)=>(
              <div key={i} className="text-[10px] flex items-center justify-between">
                <span className="text-slate-600 truncate">{h.peca?.nome||'-'}</span>
                <span className="text-brand-600 font-bold ml-2">{h.quantidade}un → Loja</span>
              </div>
            ))}
            {historico.length===0 && <p className="text-[10px] text-slate-400">Nenhuma transferencia.</p>}
          </div>
        </div>
      </div>

      {showScanner && <BarcodeScanner onDetected={handleDetected} onClose={()=>setShowScanner(false)}/>}
    </div>
  );
}
