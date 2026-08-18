'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import React from 'react';
import { mascaraMoeda } from '@/lib/moeda-utils';
import { pecaMatchBusca } from '@/lib/peca-utils';

interface Categoria { id: string; nome: string; slug: string; _count?: { pecas: number }; }
interface Peca {
  id: string; nome: string; codigo: string; codigoBarras?: string; subcategoria?: string;
  marca?: string; compatibilidade?: string;
  precoVenda: number; precoCusto: number; quantidade: number; estoqueMinimo: number;
  descricao?: string; categoriaId: string; categoria: { nome: string };
}

type View = 'categorias' | 'subcategorias' | 'pecas';

// Ícones específicos — Motor=engrenagem, Freios=disco, Elétrica=plug, Suspensão=amortecedor,
// Transmissão=corrente, Carroceria=moto, Rodas=roda, Óleos=tambor, Escapamento=fumaça, Acessórios=maleta
const iconeCategoria = (slug: string) => {
  const icons: Record<string, React.ReactNode> = {
    motor: <svg className="w-9 h-9 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 3h4v4H4V3zm8 14h4v4h-4v-4zM4 13h4v4H4v-4zm8-10h4v4h-4V3zm-2 4V3m0 18v-4M3 7h4m-4 4h4m10-2h4m-4 4h4M6 17v-2m12-8v2M6 7v2m12 10v-2M12 7v10"/></svg>,
    freios: <svg className="w-9 h-9 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.5}/><circle cx="12" cy="12" r="4" strokeWidth={1.5}/><circle cx="12" cy="12" r={1.5} fill="currentColor"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2m0 14v2M3 12h2m14 0h2"/></svg>,
    eletrica: <svg className="w-9 h-9 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 2h10l-2 8h4l-8 12 2-8H7L9 2z"/></svg>,
    suspensao: <svg className="w-9 h-9 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3h8M8 3v3m8-3v3M8 6h8M6 9h12v2l-10 10H8V9z"/></svg>,
    transmissao: <svg className="w-9 h-9 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="6" r="2" strokeWidth={1.5}/><circle cx="19" cy="6" r="2" strokeWidth={1.5}/><circle cx="12" cy="18" r="2" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6h10M5 8v8m14-10v8m-7 4v-6M5 18h14"/></svg>,
    carroceria: <svg className="w-9 h-9 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 4h2a2 2 0 012 2v2M3 10h2m14 0h2M7 8h10m-7 4v6m4-6v6M5 14h14v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4z"/><circle cx="7" cy="18" r={1.5} fill="currentColor"/><circle cx="17" cy="18" r={1.5} fill="currentColor"/></svg>,
    'rodas-e-pneus': <svg className="w-9 h-9 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.5}/><circle cx="12" cy="12" r="4" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M18.4 5.6l-2.1 2.1M5.4 18.4l2.1-2.1"/></svg>,
    'oleos-e-fluidos': <svg className="w-9 h-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4h12l-2 8H8L6 4zm2 8v6a2 2 0 002 2h4a2 2 0 002-2v-6M5 6h14M4 10h16"/></svg>,
    escapamento: <svg className="w-9 h-9 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h4l2-4h4l2 4h4v4H4v-4zm2 4v2a2 2 0 002 2h8a2 2 0 002-2v-2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 18v4m8-4v4" opacity={0.4}/></svg>,
    acessorios: <svg className="w-9 h-9 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h4l-2 4h4" opacity={0.6}/></svg>,
  };
  return icons[slug] || icons.acessorios;
};

export default function EstoquePage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // Contadores reais (agregados no banco via /api/estoque/stats)
  const [statsApi, setStatsApi] = useState({
    totalProdutos: 0, unidadesCentral: 0, unidadesLoja: 0, unidadesTotal: 0,
    estoqueBaixo: 0, semEstoque: 0,
  });

  const [view, setView] = useState<View>('categorias');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<string | null>(null);

  const [modal, setModal] = useState<{ open: boolean; peca?: Peca }>({ open: false });
  const [form, setForm] = useState({ nome: '', codigo: '', descricao: '', subcategoria: '', marca: '', compatibilidade: '', precoVenda: '', precoCusto: '', quantidade: '', estoqueMinimo: '5', categoriaId: '' });
  const [msg, setMsg] = useState('');

  // BLOCO 10 — edição inline de preço (DONA/ESTOQUE têm permissão)
  const [editandoPreco, setEditandoPreco] = useState<{ id: string; precoVenda: string; salvando: boolean } | null>(null);
  const precoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    Promise.all([fetch('/api/categorias').then(r=>r.json()), fetch('/api/pecas').then(r=>r.json()), fetch('/api/estoque/stats').then(r=>r.json())])
      .then(([cats,pecasData,statsData])=>{
        setCategorias(cats);
        setPecas(pecasData);
        if (statsData && !statsData.error) setStatsApi(statsData);
        setLoading(false);
      })
      .catch(()=>setLoading(false));
  }, []);

  const fetchPecas = async () => { const res = await fetch('/api/pecas'); setPecas(await res.json()); };

  const pecasFiltradas = pecas.filter(p=>{if(!busca)return true;return pecaMatchBusca(p, busca, ['nome','codigo','codigoBarras','marca','compatibilidade']);});
  // Contadores reais (agregados no banco) com fallback para a listagem enquanto a API não carrega
  const totalPecas = statsApi.totalProdutos > 0 ? statsApi.totalProdutos : pecas.length;
  const estoqueBaixo = statsApi.totalProdutos > 0 ? statsApi.estoqueBaixo : pecas.filter(p=>p.estoqueMinimo > 0 && p.quantidade < p.estoqueMinimo).length;

  const categoriasComContagem = useMemo(() => categorias.map(c=>({...c,_count:{pecas:pecas.filter(p=>p.categoriaId===c.id).length}})).filter(c=>(c._count?.pecas??0)>0), [categorias, pecas]);
  const NO_SUBCAT_DONO = '__sem_subcategoria__';
  const LABEL_SEM_SUBCATEGORIA = 'Sem subcategoria';
  const labelSubcategoria = subcategoriaSelecionada === NO_SUBCAT_DONO ? LABEL_SEM_SUBCATEGORIA : subcategoriaSelecionada;
  const subcategorias = categoriaSelecionada ? [...new Set(pecas.filter(p=>p.categoriaId===categoriaSelecionada.id&&p.subcategoria).map(p=>p.subcategoria!))].sort() : [];
  const temSemSubcategoria = categoriaSelecionada ? pecas.some(p=>p.categoriaId===categoriaSelecionada.id&&!p.subcategoria) : false;
  const subcategoriasContagem = useMemo(() => {
    if (!categoriaSelecionada) return new Map();
    const map = new Map<string, { count: number; baixas: number }>();
    for (const p of pecas) {
      if (p.categoriaId !== categoriaSelecionada.id || !p.subcategoria) continue;
      const entry = map.get(p.subcategoria) || { count: 0, baixas: 0 };
      entry.count++;
      if (p.quantidade <= p.estoqueMinimo) entry.baixas++;
      map.set(p.subcategoria, entry);
    }
    if (temSemSubcategoria) {
      const sem = pecas.filter(p=>p.categoriaId===categoriaSelecionada.id&&!p.subcategoria);
      const baixas = sem.filter(p=>p.quantidade <= p.estoqueMinimo).length;
      map.set(NO_SUBCAT_DONO, { count: sem.length, baixas });
    }
    return map;
  }, [pecas, categoriaSelecionada, temSemSubcategoria]);
  const pecasNivel = view==='pecas'&&categoriaSelecionada&&subcategoriaSelecionada ? pecasFiltradas.filter(p=>p.categoriaId===categoriaSelecionada.id&&(subcategoriaSelecionada===NO_SUBCAT_DONO?!p.subcategoria:p.subcategoria===subcategoriaSelecionada)) : [];

  function selecionarCategoria(cat:Categoria){setCategoriaSelecionada(cat);setSubcategoriaSelecionada(null);setView('subcategorias');setBusca('');}
  function selecionarSubcategoria(sub:string){setSubcategoriaSelecionada(sub);setView('pecas');}
  function voltarNivel(){if(view==='pecas'){setSubcategoriaSelecionada(null);setView('subcategorias');}else if(view==='subcategorias'){setCategoriaSelecionada(null);setView('categorias');}setBusca('');}
  function irParaCategorias(){setCategoriaSelecionada(null);setSubcategoriaSelecionada(null);setView('categorias');setBusca('');}

  function fmtMoeda(v:number){return v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function parseMoeda(v:string){return parseFloat((v||'').replace(/\./g,'').replace(',','.'))||0;}
  function onBlurPreco(field:'precoVenda'|'precoCusto'){const val=parseMoeda(form[field]);setForm({...form,[field]:fmtMoeda(val)});}

  // BLOCO 10 — edição inline de preço
  function iniciarEdicaoPreco(p: Peca) {
    setEditandoPreco({ id: p.id, precoVenda: fmtMoeda(Number(p.precoVenda)), salvando: false });
    setTimeout(() => { precoInputRef.current?.focus(); precoInputRef.current?.select(); }, 30);
  }

  async function salvarPrecoInline() {
    if (!editandoPreco) return;
    const atual = parseMoeda(editandoPreco.precoVenda);
    if (!Number.isFinite(atual) || atual < 0) { setEditandoPreco(null); return; }
    const pecaAtual = pecas.find(p => p.id === editandoPreco.id);
    if (!pecaAtual || Math.abs(Number(pecaAtual.precoVenda) - atual) < 0.005) { setEditandoPreco(null); return; }

    setEditandoPreco(prev => prev ? { ...prev, salvando: true } : prev);
    try {
      const res = await fetch(`/api/pecas/${editandoPreco.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precoVenda: atual }),
      });
      if (res.ok) { setMsg(''); fetchPecas(); }
      else { const e = await res.json(); setMsg(e.error || 'Erro ao salvar preço.'); }
    } catch {
      setMsg('Erro de conexao ao salvar preço.');
    }
    setEditandoPreco(null);
  }
  function abrirForm(peca?:Peca){
    if(peca){setForm({nome:peca.nome,codigo:peca.codigo,descricao:peca.descricao||'',subcategoria:peca.subcategoria&&peca.subcategoria!==NO_SUBCAT_DONO?peca.subcategoria:'',marca:peca.marca||'',compatibilidade:peca.compatibilidade||'',precoVenda:fmtMoeda(Number(peca.precoVenda)),precoCusto:fmtMoeda(Number(peca.precoCusto)),quantidade:String(peca.quantidade),estoqueMinimo:String(peca.estoqueMinimo),categoriaId:peca.categoriaId});setModal({open:true,peca});}
    else{setForm({nome:'',codigo:'',descricao:'',subcategoria:subcategoriaSelecionada&&subcategoriaSelecionada!==NO_SUBCAT_DONO?subcategoriaSelecionada:'',marca:'',compatibilidade:'',precoVenda:'',precoCusto:'',quantidade:'',estoqueMinimo:'5',categoriaId:categoriaSelecionada?.id||''});setModal({open:true});}
  }
  async function salvar(){if(!form.nome||!form.codigo||!form.categoriaId){setMsg('Preencha nome, codigo e categoria.');return;}const subcategoria=form.subcategoria.trim();const body={...form,subcategoria,precoVenda:parseMoeda(form.precoVenda),precoCusto:parseMoeda(form.precoCusto),quantidade:Number(form.quantidade)||0,estoqueMinimo:Number(form.estoqueMinimo)||5};const url=modal.peca?`/api/pecas/${modal.peca.id}`:'/api/pecas';const method=modal.peca?'PUT':'POST';const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(res.ok){setModal({open:false});fetchPecas();setMsg('');}else{const e=await res.json();setMsg(e.error||'Erro ao salvar.');}}
  async function remover(id:string){if(!confirm('Remover esta peca?'))return;await fetch(`/api/pecas/${id}`,{method:'DELETE'});fetchPecas();}

  function exportarCSV(){const data=view==='pecas'?pecasNivel:pecasFiltradas;const headers=['SKU','Peca','Marca','Compatibilidade','Categoria','Preco','Estoque','Status'];const grupos=new Map<string,Peca[]>();for(const p of data){const c=p.categoria.nome||'Sem categoria';if(!grupos.has(c))grupos.set(c,[]);grupos.get(c)!.push(p);}const cats=[...grupos.keys()].sort((a,b)=>a.localeCompare(b,'pt-BR'));const rows:any[]=[];for(const c of cats){rows.push([`=== ${c.toUpperCase()} ===`]);const itens=grupos.get(c)!.slice().sort((a,b)=>{const n=a.nome.localeCompare(b.nome,'pt-BR');return n!==0?n:a.codigo.localeCompare(b.codigo,'pt-BR');});for(const p of itens){rows.push([p.codigo,p.nome,p.marca||'-',p.compatibilidade||'-',p.categoria.nome,p.precoVenda.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),String(p.quantidade),p.quantidade<=p.estoqueMinimo?'BAIXO':'OK']);}}const csv=[headers,...rows].map(r=>r.map((c:any)=>`"${c}"`).join(',')).join('\n');const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='estoque-marquinho.csv';a.click();URL.revokeObjectURL(url);}

  const formatMoney=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
            <button onClick={irParaCategorias} className="hover:text-brand-600 transition-colors font-medium">Estoque</button>
            {categoriaSelecionada&&(<><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg><button onClick={()=>{setSubcategoriaSelecionada(null);setView('subcategorias');setBusca('');}} className="hover:text-brand-600 transition-colors font-medium">{categoriaSelecionada.nome}</button></>)}
            {subcategoriaSelecionada&&(<><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg><span className="text-slate-600 font-medium">{labelSubcategoria}</span></>)}
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">{view==='categorias'?'ESTOQUE DE PECAS':view==='subcategorias'?categoriaSelecionada?.nome.toUpperCase():labelSubcategoria?.toUpperCase()}</h1>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-5 text-xs">
            <div className="text-center"><p className="text-slate-400">Total pecas</p><p className="text-sm font-bold text-slate-800">{totalPecas}</p></div>
            <div className="w-px h-8 bg-slate-200"/>
            <div className="text-center"><p className="text-slate-400">Estoque baixo</p><p className={`text-sm font-bold ${estoqueBaixo>0?'text-amber-600':'text-emerald-600'}`}>{estoqueBaixo}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportarCSV} className="btn-secondary inline-flex items-center gap-2 text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Exportar CSV</button>
            <button onClick={()=>abrirForm()} className="btn-primary inline-flex items-center gap-2 text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Nova peca</button>
          </div>
        </div>
      </div>

      <div className="mb-5 flex-shrink-0">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar peca ou SKU..." className="input-field pl-10"/>
        </div>
      </div>

      {loading?<div className="flex-1 flex items-center justify-center"><p className="text-sm text-slate-400">Carregando...</p></div>:(
        <div className="flex-1 overflow-auto">
          {view==='categorias'&&(
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoriasComContagem.map(cat=>(
                <button key={cat.id} onClick={()=>selecionarCategoria(cat)} className="card flex flex-col items-center justify-center text-center p-7 hover:border-brand-300 hover:shadow-md transition-all group cursor-pointer min-h-[160px]">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors group-hover:scale-105 duration-200">
                    {iconeCategoria(cat.slug)}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">{cat.nome}</h3>
                  <p className="text-xs text-slate-400">{cat._count?.pecas??0} pecas</p>
                </button>
              ))}
            </div>
          )}
          {view==='subcategorias'&&(
            <div>
              <button onClick={voltarNivel} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 mb-4 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>Voltar para categorias</button>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {subcategorias.map(sub=>{const s = subcategoriasContagem.get(sub) || { count: 0, baixas: 0 }; const count = s.count; const baixas = s.baixas; return(
                  <button key={sub} onClick={()=>selecionarSubcategoria(sub)} className="card p-5 hover:border-brand-300 hover:shadow-md transition-all group cursor-pointer text-left">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 group-hover:scale-105 duration-200 transition-all">
                        <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      </div>
                      {baixas>0&&<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">{baixas} baixo</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">{sub}</h3>
                    <p className="text-xs text-slate-400">{count} pecas</p>
                  </button>
                );})}
                {temSemSubcategoria&&(()=>{const s=subcategoriasContagem.get(NO_SUBCAT_DONO)||{count:0,baixas:0};const count=s.count;const baixas=s.baixas;return(
                  <button key={NO_SUBCAT_DONO} onClick={()=>selecionarSubcategoria(NO_SUBCAT_DONO)} className="card p-5 hover:border-brand-300 hover:shadow-md transition-all group cursor-pointer text-left border-dashed border-slate-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 group-hover:scale-105 duration-200 transition-all">
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      </div>
                      {baixas>0&&<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">{baixas} baixo</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">Sem subcategoria</h3>
                    <p className="text-xs text-slate-400">{count} pecas</p>
                  </button>
                );})()}
              </div>
            </div>
          )}
          {view==='pecas'&&(
            <div>
              <button onClick={voltarNivel} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 mb-4 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>Voltar para {categoriaSelecionada?.nome}</button>
              {pecasNivel.length===0?(
                <div className="card text-center py-16"><div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div><p className="text-sm text-slate-400">Nenhuma peca encontrada nesta subcategoria.</p><button onClick={()=>abrirForm()} className="btn-primary mt-4 text-xs">Adicionar peca</button></div>
              ):(
                <div className="card-table"><div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50/60"><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Peca</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Marca</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Compativel</th><th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Preco</th><th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estoque</th><th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th><th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acoes</th></tr></thead>
                    <tbody>
                      {pecasNivel.map((p,i)=>(
                        <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i%2===0?'bg-white':'bg-slate-50/20'} ${p.quantidade<=p.estoqueMinimo?'bg-amber-50/20':''}`}>
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">{p.codigo}</td>
                          <td className="py-3 px-4"><p className="font-medium text-slate-800">{p.nome}</p>{p.descricao&&<p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{p.descricao}</p>}</td>
                          <td className="py-3 px-4 text-xs text-slate-500">{p.marca||'-'}</td>
                          <td className="py-3 px-4 text-xs text-slate-500 max-w-[120px] truncate">{p.compatibilidade||'-'}</td>
                          <td className="py-3 px-4 text-xs">
                            {editandoPreco?.id === p.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  ref={precoInputRef}
                                  type="text"
                                  inputMode="decimal"
                                  value={editandoPreco.precoVenda}
                                  onChange={e => setEditandoPreco(prev => prev ? { ...prev, precoVenda: mascaraMoeda(e.target.value, prev.precoVenda) } : prev)}
                                  onBlur={salvarPrecoInline}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') { e.preventDefault(); salvarPrecoInline(); }
                                    if (e.key === 'Escape') { e.preventDefault(); setEditandoPreco(null); }
                                  }}
                                  className="w-24 text-right input-field !py-1 !px-2 text-xs"
                                  disabled={editandoPreco.salvando}
                                />
                                {editandoPreco.salvando && <span className="text-[9px] text-slate-400 animate-pulse">Salvando…</span>}
                              </div>
                            ) : (
                              <button
                                onClick={() => iniciarEdicaoPreco(p)}
                                className="font-medium text-slate-700 hover:text-brand-600 hover:underline underline-offset-2 transition-colors"
                                title="Clique para editar o preco"
                              >
                                {formatMoney(Number(p.precoVenda))}
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center"><span className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded text-xs font-bold ${p.quantidade<=p.estoqueMinimo?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-700'}`}>{p.quantidade}</span></td>
                          <td className="py-3 px-4 text-center"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${p.quantidade<=p.estoqueMinimo?'bg-amber-50 text-amber-700':'bg-emerald-50 text-emerald-700'}`}><span className={`w-1.5 h-1.5 rounded-full ${p.quantidade<=p.estoqueMinimo?'bg-amber-500':'bg-emerald-500'}`}/>{p.quantidade<=p.estoqueMinimo?'Baixo':'OK'}</span></td>
                          <td className="py-3 px-4 text-right"><button onClick={()=>abrirForm(p)} className="text-xs text-brand-600 hover:text-brand-700 font-medium mr-3">Editar</button><button onClick={()=>remover(p.id)} className="text-xs text-slate-400 hover:text-red-600">Remover</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div></div>
              )}
            </div>
          )}
        </div>
      )}

      {modal.open&&(
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-800 mb-5">{modal.peca?'Editar peca':'Nova peca'}</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome</label><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">SKU / Codigo</label><input value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Subcategoria</label><select value={form.subcategoria} onChange={e=>setForm({...form,subcategoria:e.target.value})} className="input-field mt-1.5"><option value="">Selecionar...</option>{subcategorias.map(s=>(<option key={s} value={s}>{s}</option>))}</select></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Marca</label><input value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})} className="input-field mt-1.5" placeholder="ProTork, NGK..."/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Compatibilidade</label><input value={form.compatibilidade} onChange={e=>setForm({...form,compatibilidade:e.target.value})} className="input-field mt-1.5" placeholder="Ex: CG 125 2000-2008"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoria</label><select value={form.categoriaId} onChange={e=>setForm({...form,categoriaId:e.target.value})} className="input-field mt-1.5"><option value="">Selecionar</option>{categorias.map(c=>(<option key={c.id} value={c.id}>{c.nome}</option>))}</select></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Descricao</label><input value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Preco venda (R$)</label><input type="text" inputMode="decimal" value={form.precoVenda} onChange={e=>setForm({...form,precoVenda:mascaraMoeda(e.target.value,form.precoVenda)})} onBlur={()=>onBlurPreco('precoVenda')} className="input-field mt-1.5" placeholder="0,00"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Preco custo (R$)</label><input type="text" inputMode="decimal" value={form.precoCusto} onChange={e=>setForm({...form,precoCusto:mascaraMoeda(e.target.value,form.precoCusto)})} onBlur={()=>onBlurPreco('precoCusto')} className="input-field mt-1.5" placeholder="0,00"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantidade</label><input type="number" value={form.quantidade} onChange={e=>setForm({...form,quantidade:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Estoque minimo</label><input type="number" value={form.estoqueMinimo} onChange={e=>setForm({...form,estoqueMinimo:e.target.value})} className="input-field mt-1.5"/></div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100"><button onClick={()=>setModal({open:false})} className="btn-secondary text-xs">Cancelar</button><button onClick={salvar} className="btn-primary text-xs">Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
