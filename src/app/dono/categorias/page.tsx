'use client';

import { useState, useEffect, useCallback } from 'react';

interface Categoria {
  id: string; nome: string; slug: string; descricao?: string;
  descricaoIa?: string;
  icone?: string; ordem: number; ativa: boolean;
  mostrarNaVitrine: boolean; permiteCadastro: boolean;
  parentId?: string | null;
  subcategorias?: Categoria[];
  _count: { pecas: number };
  _estoque?: { totalPecas: number; totalEstoque: number; totalValorEstoque: number };
}

const ICONES = [
  { id: 'motor', label: 'Motor', d: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121' },
  { id: 'freios', label: 'Freios', d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  { id: 'eletrica', label: 'Eletrica', d: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'suspensao', label: 'Suspensao', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'cabos', label: 'Cabos', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { id: 'filtros', label: 'Filtros', d: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
  { id: 'transmissao', label: 'Transmissao', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'escapamento', label: 'Escapamento', d: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { id: 'oleos', label: 'Oleos', d: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5' },
  { id: 'acessorios', label: 'Acessorios', d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { id: 'pneus', label: 'Pneus', d: 'M12 2a10 10 0 00-9.95 9h19.9A10 10 0 0012 2zm0 16a6 6 0 100-12 6 6 0 000 12zm0-4a2 2 0 100-4 2 2 0 000 4z' },
  { id: 'carenagem', label: 'Carenagem', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'farol', label: 'Farol', d: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'bateria', label: 'Bateria', d: 'M9 3h6v3H9zM7 6H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-3M7 11h10v6H7z' },
  { id: 'ferramentas', label: 'Ferramentas', d: 'M21.21 15.89A10 10 0 118 2.83m4.5 6.88l-6 6M10 13l4-4m5-1l-2-2' },
  { id: 'outros', label: 'Outros', d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const CORES_POR_ICONE: Record<string, string> = {
  motor: '#E74C3C', freios: '#D35400', eletrica: '#F39C12', suspensao: '#27AE60',
  cabos: '#D35400', filtros: '#1A5276', transmissao: '#2980B9', escapamento: '#7F8C8D',
  oleos: '#16A085', acessorios: '#2E86C1', pneus: '#1A5276', carenagem: '#8E44AD',
  farol: '#F39C12', bateria: '#27AE60', ferramentas: '#E67E22', outros: '#7F8C8D',
};

const COR_FALLBACK = '#1A5276';

function formatMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface CategoriaDisplay extends Categoria {
  _displayChildren?: boolean;
  _depth?: number;
}

export default function CategoriasPage() {
  const [cats, setCats] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', descricaoIa: '', icone: '', ordem: 0, ativa: true, mostrarNaVitrine: true, permiteCadastro: true, parentId: '' });
  const [msg, setMsg] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'ativas' | 'inativas'>('todas');
  const [dragId, setDragId] = useState<string | null>(null);

  async function fetchCats() {
    const r = await fetch('/api/categorias');
    setCats(await r.json());
    setLoading(false);
  }
  useEffect(() => { fetchCats(); }, []);

  const flattenCats = useCallback((list: Categoria[], depth = 0): CategoriaDisplay[] => {
    const result: CategoriaDisplay[] = [];
    for (const c of list) {
      result.push({ ...c, _depth: depth, _displayChildren: true });
      if (c.subcategorias && c.subcategorias.length > 0) {
        result.push(...flattenCats(c.subcategorias, depth + 1));
      }
    }
    return result;
  }, []);

  function abrirNovo(parentId?: string) {
    setEditando(null);
    setForm({ nome: '', descricao: '', descricaoIa: '', icone: '', ordem: 0, ativa: true, mostrarNaVitrine: true, permiteCadastro: true, parentId: parentId || '' });
    setMsg(''); setModal(true);
  }

  function abrirEditar(c: Categoria) {
    setEditando(c);
    setForm({ nome: c.nome, descricao: c.descricao || '', descricaoIa: c.descricaoIa || '', icone: c.icone || '', ordem: c.ordem, ativa: c.ativa, mostrarNaVitrine: c.mostrarNaVitrine ?? true, permiteCadastro: c.permiteCadastro ?? true, parentId: c.parentId || '' });
    setMsg(''); setModal(true);
  }

  async function salvar() {
    if (!form.nome.trim()) { setMsg('Preencha o nome da categoria.'); return; }
    const url = editando ? `/api/categorias/${editando.id}` : '/api/categorias';
    const method = editando ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (r.ok) { setModal(false); fetchCats(); }
    else { const e = await r.json(); setMsg(e.error || 'Erro.'); }
  }

  async function duplicar(c: Categoria) {
    if (!confirm(`Duplicar categoria "${c.nome}"?`)) return;
    const r = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: `${c.nome} (copia)`,
        descricao: c.descricao,
        descricaoIa: c.descricaoIa,
        icone: c.icone,
        ordem: c.ordem + 1,
        ativa: c.ativa,
        mostrarNaVitrine: c.mostrarNaVitrine,
        permiteCadastro: c.permiteCadastro,
        parentId: c.parentId || '',
      }),
    });
    if (r.ok) { fetchCats(); }
    else { const e = await r.json(); alert(e.error || 'Erro ao duplicar.'); }
  }

  async function excluir(c: Categoria) {
    if (!confirm(`Excluir categoria "${c.nome}"?`)) return;
    const r = await fetch(`/api/categorias/${c.id}`, { method: 'DELETE' });
    if (r.ok) { fetchCats(); }
    else { const e = await r.json(); alert(e.error || 'Erro ao excluir.'); }
  }

  // Drag & Drop
  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    (e.target as HTMLElement).style.opacity = '0.4';
  }

  function handleDragEnd(e: React.DragEvent) {
    setDragId(null);
    (e.target as HTMLElement).style.opacity = '1';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    const flat = flattenCats(cats);
    const draggedIdx = flat.findIndex(c => c.id === dragId);
    const targetIdx = flat.findIndex(c => c.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const reordered = [...flat];
    const [removed] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, removed);

    const topLevel = reordered.filter(c => !c.parentId);
    topLevel.forEach((c, i) => {
      fetch(`/api/categorias/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: c.nome, ordem: i, ativa: c.ativa, icone: c.icone,
          descricao: c.descricao, descricaoIa: c.descricaoIa,
          mostrarNaVitrine: c.mostrarNaVitrine,
          permiteCadastro: c.permiteCadastro, parentId: c.parentId,
        }),
      }).then(() => fetchCats());
    });
  }

  let flatDisplay = flattenCats(cats);
  if (busca) {
    const q = busca.toLowerCase();
    flatDisplay = flatDisplay.filter(c => c.nome.toLowerCase().includes(q) || (c.descricao || '').toLowerCase().includes(q));
  }
  if (filtroStatus === 'ativas') flatDisplay = flatDisplay.filter(c => c.ativa);
  if (filtroStatus === 'inativas') flatDisplay = flatDisplay.filter(c => !c.ativa);

  const ativasCount = flatDisplay.filter(c => c.ativa).length;
  const inativasCount = flatDisplay.filter(c => !c.ativa).length;

  const iconeEncontrado = ICONES.find(i => i.id === form.icone);
  const corPreview = CORES_POR_ICONE[form.icone] || COR_FALLBACK;

  // categorias disponiveis para ser parent (apenas top-level, nao a si mesma)
  const parentOptions = cats
    .filter(c => !c.parentId)
    .filter(c => !editando || c.id !== editando.id);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">CATEGORIAS</h1>
          <p className="text-sm text-slate-500 mt-0.5">{cats.length} categorias &middot; {ativasCount} ativas &middot; {inativasCount} inativas</p>
        </div>
        <button onClick={() => abrirNovo()} className="btn-primary inline-flex items-center gap-2 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Nova categoria
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar por nome ou descricao..." className="input-field max-w-md" />
        <div className="flex flex-wrap gap-1">
          {(['todas', 'ativas', 'inativas'] as const).map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filtroStatus === s ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s === 'todas' ? 'Todas' : s === 'ativas' ? 'Ativas' : 'Inativas'}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda Drag & Drop */}
      <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16"/></svg>
        Arraste as categorias para reordenar
      </p>

      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : flatDisplay.length === 0 ? (
        <div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhuma categoria encontrada.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase w-8">#</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase">Categoria</th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase w-14">Pecas</th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase w-20">Estoque</th>
                  <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase w-28">Valor Estoque</th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase w-14">Vitrine</th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase w-16">Cadastro</th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase w-16">Status</th>
                  <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase w-36">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {flatDisplay.map((c) => {
                  const icone = ICONES.find(i => i.id === c.icone);
                  const cor = c.icone ? (CORES_POR_ICONE[c.icone] || COR_FALLBACK) : COR_FALLBACK;
                  const depth = c._depth || 0;
                  const estoque = c._estoque || { totalPecas: c._count?.pecas ?? 0, totalEstoque: 0, totalValorEstoque: 0 };
                  return (
                    <tr key={c.id}
                      draggable={!c.parentId}
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, c.id)}
                      className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${!c.ativa ? 'opacity-50' : ''} ${dragId === c.id ? 'bg-brand-50' : ''} ${!c.parentId ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {!c.parentId && (
                            <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8zM14 6h2v2h-2zM8 11h2v2H8zM11 11h2v2h-2zM14 11h2v2h-2zM8 16h2v2H8zM11 16h2v2h-2zM14 16h2v2h-2z"/></svg>
                          )}
                          <span className="text-[11px] text-slate-400 w-5 text-right">{c.ordem}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5" style={{ paddingLeft: `${depth * 20}px` }}>
                          {depth > 0 && (
                            <svg className="w-3 h-3 text-slate-300 flex-shrink-0 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                          )}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor + '18' }}>
                            {icone ? (
                              <svg className="w-4 h-4" style={{ color: cor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icone.d}/>
                              </svg>
                            ) : (
                              <span className="text-[11px] font-bold" style={{ color: cor }}>{c.nome.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">{c.nome}</span>
                            {c.descricao && <p className="text-[11px] text-slate-400 leading-tight">{c.descricao}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{estoque.totalPecas}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-semibold ${estoque.totalEstoque === 0 ? 'text-red-500' : 'text-slate-700'}`}>{estoque.totalEstoque}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-xs font-medium text-slate-600">{formatMoeda(estoque.totalValorEstoque)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${c.mostrarNaVitrine ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {c.mostrarNaVitrine ? 'Sim' : 'Nao'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${c.permiteCadastro ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {c.permiteCadastro ? 'Sim' : 'Bloq.'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.ativa ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.ativa ? 'bg-emerald-500' : 'bg-slate-300'}`}/>
                          {c.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {!c.parentId && (
                            <button onClick={() => abrirNovo(c.id)}
                              className="text-xs text-slate-400 hover:text-brand-600 font-medium px-1.5 py-1 rounded hover:bg-brand-50"
                              title="Adicionar subcategoria">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                            </button>
                          )}
                          <button onClick={() => duplicar(c)}
                            className="text-xs text-slate-400 hover:text-indigo-600 font-medium px-1.5 py-1 rounded hover:bg-indigo-50"
                            title="Duplicar categoria">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                          </button>
                          <button onClick={() => abrirEditar(c)} className="text-xs text-brand-600 hover:text-brand-700 font-medium px-1.5 py-1 rounded hover:bg-brand-50">Editar</button>
                          <button onClick={() => excluir(c)}
                            className={`text-xs font-medium px-1.5 py-1 rounded ${(c._count?.pecas ?? 0) > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                            disabled={(c._count?.pecas ?? 0) > 0}
                            title={(c._count?.pecas ?? 0) > 0 ? 'Possui pecas vinculadas' : 'Excluir categoria'}>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-800 mb-4">{editando ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}

            <div className="space-y-4">
              {/* Parent (subcategoria) */}
              {!editando && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoria pai (opcional)</label>
                  <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className="input-field mt-1.5">
                    <option value="">Nenhuma (categoria principal)</option>
                    {parentOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">Apenas 1 nivel de subcategoria e permitido.</p>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome *</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="input-field mt-1.5" placeholder="Ex: Motor" autoFocus />
              </div>

              {/* Slug (readonly) */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Slug <span className="text-slate-400">(gerado automaticamente)</span></label>
                <input value={form.nome ? form.nome.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '') : ''} className="input-field mt-1.5 bg-slate-50 text-slate-400 cursor-not-allowed" readOnly disabled />
              </div>

              {/* Descricao */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Descricao</label>
                <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} className="input-field mt-1.5" placeholder="Descricao opcional..." />
              </div>

              {/* Descricao IA (interno, nao visivel para usuario final — preparacao futura) */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Descricao IA
                  <span className="text-[10px] text-amber-500 ml-1">(uso interno — assistente IA)</span>
                </label>
                <input value={form.descricaoIa} onChange={e => setForm({ ...form, descricaoIa: e.target.value })} className="input-field mt-1.5" placeholder="Palavras-chave para classificacao automatica..." />
                <p className="text-[10px] text-slate-400 mt-0.5">Campo utilizado pelo Assistente IA para identificacao automatica de categorias.</p>
              </div>

              {/* Icone */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Icone</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1.5">
                  {ICONES.map(ic => (
                    <button key={ic.id} type="button" onClick={() => setForm({ ...form, icone: form.icone === ic.id ? '' : ic.id })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all
                        ${form.icone === ic.id ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ic.d}/>
                      </svg>
                      <span className="text-[10px] leading-tight">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordem */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ordem de exibicao</label>
                <input type="number" value={form.ordem} onChange={e => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })} className="input-field mt-1.5 w-24" min="0" />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</label>
                <div className="flex gap-2 mt-1.5">
                  <button type="button" onClick={() => setForm({ ...form, ativa: true })}
                    className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${form.ativa ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    Ativa
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, ativa: false })}
                    className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${!form.ativa ? 'bg-slate-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    Inativa
                  </button>
                </div>
              </div>

              {/* Vitrine + Cadastro toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Mostrar na Vitrine</label>
                  <div className="flex gap-2 mt-1.5">
                    <button type="button" onClick={() => setForm({ ...form, mostrarNaVitrine: true })}
                      className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${form.mostrarNaVitrine ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      Sim
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, mostrarNaVitrine: false })}
                      className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${!form.mostrarNaVitrine ? 'bg-slate-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      Nao
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Permite Cadastro</label>
                  <div className="flex gap-2 mt-1.5">
                    <button type="button" onClick={() => setForm({ ...form, permiteCadastro: true })}
                      className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${form.permiteCadastro ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      Sim
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, permiteCadastro: false })}
                      className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${!form.permiteCadastro ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      Bloquear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {form.icone && (
              <div className="mt-4 p-3 rounded-xl border border-slate-100 bg-slate-50">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Preview</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: corPreview + '18' }}>
                    {iconeEncontrado && (
                      <svg className="w-4 h-4" style={{ color: corPreview }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconeEncontrado.d}/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">{form.nome || 'Nome da categoria'}</span>
                    {form.descricao && <p className="text-[11px] text-slate-400">{form.descricao}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setModal(false)} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={salvar} className="btn-primary text-xs">{editando ? 'Salvar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
