'use client';

import { useState, useCallback, useRef, useEffect, useId } from 'react';
import { ItemCarrinho } from './CarrinhoPDV';

interface PecaBasica {
  id: string;
  nome: string;
  codigo: string;
  codigoBarras?: string;
  imagemUrl?: string;
  precoVenda: number | string; // Decimal do Prisma serializado como texto
  precoCusto: number | string;
  quantidadeLoja: number;
  marca?: string;
  categoria?: string | { nome?: string };
}

interface VendaRapidaProps {
  onAdicionar: (item: ItemCarrinho) => void;
  carrinhoItens: ItemCarrinho[];
  /**
   * CAIXA RÁPIDO — quando true, qualquer tecla digitada na tela (fora de
   * outro campo) abre a busca já com o caractere digitado. O PDV desliga
   * isso enquanto pagamento, comprovante ou scanner estão abertos.
   */
  capturaGlobal?: boolean;
  /** Conteúdo exibido na área de resultados quando não há busca ativa. */
  children?: React.ReactNode;
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 160;
const CACHE_MAX = 40;

function normalizar(s: string | undefined | null) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Ordena para o caixa: código/código de barras exato primeiro, depois prefixos. */
function ordenarParaCaixa(pecas: PecaBasica[], termo: string): PecaBasica[] {
  const t = normalizar(termo.trim());
  const peso = (p: PecaBasica) => {
    const cod = normalizar(p.codigo);
    const bar = normalizar(p.codigoBarras);
    const nome = normalizar(p.nome);
    if (bar && bar === t) return 0;
    if (cod === t) return 1;
    if (cod.startsWith(t) || (bar && bar.startsWith(t))) return 2;
    if (nome.startsWith(t)) return 3;
    if (nome.split(/\s+/).some(w => w.startsWith(t))) return 4;
    return 5;
  };
  // sort estável: dentro do mesmo peso mantém a ordem da API
  return pecas.map((p, i) => ({ p, i, w: peso(p) })).sort((a, b) => a.w - b.w || a.i - b.i).map(x => x.p);
}

/** Correspondência exata (scanner / código digitado) — permite Enter direto. */
function matchExato(pecas: PecaBasica[], termo: string): PecaBasica | undefined {
  const t = normalizar(termo.trim());
  return pecas.find(p => normalizar(p.codigoBarras) === t || normalizar(p.codigo) === t);
}

function Destaque({ texto, termo }: { texto: string; termo: string }) {
  const palavras = normalizar(termo).split(/\s+/).filter(w => w.length >= 2);
  if (palavras.length === 0) return <>{texto}</>;
  const base = normalizar(texto);
  // marca os trechos que casam com qualquer palavra da busca
  const marcas = new Array(texto.length).fill(false);
  for (const w of palavras) {
    let idx = base.indexOf(w);
    while (idx !== -1) { for (let k = idx; k < idx + w.length; k++) marcas[k] = true; idx = base.indexOf(w, idx + w.length); }
  }
  const partes: { t: string; m: boolean }[] = [];
  for (let i = 0; i < texto.length; i++) {
    const ult = partes[partes.length - 1];
    if (ult && ult.m === marcas[i]) ult.t += texto[i]; else partes.push({ t: texto[i], m: marcas[i] });
  }
  return <>{partes.map((p, i) => p.m ? <mark key={i} className="bg-gold-100 text-slate-900 rounded-[2px]">{p.t}</mark> : <span key={i}>{p.t}</span>)}</>;
}

function ehCampoEditavel(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const tipo = (el as HTMLInputElement).type;
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file'].includes(tipo);
  }
  return false;
}

export default function VendaRapida({ onAdicionar, carrinhoItens, capturaGlobal = true, children }: VendaRapidaProps) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<PecaBasica[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [resultadoAberto, setResultadoAberto] = useState(false);
  const [scannerMode, setScannerMode] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [termoResultados, setTermoResultados] = useState('');
  const [erroPreco, setErroPreco] = useState('');
  const [adicionadoFlash, setAdicionadoFlash] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, PecaBasica[]>>(new Map());
  const reqSeqRef = useRef(0);
  // Enter pressionado antes da resposta chegar (ex.: leitor USB) — resolve quando chegar
  const enterPendenteRef = useRef<string | null>(null);
  const listboxId = useId();

  const qtdNoCarrinho = useCallback((pecaId: string) =>
    carrinhoItens.filter(i => i.pecaId === pecaId).reduce((s, i) => s + i.quantidade, 0), [carrinhoItens]);

  const limpar = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    enterPendenteRef.current = null;
    setQuery('');
    setResultados([]);
    setTermoResultados('');
    setResultadoAberto(false);
    setBuscando(false);
    setAtivo(0);
  }, []);

  const adicionarPeca = useCallback((peca: PecaBasica) => {
    // Bloqueia peça SEM PREÇO (R$ 0,00) — não inventar preço, impedir venda acidental
    const preco = Number(peca.precoVenda);
    if (!Number.isFinite(preco) || preco <= 0) {
      setErroPreco(`"${peca.nome}" não tem preço cadastrado (R$ 0,00). Corrija o cadastro antes de vender.`);
      limpar();
      return;
    }
    setErroPreco('');
    const jaNoCarrinho = carrinhoItens.find(i => i.pecaId === peca.id);
    const item: ItemCarrinho = {
      id: jaNoCarrinho ? `${peca.id}-${Date.now()}` : peca.id,
      pecaId: peca.id,
      nome: peca.nome,
      codigo: peca.codigo,
      imagemUrl: peca.imagemUrl,
      // precoVenda chega da API como texto (Decimal do Prisma) — converte como no preload do Estoque
      precoOriginal: preco,
      precoUnitario: preco,
      descontoPercent: 0,
      descontoReais: 0,
      quantidade: 1,
      subtotal: preco,
      reservado: false,
    };
    onAdicionar(item);
    setAdicionadoFlash(peca.nome);
    limpar();
    setScannerMode(false);
    inputRef.current?.focus();
  }, [carrinhoItens, onAdicionar, limpar]);

  const buscar = useCallback(async (termo: string) => {
    if (!termo || termo.length < MIN_CHARS) {
      abortRef.current?.abort();
      setResultados([]); setTermoResultados(''); setResultadoAberto(false); setBuscando(false);
      return;
    }
    const chave = normalizar(termo);
    const aplicar = (lista: PecaBasica[]) => {
      const ordenada = ordenarParaCaixa(lista, termo);
      setResultados(ordenada);
      setTermoResultados(termo);
      setResultadoAberto(true);
      setAtivo(0);
      // Enter já pressionado para este termo → adiciona se for inequívoco
      if (enterPendenteRef.current !== null && normalizar(enterPendenteRef.current) === chave) {
        enterPendenteRef.current = null;
        const exato = matchExato(ordenada, termo);
        if (exato) adicionarPeca(exato);
        else if (ordenada.length === 1) adicionarPeca(ordenada[0]);
      }
    };

    const emCache = cacheRef.current.get(chave);
    if (emCache) { abortRef.current?.abort(); setBuscando(false); aplicar(emCache); return; }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const seq = ++reqSeqRef.current;
    setBuscando(true);
    try {
      const res = await fetch(`/api/pecas/pesquisa?q=${encodeURIComponent(termo)}&loja=true`, { signal: ctrl.signal });
      const data = await res.json();
      if (seq !== reqSeqRef.current) return; // resposta antiga — ignora
      const lista: PecaBasica[] = data.pecas || [];
      const cache = cacheRef.current;
      cache.set(chave, lista);
      if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
      aplicar(lista);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (seq === reqSeqRef.current) { setResultados([]); setTermoResultados(termo); setResultadoAberto(true); }
    } finally {
      if (seq === reqSeqRef.current) setBuscando(false);
    }
  }, [adicionarPeca]);

  const agendarBusca = useCallback((v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(v.trim()), DEBOUNCE_MS);
  }, [buscar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setErroPreco('');
    enterPendenteRef.current = null;
    agendarBusca(v);
  };

  const moverAtivo = (delta: number) => {
    if (resultados.length === 0) return;
    setResultadoAberto(true);
    setAtivo(prev => (prev + delta + resultados.length) % resultados.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); moverAtivo(1); break;
      case 'ArrowUp': e.preventDefault(); moverAtivo(-1); break;
      case 'PageDown': if (resultadoAberto) { e.preventDefault(); moverAtivo(5); } break;
      case 'PageUp': if (resultadoAberto) { e.preventDefault(); moverAtivo(-5); } break;
      case 'Escape':
        e.preventDefault();
        if (resultadoAberto) setResultadoAberto(false);
        else if (query) limpar();
        else inputRef.current?.blur();
        break;
      case 'Enter': {
        e.preventDefault();
        const termo = query.trim();
        if (termo.length < MIN_CHARS) break;
        const resultadosAtuais = normalizar(termoResultados) === normalizar(termo);
        if (resultadosAtuais && !buscando) {
          const exato = matchExato(resultados, termo);
          if (resultadoAberto && resultados[ativo]) adicionarPeca(resultados[ativo]);
          else if (exato) adicionarPeca(exato);
          else if (resultados.length > 0) { setResultadoAberto(true); }
        } else {
          // Ainda buscando (ex.: leitor de código de barras) — busca já e adiciona ao chegar
          enterPendenteRef.current = termo;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          buscar(termo);
        }
        break;
      }
      case 'Tab': setResultadoAberto(false); break;
    }
  };

  // Mantém o item ativo visível ao navegar com as setas
  useEffect(() => {
    if (!resultadoAberto) return;
    const el = listaRef.current?.querySelector<HTMLElement>(`[data-idx="${ativo}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [ativo, resultadoAberto]);

  // CAIXA RÁPIDO — começar a digitar em qualquer ponto da tela abre a busca.
  // Ignora atalhos (Ctrl/Alt/Meta), teclas não imprimíveis, espaço e qualquer
  // digitação dentro de outro campo (cliente, observação, modais).
  useEffect(() => {
    if (!capturaGlobal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1 || e.key === ' ') return;
      const alvo = (e.target as Element) || null;
      if (alvo === inputRef.current) return;
      if (ehCampoEditavel(alvo) || ehCampoEditavel(document.activeElement)) return;
      if (alvo instanceof Element && alvo.closest('[role="dialog"], [aria-modal="true"]')) return;
      const input = inputRef.current;
      if (!input) return;
      e.preventDefault();
      input.focus();
      const novo = input.value + e.key;
      setQuery(novo);
      setErroPreco('');
      enterPendenteRef.current = null;
      agendarBusca(novo);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [capturaGlobal, agendarBusca]);

  // Some com o aviso "adicionado" após alguns segundos
  useEffect(() => {
    if (!adicionadoFlash) return;
    const t = setTimeout(() => setAdicionadoFlash(''), 2200);
    return () => clearTimeout(t);
  }, [adicionadoFlash]);

  useEffect(() => () => { abortRef.current?.abort(); if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const fm = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const listaVisivel = resultadoAberto && resultados.length > 0;
  const semResultado = resultadoAberto && query.trim().length >= MIN_CHARS && resultados.length === 0 && !buscando && normalizar(termoResultados) === normalizar(query.trim());

  const categoriaNome = (c: PecaBasica['categoria']) => (typeof c === 'string' ? c : c?.nome) || '';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Barra de busca */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (resultados.length > 0 && normalizar(termoResultados) === normalizar(query.trim())) setResultadoAberto(true); }}
              placeholder={scannerMode ? 'Escaneie o codigo de barras...' : 'Buscar peça por nome, SKU, código, marca ou código de barras'}
              className="w-full h-12 lg:h-14 pl-12 pr-24 rounded-xl border border-slate-200 bg-white text-[15px] lg:text-base text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-colors shadow-[0_1px_2px_rgba(15,26,46,0.04)]"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded={listaVisivel}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={listaVisivel ? `${listboxId}-${ativo}` : undefined}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {buscando && <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" aria-label="Buscando" />}
              {query && !buscando && (
                <button type="button" onClick={() => { limpar(); inputRef.current?.focus(); }} className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center" aria-label="Limpar busca">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
              {!query && <span className="hidden sm:inline kbd">Digite</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setScannerMode(!scannerMode); if (!scannerMode) inputRef.current?.focus(); }}
            className={`h-12 lg:h-14 min-w-[48px] lg:min-w-[56px] px-3 lg:px-4 inline-flex items-center justify-center gap-2 rounded-xl border text-[13px] font-medium transition-colors flex-shrink-0 ${scannerMode ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
            title="Modo leitor de código de barras"
            aria-pressed={scannerMode}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 7V4.5A1.5 1.5 0 014.5 3H7M17 3h2.5A1.5 1.5 0 0121 4.5V7M21 17v2.5a1.5 1.5 0 01-1.5 1.5H17M7 21H4.5A1.5 1.5 0 013 19.5V17"/>
              <path strokeLinecap="butt" strokeWidth={1.6} d="M7 8v8M9.5 8v8M13 8v8M16.5 8v8"/>
              <path strokeLinecap="butt" strokeWidth={2.6} d="M11 8v8M15 8v8"/>
            </svg>
            <span className="hidden xl:inline">Leitor</span>
          </button>
        </div>

        {erroPreco && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium" role="alert">
            {erroPreco}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2.5 min-h-[20px] text-[11px] text-slate-400" aria-live="polite">
          {adicionadoFlash ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium truncate">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              <span className="truncate">Adicionado ao carrinho: {adicionadoFlash}</span>
            </span>
          ) : (
            <>
              <span className="hidden sm:inline">Comece a digitar em qualquer lugar da tela para buscar.</span>
              <span className="sm:hidden">Toque na busca para pesquisar.</span>
              <span className="hidden md:flex items-center gap-1.5 ml-auto">
                <span className="kbd">↑</span><span className="kbd">↓</span> navegar
                <span className="kbd ml-1">Enter</span> adicionar
                <span className="kbd ml-1">Esc</span> fechar
              </span>
            </>
          )}
        </div>
      </div>

      {/* Área de resultados — ocupa todo o espaço disponível (não é um dropdown) */}
      <div className="flex-1 min-h-0 mt-3 flex flex-col">
        {listaVisivel ? (
          <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,26,46,0.04)] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
              <span className="text-[12px] text-slate-500">
                <strong className="text-slate-800 num">{resultados.length}</strong> {resultados.length === 1 ? 'peça encontrada' : 'peças encontradas'} para <strong className="text-slate-700">“{termoResultados}”</strong>
              </span>
              <button type="button" onClick={() => { setResultadoAberto(false); inputRef.current?.focus(); }} className="text-[12px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5">
                Fechar <span className="kbd">Esc</span>
              </button>
            </div>
            {/* Cabeçalho das colunas (computador) */}
            <div className="hidden md:grid grid-cols-[44px_minmax(0,1fr)_104px_72px_96px_32px] min-[1700px]:grid-cols-[48px_minmax(0,1fr)_120px_140px_80px_110px_36px] gap-4 px-4 py-2 border-b border-slate-100 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 flex-shrink-0">
              <span />
              <span>Peça</span>
              <span>SKU</span>
              <span className="hidden min-[1700px]:block">Cód. barras</span>
              <span className="text-right">Loja</span>
              <span className="text-right">Preço</span>
              <span />
            </div>
            <div ref={listaRef} id={listboxId} role="listbox" className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-100 max-h-[55vh] lg:max-h-none">
              {resultados.map((peca, idx) => {
                const estoqueBaixo = peca.quantidadeLoja <= 3;
                const semPreco = !Number.isFinite(Number(peca.precoVenda)) || Number(peca.precoVenda) <= 0;
                const noCarrinho = qtdNoCarrinho(peca.id);
                const selecionado = idx === ativo;
                const cat = categoriaNome(peca.categoria);
                return (
                  <div
                    key={peca.id}
                    id={`${listboxId}-${idx}`}
                    data-idx={idx}
                    role="option"
                    aria-selected={selecionado}
                    onMouseMove={() => { if (!selecionado) setAtivo(idx); }}
                    onMouseDown={e => e.preventDefault() /* mantém o foco na busca */}
                    onClick={() => adicionarPeca(peca)}
                    className={`relative grid grid-cols-[40px_minmax(0,1fr)_auto] md:grid-cols-[44px_minmax(0,1fr)_104px_72px_96px_32px] min-[1700px]:grid-cols-[48px_minmax(0,1fr)_120px_140px_80px_110px_36px] items-center gap-3 md:gap-4 px-4 py-2.5 cursor-pointer select-none transition-colors ${selecionado ? 'bg-brand-50/80' : 'hover:bg-slate-50'}`}
                  >
                    {selecionado && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-600" />}
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-slate-100 overflow-hidden border border-slate-200/80">
                      {peca.imagemUrl ? (
                        <img src={peca.imagemUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-slate-900 truncate" title={peca.nome}><Destaque texto={peca.nome} termo={termoResultados} /></p>
                      <div className="flex items-center gap-x-2 gap-y-0.5 mt-0.5 flex-wrap text-[11.5px] text-slate-500">
                        <span className="md:hidden font-mono text-slate-600"><Destaque texto={peca.codigo} termo={termoResultados} /></span>
                        {peca.marca && <span><Destaque texto={peca.marca} termo={termoResultados} /></span>}
                        {cat && <><span className="text-slate-300">·</span><span className="truncate">{cat}</span></>}
                        {noCarrinho > 0 && <span className="text-[10.5px] font-semibold text-brand-700 bg-brand-100/70 rounded px-1.5 py-px">{noCarrinho} no carrinho</span>}
                      </div>
                    </div>
                    <span className="hidden md:block font-mono text-[12px] text-slate-700 truncate"><Destaque texto={peca.codigo} termo={termoResultados} /></span>
                    <span className="hidden min-[1700px]:block font-mono text-[11.5px] text-slate-400 truncate">{peca.codigoBarras ? <Destaque texto={peca.codigoBarras} termo={termoResultados} /> : '—'}</span>
                    <span className={`hidden md:block text-right text-[12.5px] font-medium num ${estoqueBaixo ? 'text-red-600' : 'text-slate-600'}`}>{peca.quantidadeLoja} un.</span>
                    <div className="text-right">
                      <p className={`text-[14px] font-semibold num whitespace-nowrap ${semPreco ? 'text-red-600' : 'text-slate-900'}`}>{semPreco ? 'Sem preço' : fm(Number(peca.precoVenda))}</p>
                      <p className={`md:hidden text-[11px] font-medium num ${estoqueBaixo ? 'text-red-500' : 'text-slate-400'}`}>{peca.quantidadeLoja} un. na loja</p>
                    </div>
                    <span className={`hidden md:flex w-8 h-8 justify-self-end rounded-lg items-center justify-center transition-colors ${selecionado ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`} aria-hidden>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 5v14m-7-7h14"/></svg>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : semResultado ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center">
            <p className="text-sm font-medium text-slate-700">Nenhuma peça encontrada para “{query.trim()}”</p>
            <p className="text-xs text-slate-400 mt-1">A busca considera apenas itens com saldo no estoque da loja.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
