'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CardProdutoPremium from '@/components/vitrine/CardProdutoPremium';
import ListaProdutoPremium from '@/components/vitrine/ListaProdutoPremium';
import FiltrosBarra from '@/components/vitrine/FiltrosBarra';
import ComparadorVitrine from '@/components/vitrine/ComparadorVitrine';
import LogoOficina from '@/components/LogoOficina';
import { getClienteVitrine } from '@/lib/vitrine-session';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CatalogoContent() {
  const searchParams = useSearchParams();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<{ slug: string; nome: string; subcategorias?: { slug: string; nome: string; totalProdutos?: number }[] }[]>([]);
  const [filtros, setFiltros] = useState({
    marca: searchParams.get('marca') || '',
    categoria: searchParams.get('categoria') || '',
    precoMin: '', precoMax: '', promocao: false,
    compatibilidade: '', subcategoria: '',
  });
  const [ordem, setOrdem] = useState('relevancia');
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [comparar, setComparar] = useState<any[]>([]);
  const [showComparador, setShowComparador] = useState(false);
  const [cliente, setCliente] = useState<any>(null);
  // AJUSTE 1 — pastas de subcategorias na vitrine pública. Quando a categoria tem
  // subcategorias, mostra pastas 📁 antes de abrir os produtos direto.
  const [verTodosPasta, setVerTodosPasta] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const q = searchParams.get('q');
      if (q) params.set('q', q);
      // Subcategoria selecionada → parâmetro próprio `subcategoria` (a API distingue
      // categoria real de tipo de acessório via prefixo `tipo:`). Se não, usa a categoria.
      if (filtros.subcategoria) params.set('subcategoria', filtros.subcategoria);
      else if (filtros.categoria) params.set('categoria', filtros.categoria);
      if (filtros.marca) params.set('marca', filtros.marca);
      if (filtros.compatibilidade) params.set('compatibilidade', filtros.compatibilidade);
      // Filtros de preço/promoção (antes eram estado morto — nunca enviados à API)
      if (filtros.precoMin) params.set('precoMin', filtros.precoMin);
      if (filtros.precoMax) params.set('precoMax', filtros.precoMax);
      if (filtros.promocao) params.set('promocao', '1');
      params.set('ordem', ordem);
      params.set('page', String(pagina));

      const r = await fetch(`/api/vitrine/busca?${params}`);
      if (r.ok) {
        const d = await r.json();
        setProdutos(d.produtos);
        setTotal(d.total);
        setMarcas(d.marcas || []);
      }
    } catch {}
    setLoading(false);
  }, [searchParams, filtros, ordem, pagina]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // AJUSTE 1 — trocou de categoria (ou escolheu subcategoria) → volta às pastas / sai delas corretamente.
  const catSlugAtual = filtros.categoria;
  useEffect(() => { setVerTodosPasta(false); }, [catSlugAtual]);

  useEffect(() => {
    const d = getClienteVitrine();
    if (d) setCliente(d);
  }, []);

  useEffect(() => {
    // Item 1: categorias do filtro 100% data-driven (só categorias com produtos visíveis).
    fetch('/api/vitrine/categorias').then(r => r.json()).then((d: any[]) => {
      if (Array.isArray(d)) setCategorias(d.map((c: any) => ({ slug: c.slug, nome: c.nome, subcategorias: (c.subcategorias || []).map((s: any) => ({ slug: s.slug, nome: s.nome, totalProdutos: s.totalProdutos })) })));
    });
  }, []);

  // AJUSTE 1 — pasta de subcategorias da categoria ativa (data-driven da API pública).
  // NUNCA usa Categoria.parentId para isso — usa as subcategorias reais derivadas de
  // Peca.subcategoria que a API /api/vitrine/categorias já devolve com totalProdutos.
  const catAtivaPasta = categorias.find(c => c.slug === filtros.categoria);
  const pastasDaCategoria = (catAtivaPasta?.subcategorias || []).filter(s => (s.totalProdutos ?? 0) > 0);
  // Nesta visão de pastas, ainda não há subcategoria escolhida.
  const mostrandoPastas = !filtros.subcategoria && pastasDaCategoria.length > 0 && !verTodosPasta;

  function toggleComparar(id: string) {
    setComparar(prev => {
      if (prev.find(p => p.id === id)) return prev.filter(p => p.id !== id);
      if (prev.length >= 4) return prev;
      const prod = produtos.find(p => p.id === id);
      return prod ? [...prev, prod] : prev;
    });
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#0D1117] text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/vitrine" className="flex items-center gap-2.5">
            <LogoOficina className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center overflow-hidden" textClassName="font-extrabold text-white text-xs" />
            <span className="font-extrabold text-sm">Catálogo</span>
          </a>
          <div className="flex items-center gap-3 text-xs">
            {comparar.length > 0 && (
              <button onClick={() => setShowComparador(true)} className="px-3 py-1.5 bg-brand-600 rounded-lg font-bold">
                Comparar ({comparar.length})
              </button>
            )}
            {cliente ? (
              <a href="/vitrine/perfil" className="text-slate-400 hover:text-white">Olá, {cliente.nome?.split(' ')[0]}</a>
            ) : (
              <a href="/vitrine/login" className="text-slate-400 hover:text-white">Entrar</a>
            )}
            <a href="/vitrine/carrinho" className="px-4 py-2 bg-brand-600 rounded-lg font-bold">Carrinho</a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">{searchParams.get('q') ? `Busca: "${searchParams.get('q')}"` : searchParams.get('marca') ? `Marca: ${searchParams.get('marca')}` : 'Catálogo de Produtos'}</h1>
        <p className="text-sm text-slate-500 mb-6">{total} produtos encontrados</p>

        {/* Filtros e Ordenação */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <FiltrosBarra categorias={categorias} marcas={marcas} filtros={filtros} onChange={setFiltros} mode={mode} onModeChange={setMode} />
          <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Ordenar:</span>
              <select value={ordem} onChange={e => setOrdem(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-400">
                <option value="relevancia">Relevância</option>
                <option value="menor_preco">Menor Preço</option>
                <option value="maior_preco">Maior Preço</option>
                <option value="mais_recentes">Mais Recentes</option>
                <option value="maior_desconto">Maior Desconto</option>
                <option value="mais_vendidos">Mais Vendidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comparador */}
        {showComparador && comparar.length > 0 && (
          <ComparadorVitrine produtos={comparar} onClose={() => setShowComparador(false)} />
        )}

        {/* AJUSTE 1 — PASTAS DE SUBCATEGORIAS (vitrine pública).
            Categoria com subcategorias → NÃO abre produtos direto: mostra pastas 📁.
            Só pastas com produto visível (totalProdutos > 0). "Ver todos" abre a grade. */}
        {!loading && mostrandoPastas && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm font-bold text-slate-800">Escolha uma categoria de {catAtivaPasta?.nome || ''}:</p>
              <button onClick={() => setVerTodosPasta(true)}
                className="text-xs text-brand-600 hover:text-brand-700 font-bold underline underline-offset-2">Ver todos os produtos</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {pastasDaCategoria.map(s => (
                <button key={s.slug} onClick={() => { setFiltros({ ...filtros, subcategoria: s.slug, categoria: filtros.categoria }); setPagina(1); }}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 min-h-[140px] shadow-sm hover:shadow-md hover:border-brand-300 hover:bg-brand-50/40 transition-all duration-200">
                  <span className="text-4xl">📁</span>
                  <span className="font-bold text-sm text-slate-800 group-hover:text-brand-700 text-center leading-tight">{s.nome}</span>
                  <span className="text-[11px] text-slate-400 font-medium">{s.totalProdutos ?? 0} produto{(s.totalProdutos ?? 0) !== 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AJUSTE 1 — "← Voltar para as pastas" quando está dentro de uma pasta */}
        {!loading && filtros.subcategoria && pastasDaCategoria.length > 0 && (
          <button onClick={() => { setFiltros({ ...filtros, subcategoria: '' }); setVerTodosPasta(false); setPagina(1); }}
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-bold mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            ← Voltar para as pastas de {catAtivaPasta?.nome || 'Acessórios'}
          </button>
        )}

        {/* Resultados */}
        {loading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>
        ) : produtos.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <p className="text-sm text-slate-400 mb-4">Nenhum produto encontrado</p>
            <button onClick={() => { window.location.href = '/vitrine/catalogo'; }} className="text-brand-600 text-sm font-bold">Limpar filtros</button>
          </div>
        ) : mostrandoPastas ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">Escolha uma pasta acima para ver os produtos de {catAtivaPasta?.nome || 'esta categoria'}.</p>
          </div>
        ) : (
          <>
            {mode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {produtos.map(p => <CardProdutoPremium key={p.id} p={p} onComparar={toggleComparar} comparado={comparar.some(c => c.id === p.id)} />)}
              </div>
            ) : (
              <div className="space-y-2">
                {produtos.map(p => <ListaProdutoPremium key={p.id} p={p} onComparar={toggleComparar} comparado={comparar.some(c => c.id === p.id)} />)}
              </div>
            )}

            {/* Paginação */}
            {total > 24 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 disabled:opacity-30 hover:bg-slate-50">Anterior</button>
                <span className="text-xs text-slate-500">Página {pagina} de {Math.ceil(total / 24)}</span>
                <button disabled={pagina >= Math.ceil(total / 24)} onClick={() => setPagina(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 disabled:opacity-30 hover:bg-slate-50">Próxima</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
