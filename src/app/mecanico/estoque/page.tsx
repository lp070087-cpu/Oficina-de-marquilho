'use client';

import { useState, useEffect } from 'react';

interface Categoria { id: string; nome: string; slug: string; }
interface Peca { id: string; nome: string; codigo: string; subcategoria?: string; marca?: string; compatibilidade?: string; precoVenda: number; quantidade: number; estoqueMinimo: number; categoriaId: string; categoria: { nome: string }; }

type View = 'categorias' | 'subcategorias' | 'pecas';

const iconeCategoria = (slug: string) => {
  const icons: Record<string, JSX.Element> = {
    motor: <svg className="w-9 h-9 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 3h4v4H4V3zm8 14h4v4h-4v-4zM4 13h4v4H4v-4zm8-10h4v4h-4V3zm-2 4V3m0 18v-4M3 7h4m-4 4h4m10-2h4m-4 4h4M6 17v-2m12-8v2M6 7v2m12 10v-2M12 7v10"/></svg>,
    freios: <svg className="w-9 h-9 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.5}/><circle cx="12" cy="12" r="4" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2m0 14v2M3 12h2m14 0h2"/></svg>,
    eletrica: <svg className="w-9 h-9 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 2h10l-2 8h4l-8 12 2-8H7L9 2z"/></svg>,
    suspensao: <svg className="w-9 h-9 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3h8M8 3v3m8-3v3M8 6h8M6 9h12v2l-10 10H8V9z"/></svg>,
    transmissao: <svg className="w-9 h-9 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="6" r="2" strokeWidth={1.5}/><circle cx="19" cy="6" r="2" strokeWidth={1.5}/><circle cx="12" cy="18" r="2" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6h10M5 8v8m14-10v8m-7 4v-6M5 18h14"/></svg>,
    carroceria: <svg className="w-9 h-9 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 4h2a2 2 0 012 2v2M3 10h2m14 0h2M7 8h10m-7 4v6m4-6v6M5 14h14v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4z"/><circle cx="7" cy="18" r="1.5" fill="currentColor"/><circle cx="17" cy="18" r="1.5" fill="currentColor"/></svg>,
    'rodas-e-pneus': <svg className="w-9 h-9 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.5}/><circle cx="12" cy="12" r="4" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M18.4 5.6l-2.1 2.1M5.4 18.4l2.1-2.1"/></svg>,
    'oleos-e-fluidos': <svg className="w-9 h-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4h12l-2 8H8L6 4zm2 8v6a2 2 0 002 2h4a2 2 0 002-2v-6M5 6h14M4 10h16"/></svg>,
    escapamento: <svg className="w-9 h-9 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h4l2-4h4l2 4h4v4H4v-4zm2 4v2a2 2 0 002 2h8a2 2 0 002-2v-2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 18v4m8-4v4" opacity={0.4}/></svg>,
    acessorios: <svg className="w-9 h-9 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h4l-2 4h4" opacity={0.6}/></svg>,
  };
  return icons[slug] || icons.acessorios;
};

export default function MecanicoEstoque() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [view, setView] = useState<View>('categorias');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<string | null>(null);

  useEffect(()=>{Promise.all([fetch('/api/categorias').then(r=>r.json()),fetch('/api/pecas').then(r=>r.json())]).then(([cats,pecasData])=>{setCategorias(cats);setPecas(pecasData);setLoading(false);});},[]);
  const pecasFiltradas=pecas.filter(p=>{if(!busca)return true;const q=busca.toLowerCase();return p.nome.toLowerCase().includes(q)||p.codigo.toLowerCase().includes(q);});
  const totalPecas=pecas.length;
  const categoriasComContagem=categorias.map(c=>({...c,_count:{pecas:pecas.filter(p=>p.categoriaId===c.id).length}})).filter(c=>c._count.pecas>0);
  const subcategorias=categoriaSelecionada?[...new Set(pecas.filter(p=>p.categoriaId===categoriaSelecionada.id&&p.subcategoria).map(p=>p.subcategoria!))].sort() : [];
  const pecasNivel=view==='pecas'&&categoriaSelecionada&&subcategoriaSelecionada?pecasFiltradas.filter(p=>p.categoriaId===categoriaSelecionada.id&&p.subcategoria===subcategoriaSelecionada):[];

  function selecionarCategoria(cat:Categoria){setCategoriaSelecionada(cat);setSubcategoriaSelecionada(null);setView('subcategorias');setBusca('');}
  function selecionarSubcategoria(sub:string){setSubcategoriaSelecionada(sub);setView('pecas');}
  function voltarNivel(){if(view==='pecas'){setSubcategoriaSelecionada(null);setView('subcategorias');}else if(view==='subcategorias'){setCategoriaSelecionada(null);setView('categorias');}setBusca('');}
  function irParaCategorias(){setCategoriaSelecionada(null);setSubcategoriaSelecionada(null);setView('categorias');setBusca('');}
  const formatMoney=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
            <button onClick={irParaCategorias} className="hover:text-brand-600 transition-colors font-medium">Estoque</button>
            {categoriaSelecionada&&(<><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg><button onClick={()=>{setSubcategoriaSelecionada(null);setView('subcategorias');setBusca('');}} className="hover:text-brand-600 transition-colors font-medium">{categoriaSelecionada.nome}</button></>)}
            {subcategoriaSelecionada&&(<><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg><span className="text-slate-600 font-medium">{subcategoriaSelecionada}</span></>)}
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">CONSULTAR ESTOQUE</h1>
        </div>
        <div className="text-xs text-slate-400">{totalPecas} pecas no estoque</div>
      </div>
      <div className="mb-5 flex-shrink-0"><div className="relative max-w-md"><svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar peca ou SKU..." className="input-field pl-10"/></div></div>
      {loading?<div className="flex-1 flex items-center justify-center"><p className="text-sm text-slate-400">Carregando...</p></div>:(
        <div className="flex-1 overflow-auto">
          {view==='categorias'&&(<div className="grid grid-cols-4 gap-3">{categoriasComContagem.map(cat=>(<button key={cat.id} onClick={()=>selecionarCategoria(cat)} className="card flex flex-col items-center justify-center text-center p-7 hover:border-brand-300 hover:shadow-md transition-all group cursor-pointer min-h-[160px]"><div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 group-hover:scale-105 duration-200 transition-all">{iconeCategoria(cat.slug)}</div><h3 className="text-sm font-semibold text-slate-800 mb-1">{cat.nome}</h3><p className="text-xs text-slate-400">{cat._count.pecas} pecas</p></button>))}</div>)}
          {view==='subcategorias'&&(<div><button onClick={voltarNivel} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 mb-4 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>Voltar para categorias</button><div className="grid grid-cols-4 gap-3">{subcategorias.map(sub=>(<button key={sub} onClick={()=>selecionarSubcategoria(sub)} className="card p-5 hover:border-brand-300 hover:shadow-md transition-all group cursor-pointer text-left"><div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-3 group-hover:bg-brand-100 group-hover:scale-105 duration-200 transition-all"><svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div><h3 className="text-sm font-semibold text-slate-800 mb-1">{sub}</h3><p className="text-xs text-slate-400">{pecas.filter(p=>p.categoriaId===categoriaSelecionada!.id&&p.subcategoria===sub).length} pecas</p></button>))}</div></div>)}
          {view==='pecas'&&(<div><button onClick={voltarNivel} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 mb-4 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>Voltar para {categoriaSelecionada?.nome}</button>{pecasNivel.length===0?(<div className="card text-center py-16"><p className="text-sm text-slate-400">Nenhuma peca encontrada.</p></div>):(<div className="card-table"><div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/60"><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Peca</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Marca</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Compativel</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Preco</th><th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Disponivel</th><th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th></tr></thead><tbody>{pecasNivel.map((p,i)=>(<tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i%2===0?'bg-white':'bg-slate-50/20'} ${p.quantidade<=p.estoqueMinimo?'bg-amber-50/20':''}`}><td className="py-3 px-4 font-mono text-xs text-slate-500">{p.codigo}</td><td className="py-3 px-4"><p className="font-medium text-slate-800">{p.nome}</p></td><td className="py-3 px-4 text-xs text-slate-500">{p.marca||'-'}</td><td className="py-3 px-4 text-xs text-slate-500 max-w-[120px] truncate">{p.compatibilidade||'-'}</td><td className="py-3 px-4 text-xs font-medium text-slate-700">{formatMoney(Number(p.precoVenda))}</td><td className="py-3 px-4 text-center"><span className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded text-xs font-bold ${p.quantidade<=p.estoqueMinimo?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-700'}`}>{p.quantidade}</span></td><td className="py-3 px-4 text-center"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${p.quantidade<=p.estoqueMinimo?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700'}`}><span className={`w-1.5 h-1.5 rounded-full ${p.quantidade<=p.estoqueMinimo?'bg-amber-500':'bg-emerald-500'}`}/>{p.quantidade<=p.estoqueMinimo?'Baixo':'OK'}</span></td></tr>))}</tbody></table></div></div>)}</div>)}
        </div>
      )}
    </div>
  );
}
