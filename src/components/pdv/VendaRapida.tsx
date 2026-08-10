'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ItemCarrinho } from './CarrinhoPDV';

interface PecaBasica {
  id: string;
  nome: string;
  codigo: string;
  codigoBarras?: string;
  imagemUrl?: string;
  precoVenda: number;
  precoCusto: number;
  quantidadeLoja: number;
  marca?: string;
  categoria?: string;
}

interface VendaRapidaProps {
  onAdicionar: (item: ItemCarrinho) => void;
  carrinhoItens: ItemCarrinho[];
}

export default function VendaRapida({ onAdicionar, carrinhoItens }: VendaRapidaProps) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<PecaBasica[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [resultadoAberto, setResultadoAberto] = useState(false);
  const [scannerMode, setScannerMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const buscar = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) { setResultados([]); setResultadoAberto(false); return; }
    setBuscando(true);
    try {
      const res = await fetch(`/api/pecas/pesquisa?q=${encodeURIComponent(termo)}&loja=true`);
      const data = await res.json();
      setResultados(data.pecas || []);
      setResultadoAberto(true);
    } catch {
      setResultados([]);
    }
    setBuscando(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(v.trim()), 250);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setResultadoAberto(false); setQuery(''); }
    if (e.key === 'Enter' && resultados.length === 1) {
      adicionarPeca(resultados[0]);
    }
  };

  const adicionarPeca = (peca: PecaBasica) => {
    const jaNoCarrinho = carrinhoItens.find(i => i.pecaId === peca.id);
    const item: ItemCarrinho = {
      id: jaNoCarrinho ? `${peca.id}-${Date.now()}` : peca.id,
      pecaId: peca.id,
      nome: peca.nome,
      codigo: peca.codigo,
      imagemUrl: peca.imagemUrl,
      precoOriginal: peca.precoVenda,
      precoUnitario: peca.precoVenda,
      descontoPercent: 0,
      descontoReais: 0,
      quantidade: 1,
      subtotal: peca.precoVenda,
      reservado: false,
    };
    onAdicionar(item);
    setQuery('');
    setResultados([]);
    setResultadoAberto(false);
    setScannerMode(false);
    inputRef.current?.focus();
  };

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResultadoAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={scannerMode ? 'Escaneie o codigo de barras...' : 'Buscar por nome, codigo ou codigo de barras...'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            autoFocus
          />
          {buscando && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          )}
        </div>
        <button
          onClick={() => { setScannerMode(!scannerMode); if (!scannerMode) inputRef.current?.focus(); }}
          className={`p-2.5 rounded-xl transition-all ${scannerMode ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          title="Modo Scanner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2m4 0a9 9 0 11-8 0m8 0a9 9 0 00-8 0m0 0v1m0-8V4m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0v1"/>
          </svg>
        </button>
      </div>

      {/* Resultados da busca */}
      {resultadoAberto && resultados.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-40 max-h-80 overflow-y-auto">
          {resultados.map((peca) => {
            const estoqueBaixo = peca.quantidadeLoja <= 3;
            return (
              <button
                key={peca.id}
                onClick={() => adicionarPeca(peca)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                  {peca.imagemUrl ? (
                    <img src={peca.imagemUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{peca.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-slate-400">{peca.codigo}</span>
                    {peca.marca && <span className="text-[10px] text-slate-400">{peca.marca}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-brand-700">{fm(peca.precoVenda)}</p>
                  <p className={`text-[10px] font-medium ${estoqueBaixo ? 'text-red-500' : 'text-slate-400'}`}>
                    {peca.quantidadeLoja} un.
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {resultadoAberto && query.length >= 2 && resultados.length === 0 && !buscando && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-40 p-6 text-center">
          <p className="text-sm text-slate-500">Nenhum produto encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Tente outro termo de busca</p>
        </div>
      )}

      {/* Atalhos */}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
        <span>Atalhos:</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono">↑↓</kbd>
        <span>navegar</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono">Enter</kbd>
        <span>adicionar</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono">Esc</kbd>
        <span>fechar</span>
      </div>
    </div>
  );
}
