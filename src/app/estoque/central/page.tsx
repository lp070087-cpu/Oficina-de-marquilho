'use client';
// VERSÃO CENTRAL 2026 - INTERFACE MODERNA

import { useState, useEffect, useCallback, useRef } from 'react';
import EstoqueCategorias from '@/components/estoque/EstoqueCategorias';
import { useEstoqueRefresh } from '@/lib/estoque-events';

interface Categoria { id: string; nome: string; slug: string; }
interface Peca {
  id: string; nome: string; codigo: string; codigoBarras?: string;
  precoVenda: number; precoCusto: number; quantidade: number; quantidadeLoja: number;
  estoqueMinimo: number; marca?: string; compatibilidade?: string; localizacao?: string;
  subcategoria?: string; categoria: { nome: string; id: string; slug: string };
}

type SortField = 'nome' | 'codigo' | 'quantidade' | 'quantidadeLoja' | 'precoVenda';
type SortDir = 'asc' | 'desc';
type ToastType = 'success' | 'error' | 'info' | null;

const PER_PAGE_OPTIONS = [15, 30, 50];

export default function EstoqueCentralPage() {
  // Dados
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Modal
  const [modal, setModal] = useState<{ open: boolean; peca?: Peca }>({ open: false });
  const [form, setForm] = useState({
    nome: '', codigo: '', codigoBarras: '', codigoOEM: '',
    precoVenda: '', precoCusto: '', quantidade: '', quantidadeLoja: '',
    estoqueMinimo: '5', marca: '', compatibilidade: '', localizacao: '',
    subcategoria: '', categoriaId: '', descricao: '', fornecedor: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Export modal
  const [exportModal, setExportModal] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: '' });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<Peca | null>(null);

  // Debounce
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedBusca, setDebouncedBusca] = useState('');

  const { refreshKey, triggerRefresh } = useEstoqueRefresh();

  // Debounce busca
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedBusca(busca), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busca]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast.type) {
      const timer = setTimeout(() => setToast({ type: null, message: '' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Busca categorias
  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(data => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Busca peças
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let catId = '';
      if (catSlug) {
        const found = categorias.find(c => c.slug === catSlug);
        if (found) catId = found.id;
      }
      const p = new URLSearchParams();
      if (debouncedBusca) p.set('q', debouncedBusca);
      if (catId) p.set('categoria', catId);
      const res = await fetch(`/api/pecas?$${p}`);
      const data = await res.json();
      setPecas(Array.isArray(data) ? data : []);
    } catch { setPecas([]); }
    setLoading(false);
  }, [debouncedBusca, catSlug, categorias, refreshKey]);

  useEffect(() => { if (categorias.length > 0 || catSlug === '') fetchData(); }, [fetchData]);

  // Sorting + filtro cliente (multi-campo pois API só busca nome)
  const filtered = pecas.filter(p => {
    if (!debouncedBusca) return true;
    const q = debouncedBusca.toLowerCase();
    return (
      p.nome.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      (p.codigoBarras || '').toLowerCase().includes(q) ||
      (p.marca || '').toLowerCase().includes(q) ||
      (p.compatibilidade || '').toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'nome') return dir * a.nome.localeCompare(b.nome);
    if (sortField === 'codigo') return dir * a.codigo.localeCompare(b.codigo);
    if (sortField === 'quantidade') return dir * (a.quantidade - b.quantidade);
    if (sortField === 'quantidadeLoja') return dir * ((a.quantidadeLoja || 0) - (b.quantidadeLoja || 0));
    if (sortField === 'precoVenda') return dir * (Number(a.precoVenda) - Number(b.precoVenda));
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  // Stats
  const stats = {
    total: pecas.length,
    unidades: pecas.reduce((s, p) => s + p.quantidade, 0),
    baixo: pecas.filter(p => p.quantidade <= p.estoqueMinimo && p.quantidade > 0).length,
    zerado: pecas.filter(p => p.quantidade <= 0).length,
    naLoja: pecas.reduce((s, p) => s + (p.quantidadeLoja || 0), 0),
  };

  // Handlers
  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  }

  function abrirForm(peca?: Peca) {
    setFormErrors({});
    if (peca) {
      setForm({
        nome: peca.nome, codigo: peca.codigo, codigoBarras: peca.codigoBarras || '',
        codigoOEM: '', precoVenda: String(peca.precoVenda),
        precoCusto: String(peca.precoCusto), quantidade: String(peca.quantidade),
        quantidadeLoja: String(peca.quantidadeLoja || 0),
        estoqueMinimo: String(peca.estoqueMinimo), marca: peca.marca || '',
        compatibilidade: peca.compatibilidade || '', localizacao: peca.localizacao || '',
        subcategoria: peca.subcategoria || '', categoriaId: peca.categoria.id,
        descricao: '', fornecedor: '',
      });
    } else {
      setForm({
        nome: '', codigo: '', codigoBarras: '', codigoOEM: '',
        precoVenda: '', precoCusto: '', quantidade: '', quantidadeLoja: '',
        estoqueMinimo: '5', marca: '', compatibilidade: '', localizacao: '',
        subcategoria: '', categoriaId: categorias[0]?.id || '',
        descricao: '', fornecedor: '',
      });
    }
    setModal({ open: true, peca });
  }

  async function salvar() {
    const errors: Record<string, string> = {};
    if (!form.nome.trim()) errors.nome = 'Obrigatorio';
    if (!form.codigo.trim()) errors.codigo = 'Obrigatorio';
    if (!form.categoriaId) errors.categoriaId = 'Obrigatorio';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    if (form.codigoBarras && !modal.peca) {
      try {
        const check = await fetch(`/api/pecas?barcode=$${encodeURIComponent(form.codigoBarras)}`);
        const exist = await check.json();
        if (Array.isArray(exist) && exist.length > 0) {
          setToast({ type: 'error', message: 'Ja existe um produto com esse codigo de barras.' });
          return;
        }
      } catch { /* segue */ }
    }

    const body = {
      ...form,
      precoVenda: Number(form.precoVenda) || 0,
      precoCusto: Number(form.precoCusto) || 0,
      quantidade: Number(form.quantidade) || 0,
      quantidadeLoja: Number(form.quantidadeLoja) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 5,
    };

    const url = modal.peca ? `/api/pecas/$${modal.peca.id}` : '/api/pecas';
    const method = modal.peca ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setModal({ open: false });
        fetchData();
        triggerRefresh();
        setToast({ type: 'success', message: modal.peca ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.' });
      } else {
        const e = await res.json();
        setToast({ type: 'error', message: e.error || 'Erro ao salvar.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Erro de conexao ao salvar.' });
    }
  }

  async function remover(peca: Peca) {
    await fetch(`/api/pecas/$${peca.id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchData();
    triggerRefresh();
    setToast({ type: 'success', message: `"$${peca.nome}" removido.` });
  }

  function exportar(tipo: 'todos' | 'baixo') {
    const data = tipo === 'baixo' ? pecas.filter(p => p.quantidade <= p.estoqueMinimo) : pecas;
    const titulo = tipo === 'baixo' ? 'Produtos com Estoque Baixo' : 'Lista de Compras';
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    const rows = data.map(p => `
      <tr>
        <td>$${p.categoria?.nome || ''}</td>
        <td>$${p.codigo}</td>
        <td>$${p.codigoBarras || ''}</td>
        <td>$${p.nome}</td>
        <td>$${p.marca || ''}</td>
        <td style="text-align:center">$${p.quantidade}</td>
        <td style="text-align:center">$${p.estoqueMinimo}</td>
        <td></td><td></td><td></td><td></td>
        <td>$${p.localizacao || ''}</td>
      </tr>`).join('');
    w.document.write('<!DOCTYPE html><html><head><title>' + titulo + ' - Marquinho</title>' +
      '<style>body{font-family:Arial;padding:20px;font-size:11px}h1{text-align:center;font-size:16px;margin-bottom:5px}' +
      'table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 6px}th{background:#2563eb;color:#fff;font-size:10px}' +
      '@media print{body{padding:5mm}button{display:none}}</style></head><body>' +
      '<h1>Marquinho Moto Pecas - ' + titulo + '</h1><p style="text-align:center">' + new Date().toLocaleDateString('pt-BR') + '</p>' +
      '<table><thead><tr><th>Categoria</th><th>Cod.Int.</th><th>Cod.Barras</th><th>Nome</th><th>Marca</th><th>Qtd</th><th>Min</th>' +
      '<th>Forn.A</th><th>Forn.B</th><th>Forn.C</th><th>Forn.D</th><th>Obs</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<button onclick="window.print()" style="margin-top:15px;padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">Imprimir</button></body></html>');
    w.document.close();
    setExportModal(false);
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  function sortIcon(field: SortField) {
    const asc = sortField === field && sortDir === 'asc';
    const desc = sortField === field && sortDir === 'desc';
    return (
      <span className="ml-1 inline-flex flex-col leading-none">
        <svg className={`w-2.5 h-2.5 $${asc ? 'text-brand-600' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 10 6"><path d="M5 0L0 6h10z"/></svg>
        <svg className={`w-2.5 h-2.5 $${desc ? 'text-brand-600' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 10 6"><path d="M5 6L0 0h10z"/></svg>
      </span>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* TOAST */}
      {toast.type && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
            {toast.type === 'error' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>}
            {toast.message}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">ESTOQUE CENTRAL</h1>
          <p className="text-xs text-slate-400 mt-0.5">Gestao completa de produtos e inventario</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Exportar
          </button>
          <button
            onClick={() => abrirForm()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Novo produto
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Produtos', value: stats.total, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'text-brand-600 bg-brand-50' },
          { label: 'Unidades', value: stats.unidades, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'text-blue-600 bg-blue-50' },
          { label: 'Estoque baixo', value: stats.baixo, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: stats.baixo > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50', urgent: stats.baixo > 0 },
          { label: 'Sem estoque', value: stats.zerado, icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', color: stats.zerado > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50', urgent: stats.zerado > 0 },
          { label: 'Na loja', value: stats.naLoja, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'text-violet-600 bg-violet-50' },
        ].map((s, i) => (
          <div key={i} className={`card-stat flex items-center gap-3 p-4 $${s.urgent ? 'ring-1 ring-amber-200' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 $${s.color}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon}/></svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-bold text-slate-800">{s.value.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BUSCA + FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            value={busca}
            onChange={e => { setBusca(e.target.value); setPage(1); }}
            placeholder="Buscar por nome, SKU, codigo de barras, marca..."
            className="input-field pl-10 text-xs"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 font-medium"
          >
            {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n} por pagina</option>)}
          </select>
        </div>
      </div>

      <EstoqueCategorias active={catSlug} onChange={s => { setCatSlug(s); setPage(1); }} />

      {/* TABELA */}
      {loading ? (
        <div className="card-table">
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-3 bg-slate-100 rounded w-16" />
                <div className="h-3 bg-slate-100 rounded flex-1" />
                <div className="h-3 bg-slate-100 rounded w-20" />
                <div className="h-3 bg-slate-100 rounded w-12" />
                <div className="h-3 bg-slate-100 rounded w-12" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="card-table">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Nenhum produto encontrado</p>
            <p className="text-xs text-slate-400 mb-4">Tente ajustar os filtros ou cadastrar um novo produto.</p>
            <button onClick={() => abrirForm()} className="btn-primary text-xs">Cadastrar produto</button>
          </div>
        </div>
      ) : (
        <>
          <div className="card-table overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 sticky top-0">
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('codigo')}>
                      <span className="inline-flex items-center">SKU{sortIcon('codigo')}</span>
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('nome')}>
                      <span className="inline-flex items-center">Produto{sortIcon('nome')}</span>
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Marca</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Categoria</th>
                    <th className="text-center py-3 px-3 font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('quantidade')}>
                      <span className="inline-flex items-center">Central{sortIcon('quantidade')}</span>
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('quantidadeLoja')}>
                      <span className="inline-flex items-center">Loja{sortIcon('quantidadeLoja')}</span>
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('precoVenda')}>
                      <span className="inline-flex items-center">Preco{sortIcon('precoVenda')}</span>
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-slate-500 uppercase tracking-wider">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p, i) => {
                    const isBaixo = p.quantidade <= p.estoqueMinimo;
                    const isZerado = p.quantidade <= 0;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors duration-150 $${
                          i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                        } $${isZerado ? 'bg-red-50/20' : isBaixo ? 'bg-amber-50/20' : ''}`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.codigo}</td>
                        <td className="py-2.5 px-3">
                          <div>
                            <p className="font-medium text-slate-800 text-xs">{p.nome}</p>
                            {p.subcategoria && <p className="text-[10px] text-slate-400 mt-0.5">{p.subcategoria}</p>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-xs hidden md:table-cell">{p.marca || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-xs hidden lg:table-cell">{p.categoria?.nome || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-md text-xs font-bold $${
                            isZerado ? 'bg-red-100 text-red-700' : isBaixo ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.quantidade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-brand-600 text-xs">{p.quantidadeLoja || 0}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700 text-xs">{fm(Number(p.precoVenda))}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => abrirForm(p)}
                              className="px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(p)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              Remover
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

          {/* Paginacao */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[11px] text-slate-400">
                Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, sorted.length)} de {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors $${
                        page === pageNum
                          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: EXPORTAR */}
      {exportModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setExportModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()} style={{animation: 'scaleIn 0.2s ease-out'}}>
            <h2 className="text-base font-bold text-slate-800 mb-1">Exportar Lista de Compras</h2>
            <p className="text-xs text-slate-500 mb-5">Qual lista deseja gerar?</p>
            <div className="space-y-3">
              <button
                onClick={() => exportar('baixo')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 group"
              >
                <strong className="text-sm text-slate-800 group-hover:text-amber-700">Apenas estoque baixo</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">{pecas.filter(p => p.quantidade <= p.estoqueMinimo).length} produtos abaixo do estoque minimo</p>
              </button>
              <button
                onClick={() => exportar('todos')}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all duration-200 group"
              >
                <strong className="text-sm text-slate-800 group-hover:text-brand-700">Todos os produtos</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">{pecas.length} produtos no total</p>
              </button>
            </div>
            <button onClick={() => setExportModal(false)} className="btn-secondary w-full mt-4 text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR REMOCAO */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()} style={{animation: 'scaleIn 0.2s ease-out'}}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <h2 className="text-base font-bold text-slate-800 text-center mb-1">Remover produto?</h2>
            <p className="text-sm text-slate-500 text-center mb-2">
              <strong className="text-slate-700">{deleteConfirm.nome}</strong>
              <br />SKU: {deleteConfirm.codigo}
            </p>
            <p className="text-xs text-slate-400 text-center mb-5">Esta acao pode ser revertida por um administrador.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 text-xs">Cancelar</button>
              <button onClick={() => remover(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors">Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO/EDICAO */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl p-6 my-4" onClick={e => e.stopPropagation()} style={{animation: 'scaleIn 0.2s ease-out'}}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center $${modal.peca ? 'bg-brand-50' : 'bg-emerald-50'}`}>
                {modal.peca ? (
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{modal.peca ? 'Editar Produto' : 'Novo Produto'}</h2>
                <p className="text-xs text-slate-400">{modal.peca ? `SKU: $${modal.peca.codigo}` : 'Preencha os dados do produto'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 uppercase">Nome *</label>
                <input
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  className={`input-field mt-1.5 text-xs $${formErrors.nome ? 'border-red-300 bg-red-50' : ''}`}
                  placeholder="Nome do produto"
                  autoFocus
                />
                {formErrors.nome && <p className="text-[10px] text-red-500 mt-1">{formErrors.nome}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">SKU *</label>
                <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} className={`input-field mt-1.5 text-xs $${formErrors.codigo ? 'border-red-300 bg-red-50' : ''}`} placeholder="Codigo interno"/>
                {formErrors.codigo && <p className="text-[10px] text-red-500 mt-1">{formErrors.codigo}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Cod. Barras</label>
                <input value={form.codigoBarras} onChange={e => setForm({ ...form, codigoBarras: e.target.value })} className="input-field mt-1.5 text-xs" placeholder="Leitura do scanner"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Categoria *</label>
                <select value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })} className={`input-field mt-1.5 text-xs $${formErrors.categoriaId ? 'border-red-300 bg-red-50' : ''}`}>
                  <option value="">Selecionar</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {formErrors.categoriaId && <p className="text-[10px] text-red-500 mt-1">{formErrors.categoriaId}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Subcategoria</label>
                <input value={form.subcategoria} onChange={e => setForm({ ...form, subcategoria: e.target.value })} className="input-field mt-1.5 text-xs" placeholder="Ex: Pastilhas"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Marca</label>
                <input value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} className="input-field mt-1.5 text-xs" placeholder="Ex: NGK, ProTork"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Fornecedor</label>
                <input value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} className="input-field mt-1.5 text-xs" placeholder="Nome do fornecedor"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Compatibilidade</label>
                <input value={form.compatibilidade} onChange={e => setForm({ ...form, compatibilidade: e.target.value })} className="input-field mt-1.5 text-xs" placeholder="Ex: CG 160 2018-2022"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Localizacao</label>
                <input value={form.localizacao} onChange={e => setForm({ ...form, localizacao: e.target.value })} className="input-field mt-1.5 text-xs" placeholder="Ex: A-03-B-02"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Preco custo</label>
                <input type="number" step="0.01" value={form.precoCusto} onChange={e => setForm({ ...form, precoCusto: e.target.value })} className="input-field mt-1.5 text-xs" placeholder="0,00"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Preco venda</label>
                <input type="number" step="0.01" value={form.precoVenda} onChange={e => setForm({ ...form, precoVenda: e.target.value })} className="input-field mt-1.5 text-xs" placeholder="0,00"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Qtd Central</label>
                <input type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} className="input-field mt-1.5 text-xs text-center font-bold" min="0"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Qtd Loja</label>
                <input type="number" value={form.quantidadeLoja} onChange={e => setForm({ ...form, quantidadeLoja: e.target.value })} className="input-field mt-1.5 text-xs text-center font-bold" min="0"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Estoque minimo</label>
                <input type="number" value={form.estoqueMinimo} onChange={e => setForm({ ...form, estoqueMinimo: e.target.value })} className="input-field mt-1.5 text-xs text-center font-bold" min="1"/>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 uppercase">Descricao / Observacoes</label>
                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} className="input-field mt-1.5 text-xs" rows={2} placeholder="Informacoes adicionais..."/>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setModal({ open: false })} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={salvar} className="btn-primary text-xs px-6">{modal.peca ? 'Atualizar' : 'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
