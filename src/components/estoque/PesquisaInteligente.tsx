'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PecaResult {
  id: string; nome: string; codigo: string; codigoBarras?: string;
  quantidade: number; quantidadeLoja: number; precoVenda: number;
  marca?: string; compatibilidade?: string; localizacao?: string;
  categoria: { nome: string; id: string; slug: string };
}

interface PesquisaInteligenteProps {
  onSelect: (peca: PecaResult) => void;
  placeholder?: string;
  compact?: boolean;
}

export default function PesquisaInteligente({ onSelect, placeholder, compact }: PesquisaInteligenteProps) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<PecaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [selecionadoIdx, setSelecionadoIdx] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pesquisar = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResultados([]);
      setAberto(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/pecas/pesquisa?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResultados(Array.isArray(data) ? data : []);
      setAberto(true);
      setSelecionadoIdx(-1);
    } catch {
      setResultados([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pesquisar(busca), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busca, pesquisar]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(peca: PecaResult) {
    onSelect(peca);
    setBusca('');
    setResultados([]);
    setAberto(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!aberto || resultados.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelecionadoIdx(prev => Math.min(prev + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelecionadoIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selecionadoIdx >= 0) {
      e.preventDefault();
      handleSelect(resultados[selecionadoIdx]);
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div ref={containerRef} className={`relative ${compact ? 'w-full' : 'w-full max-w-lg'}`}>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (resultados.length > 0) setAberto(true); }}
          placeholder={placeholder || 'Pesquisar por nome, SKU, codigo de barras, marca, compatibilidade...'}
          className={`input-field pl-10 text-xs ${compact ? 'py-2' : ''}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {busca && !loading && (
          <button onClick={() => { setBusca(''); setResultados([]); setAberto(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {aberto && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto" style={{ animation: 'scaleIn 0.15s ease-out' }}>
          {resultados.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Nenhum produto encontrado para "{busca}"
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-[10px] text-slate-400 font-medium uppercase border-b border-slate-50">
                {resultados.length} produto{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
              </div>
              {resultados.map((p, i) => {
                const isBaixo = p.quantidade <= 0;
                const isCritico = p.quantidade > 0 && p.quantidade <= 3;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0 ${
                      i === selecionadoIdx ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Indicador de estoque */}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isBaixo ? 'bg-red-500' : isCritico ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{p.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-400">{p.codigo}</span>
                        {p.marca && <span className="text-[10px] text-slate-400">· {p.marca}</span>}
                        <span className="text-[10px] text-slate-400">· {p.categoria.nome}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-right">
                      <span className={`text-[10px] font-bold ${isBaixo ? 'text-red-600' : isCritico ? 'text-amber-600' : 'text-slate-600'}`}>
                        {p.quantidade} un.
                      </span>
                      {p.codigoBarras && (
                        <span className="text-[9px] font-mono text-slate-300 max-w-[80px] truncate hidden sm:inline">{p.codigoBarras}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
