'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'marquinho-busca-historico';
const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface SugestaoProduto { id: string; nome: string; codigo: string; imagemUrl?: string; precoVenda: number; precoOferta?: number; precoVitrine?: number; oferta?: boolean; marca?: string; }

// Preço público oficial (item 6): precoVitrine > precoOferta > precoVenda.
function precoPublico(p: SugestaoProduto): number {
  const pv = p.precoVitrine != null ? Number(p.precoVitrine) : NaN;
  if (Number.isFinite(pv) && pv > 0) return pv;
  if (p.oferta && p.precoOferta && Number(p.precoOferta) < Number(p.precoVenda)) return Number(p.precoOferta);
  return Number(p.precoVenda) || 0;
}
interface SugestaoCategoria { slug: string; nome: string; }
interface SugestaoMarca { nome: string; }

export default function BuscaPremium({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<SugestaoProduto[]>([]);
  const [categorias, setCategoriasSug] = useState<SugestaoCategoria[]>([]);
  const [marcas, setMarcasSug] = useState<SugestaoMarca[]>([]);
  const [historico, setHistorico] = useState<string[]>([]);
  const [populares, setPopulares] = useState<SugestaoProduto[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    const h = localStorage.getItem(STORAGE_KEY);
    if (h) setHistorico(JSON.parse(h).slice(0, 5));
    // Carregar populares ao montar
    fetch('/api/vitrine/mais-vendidos').then(r => r.json()).then(d => setPopulares(d.produtos?.slice(0, 6) || []));
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const buscar = useCallback(async (query: string) => {
    if (query.length < 2) { setProdutos([]); setCategoriasSug([]); setMarcasSug([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/vitrine/busca?q=${encodeURIComponent(query)}`);
      if (r.ok) {
        const data = await r.json();
        setProdutos(data.sugestoes || []);
        setCategoriasSug(data.categoriasSug || []);
        setMarcasSug(data.marcasSug || []);
      }
    } catch { /* */ }
    setLoading(false);
  }, []);

  function onChange(val: string) {
    setQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(val), 250);
  }

  function salvarHistorico(query: string) {
    const h = localStorage.getItem(STORAGE_KEY);
    const arr = h ? JSON.parse(h) : [];
    const updated = [query, ...arr.filter((x: string) => x !== query)].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setHistorico(updated.slice(0, 5));
  }

  function search(query?: string) {
    const term = (query || q).trim();
    if (!term) return;
    salvarHistorico(term);
    setShow(false);
    router.push(`/vitrine/busca?q=${encodeURIComponent(term)}`);
  }

  function irProduto(id: string) { setShow(false); setQ(''); router.push(`/vitrine/produto/${id}`); }
  function irCategoria(slug: string) { setShow(false); setQ(''); router.push(`/vitrine/catalogo?categoria=${slug}`); }
  function irMarca(nome: string) { setShow(false); setQ(''); router.push(`/vitrine/busca?marca=${encodeURIComponent(nome)}`); }

  const temResultados = produtos.length > 0 || categorias.length > 0 || marcas.length > 0;
  const mostrarHistorico = !q.trim() && historico.length > 0;
  const mostrarPopulares = !q.trim() && populares.length > 0;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <input value={q} onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          onFocus={() => setShow(true)}
          placeholder="Buscar peças, marcas..."
          className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-5 pl-12 text-sm text-white placeholder:text-slate-400 outline-none focus:bg-white/15 focus:border-white/20 transition-all" />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      </div>

      {show && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50 max-h-[500px] overflow-y-auto">

          {/* Histórico de buscas */}
          {mostrarHistorico && (
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">🔍 Buscas recentes</p>
              <div className="flex flex-wrap gap-1.5">
                {historico.map((h, i) => (
                  <button key={i} onClick={() => { setQ(h); buscar(h); }}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Populares */}
          {mostrarPopulares && populares.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">🔥 Mais buscados</p>
              <div className="space-y-1">
                {populares.slice(0, 4).map(p => (
                  <button key={p.id} onClick={() => irProduto(p.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-left transition-colors">
                    <span className="text-[11px] text-slate-600 truncate">{p.nome}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{fm(precoPublico(p))}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultados da busca */}
          {q.length >= 2 && temResultados && (
            <>
              {/* Categorias */}
              {categorias.length > 0 && (
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-[10px] text-brand-600 uppercase font-bold mb-1.5">📂 Categorias</p>
                  {categorias.map(c => (
                    <button key={c.slug} onClick={() => irCategoria(c.slug)}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:bg-brand-50 rounded-lg transition-colors">→ {c.nome}</button>
                  ))}
                </div>
              )}
              {/* Marcas */}
              {marcas.length > 0 && (
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-[10px] text-brand-600 uppercase font-bold mb-1.5">🏭 Marcas</p>
                  {marcas.map(m => (
                    <button key={m.nome} onClick={() => irMarca(m.nome)}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:bg-brand-50 rounded-lg transition-colors">→ {m.nome}</button>
                  ))}
                </div>
              )}
              {/* Produtos */}
              {produtos.length > 0 && (
                <div className="px-4 py-2">
                  <p className="text-[10px] text-brand-600 uppercase font-bold mb-1.5">📦 Produtos</p>
                  {produtos.map(s => (
                    <button key={s.id} onClick={() => irProduto(s.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 hover:bg-slate-50 text-left rounded-lg transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {s.imagemUrl ? <img src={s.imagemUrl} alt="" className="w-full h-full object-cover" /> :
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{s.nome}</p>
                        <p className="text-[10px] text-slate-400">{s.marca || ''}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-800 shrink-0">{fm(precoPublico(s))}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Rodapé da busca */}
          {q.length >= 2 && (
            <button onClick={() => search()} className="w-full py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors border-t border-slate-100">
              Ver todos os resultados para "{q.trim()}"
            </button>
          )}

          {q.length >= 2 && !temResultados && !loading && (
            <div className="py-6 text-center text-xs text-slate-400">Nenhum resultado encontrado para "{q.trim()}"</div>
          )}
        </div>
      )}
    </div>
  );
}
