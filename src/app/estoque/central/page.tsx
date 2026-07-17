'use client';
// VERSÃO CENTRAL 2026
import { useState, useEffect, useCallback } from 'react';
import EstoqueCategorias from '@/components/estoque/EstoqueCategorias';
import { useEstoqueRefresh } from '@/lib/estoque-events';

interface Categoria { id:string; nome:string; slug:string; }
interface Peca { id:string; nome:string; codigo:string; codigoBarras?:string; precoVenda:number; precoCusto:number; quantidade:number; quantidadeLoja:number; estoqueMinimo:number; marca?:string; compatibilidade?:string; localizacao?:string; subcategoria?:string; categoria:{nome:string;id:string;slug:string}; }

export default function EstoqueCentralPage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{open:boolean;peca?:Peca}>({open:false});
  const [form, setForm] = useState({ nome:'',codigo:'',codigoBarras:'',codigoOEM:'',precoVenda:'',precoCusto:'',quantidade:'',quantidadeLoja:'',estoqueMinimo:'5',marca:'',compatibilidade:'',localizacao:'',subcategoria:'',categoriaId:'',descricao:'',fornecedor:'' });
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');
  const [exportModal, setExportModal] = useState(false);
  const PER_PAGE = 20;
  const { refreshKey, triggerRefresh } = useEstoqueRefresh();

  const fetchData = useCallback(async () => {
    let catId = '';
    if (catSlug) {
      const catsRes = await fetch('/api/categorias').then(r=>r.json());
      const cats = Array.isArray(catsRes) ? catsRes : [];
      setCategorias(cats);
      const found = cats.find((c:any)=>c.slug===catSlug);
      if (found) catId = found.id;
    } else {
      const catsRes = await fetch('/api/categorias').then(r=>r.json());
      setCategorias(Array.isArray(catsRes) ? catsRes : []);
    }
    const p = new URLSearchParams();
    if (busca) p.set('q',busca);
    if (catId) p.set('categoria', catId);
    const pecasRes = await fetch(`/api/pecas?${p}`).then(r=>r.json());
    setPecas(Array.isArray(pecasRes) ? pecasRes : []);
    setLoading(false);
  }, [busca, catSlug, refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const totalPages = Math.ceil(pecas.length / PER_PAGE);
  const paginated = pecas.slice((page-1)*PER_PAGE, page*PER_PAGE);

  function abrirForm(peca?:Peca) {
    if (peca) { setForm({ nome:peca.nome, codigo:peca.codigo, codigoBarras:peca.codigoBarras||'', codigoOEM:'', precoVenda:String(peca.precoVenda), precoCusto:String(peca.precoCusto), quantidade:String(peca.quantidade), quantidadeLoja:String(peca.quantidadeLoja||0), estoqueMinimo:String(peca.estoqueMinimo), marca:peca.marca||'', compatibilidade:peca.compatibilidade||'', localizacao:peca.localizacao||'', subcategoria:peca.subcategoria||'', categoriaId:peca.categoria.id, descricao:'', fornecedor:'' }); setModal({open:true,peca}); }
    else { setForm({ nome:'',codigo:'',codigoBarras:'',codigoOEM:'',precoVenda:'',precoCusto:'',quantidade:'',quantidadeLoja:'',estoqueMinimo:'5',marca:'',compatibilidade:'',localizacao:'',subcategoria:'',categoriaId:categorias[0]?.id||'',descricao:'',fornecedor:'' }); setModal({open:true}); }
  }

  async function salvar() {
    if (!form.nome||!form.codigo||!form.categoriaId) { setMsg('Preencha nome, codigo e categoria.'); return; }
    // Check duplicate barcode
    if (form.codigoBarras && !modal.peca) {
      const check = await fetch(`/api/pecas?barcode=${encodeURIComponent(form.codigoBarras)}`);
      const exist = await check.json();
      if (Array.isArray(exist) && exist.length>0) {
        setMsg('Produto ja existe com esse codigo de barras. Deseja apenas abastecer o estoque?');
        return;
      }
    }
    const body = { ...form, precoVenda:Number(form.precoVenda)||0, precoCusto:Number(form.precoCusto)||0, quantidade:Number(form.quantidade)||0, quantidadeLoja:Number(form.quantidadeLoja)||0, estoqueMinimo:Number(form.estoqueMinimo)||5 };
    const url = modal.peca ? `/api/pecas/${modal.peca.id}` : '/api/pecas';
    const method = modal.peca ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { setModal({open:false}); fetchData(); triggerRefresh(); setMsgOk('Salvo com sucesso.'); setTimeout(()=>setMsgOk(''),3000); }
    else { const e = await res.json(); setMsg(e.error||'Erro.'); }
  }

  async function remover(id:string) { if (!confirm('Remover?')) return; await fetch(`/api/pecas/${id}`,{method:'DELETE'}); fetchData(); }

  function exportarListaCompras() {
    let data = pecas;
    const w = window.open('','_blank','width=900,height=700');
    if (!w) return;
    const rows = data.map((p,i) => `
      <tr>
        <td>${p.categoria?.nome||''}</td>
        <td>${p.codigo}</td>
        <td>${p.codigoBarras||''}</td>
        <td>${p.nome}</td>
        <td>${p.marca||''}</td>
        <td style="text-align:center">${p.quantidade}</td>
        <td style="text-align:center">${p.estoqueMinimo}</td>
        <td></td><td></td><td></td><td></td>
        <td>${p.localizacao||''}</td>
      </tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Lista de Compras - Marquinho</title>
      <style>body{font-family:Arial;padding:20px;font-size:11px} h1{text-align:center;font-size:16px;margin-bottom:5px}
      table{width:100%;border-collapse:collapse} th,td{border:1px solid #ccc;padding:4px 6px;text-align:left} th{background:#2563eb;color:#fff;font-size:10px}
      @media print{body{padding:5mm} button{display:none}}</style></head><body>
      <h1>Marquinho Moto Peças — Lista de Compras</h1><p style="text-align:center">${new Date().toLocaleDateString('pt-BR')}</p>
      <table><thead><tr>
        <th>Categoria</th><th>Cod.Int.</th><th>Cod.Barras</th><th>Nome</th><th>Marca</th><th>Qtd</th><th>Min</th>
        <th>Forn.A</th><th>Forn.B</th><th>Forn.C</th><th>Forn.D</th><th>Obs</th></tr></thead><tbody>${rows}</tbody></table>
      <button onclick="window.print()" style="margin-top:15px;padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">Imprimir</button>
      </body></html>`);
    w.document.close();
    setExportModal(false);
  }

  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">ESTOQUE CENTRAL</h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>setExportModal(true)} className="btn-secondary inline-flex items-center gap-2 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Exportar Lista
          </button>
          <button onClick={()=>abrirForm()} className="btn-primary inline-flex items-center gap-2 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Novo produto
          </button>
        </div>
      </div>

      {msgOk && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-bold">{msgOk}</div>}

      <input
        value={busca}
        onChange={e=>{setBusca(e.target.value);setPage(1);}}
        placeholder="Buscar por nome, SKU, codigo de barras, marca, compatibilidade..."
        className="input-field max-w-lg mb-4"
      />

      <EstoqueCategorias active={catSlug} onChange={(s)=>{setCatSlug(s);setPage(1);}} />

      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : pecas.length===0 ? (
        <div className="card text-center py-16"><p className="text-sm text-slate-400">Nenhum produto encontrado.</p></div>
      ) : (
        <>
          <div className="card-table overflow-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase">SKU</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase">Produto</th>
                <th className="text-left py-2.5 px-3 font-semibold text-slate-500 uppercase">Marca</th>
                <th className="text-center py-2.5 px-3 font-semibold text-slate-500 uppercase">Central</th>
                <th className="text-center py-2.5 px-3 font-semibold text-slate-500 uppercase">Loja</th>
                <th className="text-right py-2.5 px-3 font-semibold text-slate-500 uppercase">Ações</th>
              </tr></thead>
              <tbody>{paginated.map((p,i)=>(
                <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                  <td className="py-2 px-3 font-mono text-slate-500">{p.codigo}</td>
                  <td className="py-2 px-3"><p className="font-medium text-slate-700 text-xs">{p.nome}</p>{p.subcategoria&&<p className="text-[10px] text-slate-400">{p.subcategoria}</p>}</td>
                  <td className="py-2 px-3 text-slate-500 text-xs">{p.marca||'-'}</td>
                  <td className={`py-2 px-3 text-center font-bold text-xs ${p.quantidade<=p.estoqueMinimo?'text-amber-600':'text-slate-700'}`}>{p.quantidade}</td>
                  <td className="py-2 px-3 text-center text-brand-600 font-medium text-xs">{p.quantidadeLoja||0}</td>
                  <td className="py-2 px-3 text-right">
                    <button onClick={()=>abrirForm(p)} className="text-xs text-brand-600 hover:text-brand-700 font-medium mr-2">Editar</button>
                    <button onClick={()=>remover(p.id)} className="text-xs text-slate-400 hover:text-red-600">Remover</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {totalPages>1&&(
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({length:totalPages},(_,i)=>(
                <button key={i} onClick={()=>setPage(i+1)} className={`w-8 h-8 rounded text-xs font-bold ${page===i+1?'bg-brand-600 text-white':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{i+1}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Export modal */}
      {exportModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">Exportar Lista de Compras</h2>
            <p className="text-sm text-slate-500 mb-4">Qual lista deseja gerar?</p>
            <div className="space-y-3 mb-4">
              <button onClick={()=>{
                const baixo = pecas.filter(p=>p.quantidade<=p.estoqueMinimo);
                const w = window.open('','_blank','width=900,height=700');
                if (!w) { setExportModal(false); return; }
                const rows = baixo.map(p=>`<tr><td>${p.categoria?.nome||''}</td><td>${p.codigo}</td><td>${p.codigoBarras||''}</td><td>${p.nome}</td><td>${p.marca||''}</td><td style="text-align:center">${p.quantidade}</td><td style="text-align:center">${p.estoqueMinimo}</td><td></td><td></td><td></td><td></td><td>${p.localizacao||''}</td></tr>`).join('');
                w.document.write(`<!DOCTYPE html><html><head><title>Compras - Estoque Baixo</title><style>body{font-family:Arial;padding:20px;font-size:11px} h1{text-align:center;font-size:16px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ccc;padding:4px 6px} th{background:#2563eb;color:#fff;font-size:10px} @media print{body{padding:5mm}button{display:none}}</style></head><body><h1>Produtos com Estoque Baixo — ${new Date().toLocaleDateString('pt-BR')}</h1><table><thead><tr><th>Cat</th><th>Cod</th><th>Barras</th><th>Nome</th><th>Marca</th><th>Qtd</th><th>Min</th><th>Forn.A</th><th>Forn.B</th><th>Forn.C</th><th>Forn.D</th><th>Obs</th></tr></thead><tbody>${rows}</tbody></table><button onclick="window.print()" style="margin-top:15px;padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">Imprimir</button></body></html>`);
                w.document.close();
                setExportModal(false);
              }} className="btn-secondary text-xs w-full text-left">
                <strong>Apenas produtos com estoque baixo</strong>
                <p className="text-[10px] text-slate-400 mt-0.5">{pecas.filter(p=>p.quantidade<=p.estoqueMinimo).length} produtos abaixo do estoque minimo</p>
              </button>
              <button onClick={exportarListaCompras} className="btn-secondary text-xs w-full text-left">
                <strong>Todos os produtos</strong>
                <p className="text-[10px] text-slate-400 mt-0.5">{pecas.length} produtos no total</p>
              </button>
            </div>
            <button onClick={()=>setExportModal(false)} className="btn-secondary text-xs w-full">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal cadastro */}
      {modal.open&&(
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 my-4">
            <h2 className="text-base font-bold text-slate-800 mb-4">{modal.peca?'Editar Produto':'Novo Produto'}</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}
            <div className="grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
              <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase">Nome *</label><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">SKU *</label><input value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Cod. Barras</label><input value={form.codigoBarras} onChange={e=>setForm({...form,codigoBarras:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Cod. OEM</label><input value={form.codigoOEM} onChange={e=>setForm({...form,codigoOEM:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Categoria *</label><select value={form.categoriaId} onChange={e=>setForm({...form,categoriaId:e.target.value})} className="input-field mt-1.5"><option value="">Selecionar</option>{categorias.map(c=>(<option key={c.id} value={c.id}>{c.nome}</option>))}</select></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Subcategoria</label><input value={form.subcategoria} onChange={e=>setForm({...form,subcategoria:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Marca</label><input value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Fornecedor</label><input value={form.fornecedor} onChange={e=>setForm({...form,fornecedor:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Compatibilidade / Aplicacao</label><input value={form.compatibilidade} onChange={e=>setForm({...form,compatibilidade:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Localizacao</label><input value={form.localizacao} onChange={e=>setForm({...form,localizacao:e.target.value})} className="input-field mt-1.5" placeholder="Ex: A-03-B-02"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Preco custo</label><input type="number" step="0.01" value={form.precoCusto} onChange={e=>setForm({...form,precoCusto:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Preco venda</label><input type="number" step="0.01" value={form.precoVenda} onChange={e=>setForm({...form,precoVenda:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Qtd Central</label><input type="number" value={form.quantidade} onChange={e=>setForm({...form,quantidade:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Qtd Loja</label><input type="number" value={form.quantidadeLoja} onChange={e=>setForm({...form,quantidadeLoja:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Estoque minimo</label><input type="number" value={form.estoqueMinimo} onChange={e=>setForm({...form,estoqueMinimo:e.target.value})} className="input-field mt-1.5"/></div>
              <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase">Descricao / Observacoes</label><textarea value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} className="input-field mt-1.5" rows={2}/></div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button onClick={()=>setModal({open:false})} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={salvar} className="btn-primary text-xs">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
