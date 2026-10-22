'use client';

import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import UploadImagens, { ImagemInfo } from '@/components/estoque/UploadImagens';
import { pecaMatchBusca } from '@/lib/peca-utils';

// Galeria administrativa: mostra TODOS os produtos ativos do estoque com a foto de capa,
// para localizar rapidamente o que ainda precisa ser fotografado. Somente leitura sobre
// preço/quantidade — a única escrita é o upload de fotos, pelo fluxo já existente
// (UploadImagens → /api/pecas/imagens).

interface PecaGaleria {
  id: string;
  nome: string;
  codigo: string;
  codigoBarras?: string | null;
  marca?: string | null;
  imagemUrl?: string | null;
  subcategoria?: string | null;
  categoria?: { id: string; nome: string } | null;
}

type FiltroFoto = 'todos' | 'sem' | 'com';

const CAMPOS_BUSCA = ['nome', 'codigo', 'codigoBarras', 'marca', 'subcategoria'] as const;
const POR_PAGINA = 60;

const temFoto = (p: PecaGaleria) => !!(p.imagemUrl && p.imagemUrl.trim());

export default function GaleriaProdutos() {
  const [pecas, setPecas] = useState<PecaGaleria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const buscaAdiada = useDeferredValue(busca);
  const [filtroFoto, setFiltroFoto] = useState<FiltroFoto>('sem');
  const [categoriaId, setCategoriaId] = useState('');
  const [limite, setLimite] = useState(POR_PAGINA);

  // Gerenciador de fotos (mesmo componente usado na Vitrine e no Estoque)
  const [pecaFotos, setPecaFotos] = useState<PecaGaleria | null>(null);
  const [imagensAtuais, setImagensAtuais] = useState<ImagemInfo[]>([]);
  const [carregandoFotos, setCarregandoFotos] = useState(false);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const r = await fetch('/api/pecas');
      if (!r.ok) throw new Error();
      const d = await r.json();
      setPecas(Array.isArray(d) ? d : []);
    } catch {
      setErro('Não foi possível carregar os produtos.');
    }
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Volta para o início da lista quando o filtro muda
  useEffect(() => { setLimite(POR_PAGINA); }, [buscaAdiada, filtroFoto, categoriaId]);

  const categorias = useMemo(() => {
    const m = new Map<string, { id: string; nome: string; total: number; semFoto: number }>();
    for (const p of pecas) {
      if (!p.categoria) continue;
      const c = m.get(p.categoria.id) || { id: p.categoria.id, nome: p.categoria.nome, total: 0, semFoto: 0 };
      c.total++; if (!temFoto(p)) c.semFoto++;
      m.set(p.categoria.id, c);
    }
    return [...m.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [pecas]);

  const base = useMemo(() => {
    const q = buscaAdiada.trim();
    return pecas.filter(p =>
      (!categoriaId || p.categoria?.id === categoriaId) &&
      (!q || pecaMatchBusca(p, q, CAMPOS_BUSCA)));
  }, [pecas, buscaAdiada, categoriaId]);

  const totalCom = useMemo(() => base.filter(temFoto).length, [base]);
  const totalSem = base.length - totalCom;
  const lista = useMemo(() => {
    const l = filtroFoto === 'todos' ? base : base.filter(p => (filtroFoto === 'com') === temFoto(p));
    return [...l].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [base, filtroFoto]);

  const geralCom = useMemo(() => pecas.filter(temFoto).length, [pecas]);
  const cobertura = pecas.length > 0 ? Math.round((geralCom / pecas.length) * 100) : 0;

  async function abrirFotos(p: PecaGaleria) {
    setImagensAtuais([]);
    setPecaFotos(p);
    setCarregandoFotos(true);
    try {
      const r = await fetch(`/api/pecas/imagens?pecaId=${p.id}`);
      const d = await r.json();
      if (Array.isArray(d)) setImagensAtuais(d.map((img: any) => ({ id: img.id, url: img.url, tipo: img.tipo, ordem: img.ordem, cor: img.cor || null })));
    } catch { /* abre vazio — o upload continua possível */ }
    setCarregandoFotos(false);
  }

  const filtros: { id: FiltroFoto; label: string; n: number }[] = [
    { id: 'sem', label: 'Sem foto', n: totalSem },
    { id: 'com', label: 'Com foto', n: totalCom },
    { id: 'todos', label: 'Todos', n: base.length },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Resumo */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="eyebrow">Vitrine</p>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight mt-1">Galeria de produtos</h2>
          <p className="text-[13px] text-slate-500 mt-1">Encontre as peças que ainda precisam de foto e envie direto daqui.</p>
        </div>
        <div className="card p-4 sm:p-5 lg:min-w-[380px]">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[12px] text-slate-500">Cobertura de fotos</span>
            <span className="text-[12px] text-slate-500 num"><strong className="text-slate-900 text-base font-semibold">{cobertura}%</strong> · {geralCom.toLocaleString('pt-BR')} de {pecas.length.toLocaleString('pt-BR')}</span>
          </div>
          <div className="mt-2.5 h-2 rounded-full bg-amber-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${cobertura}%` }} />
          </div>
          <p className="mt-2 text-[11.5px] text-amber-700 num">{(pecas.length - geralCom).toLocaleString('pt-BR')} produtos ativos sem foto</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, SKU, marca ou código de barras"
            className="input-field pl-9 h-10" aria-label="Buscar produtos" />
        </div>
        <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="input-field h-10 md:w-56" aria-label="Filtrar por categoria">
          <option value="">Todas as categorias</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.semFoto} sem foto)</option>)}
        </select>
        <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200/80 self-start md:self-auto" role="tablist" aria-label="Filtrar por foto">
          {filtros.map(f => (
            <button key={f.id} role="tab" aria-selected={filtroFoto === f.id} onClick={() => setFiltroFoto(f.id)}
              className={`h-8 px-3 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${filtroFoto === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {f.label} <span className={`num ml-1 ${f.id === 'sem' && f.n > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{f.n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grade */}
      {carregando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white border border-slate-200/80 animate-pulse" />)}
        </div>
      ) : erro ? (
        <div className="card text-center text-sm text-red-600">{erro} <button onClick={carregar} className="underline ml-1">Tentar novamente</button></div>
      ) : lista.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm font-medium text-slate-700">{filtroFoto === 'sem' && !busca && !categoriaId ? 'Todos os produtos têm foto.' : 'Nenhum produto encontrado com esses filtros.'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
            {lista.slice(0, limite).map(p => {
              const comFoto = temFoto(p);
              return (
                <article key={p.id} className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-sm transition-all">
                  <button type="button" onClick={() => abrirFotos(p)} className="relative aspect-square bg-slate-50 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40" aria-label={`${comFoto ? 'Gerenciar fotos de' : 'Adicionar foto a'} ${p.nome}`}>
                    {comFoto ? (
                      <img src={p.imagemUrl!} alt={p.nome} loading="lazy" className="w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-[repeating-linear-gradient(135deg,#f8fafc_0,#f8fafc_10px,#f1f5f9_10px,#f1f5f9_20px)]">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="text-[11px] font-medium">Sem foto</span>
                      </div>
                    )}
                    <span className={`absolute top-2 left-2 inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-semibold ring-1 ring-inset ${comFoto ? 'bg-emerald-50/95 text-emerald-700 ring-emerald-600/15' : 'bg-amber-50/95 text-amber-800 ring-amber-600/20'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${comFoto ? 'bg-emerald-500' : 'bg-amber-500'}`} />{comFoto ? 'Com foto' : 'Sem foto'}
                    </span>
                  </button>
                  <div className="p-3 flex-1 flex flex-col gap-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 leading-snug line-clamp-2" title={p.nome}>{p.nome}</p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">{p.codigo}</p>
                    <p className="text-[11px] text-slate-400 truncate">{[p.categoria?.nome, p.marca].filter(Boolean).join(' · ') || '—'}</p>
                    <button type="button" onClick={() => abrirFotos(p)}
                      className={`mt-auto pt-2 w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-medium transition-colors ${comFoto ? 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200' : 'text-white bg-brand-600 hover:bg-brand-700'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={comFoto ? 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' : 'M12 4v16m8-8H4'} /></svg>
                      {comFoto ? 'Gerenciar fotos' : 'Adicionar foto'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-[12px] text-slate-500 num">Mostrando {Math.min(limite, lista.length).toLocaleString('pt-BR')} de {lista.length.toLocaleString('pt-BR')}</p>
            {limite < lista.length && (
              <button onClick={() => setLimite(l => l + POR_PAGINA)} className="btn-secondary">Carregar mais</button>
            )}
          </div>
        </>
      )}

      {/* Gerenciador de fotos — mesmo fluxo de upload da Vitrine/Estoque */}
      {pecaFotos && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[110] p-4" onClick={() => setPecaFotos(null)} role="dialog" aria-modal="true" aria-label="Fotos do produto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="min-w-0">
                <p className="eyebrow">Fotos do produto · máx. 5</p>
                <h3 className="text-[15px] font-semibold text-slate-900 mt-1 truncate">{pecaFotos.nome}</h3>
                <p className="text-[12px] text-slate-500 mt-0.5"><span className="font-mono">{pecaFotos.codigo}</span>{pecaFotos.categoria?.nome ? ` · ${pecaFotos.categoria.nome}` : ''}</p>
              </div>
              <button onClick={() => setPecaFotos(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0" aria-label="Fechar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6">
              {carregandoFotos ? (
                <p className="text-sm text-slate-400 text-center py-8">Carregando fotos...</p>
              ) : (
                <>
                {imagensAtuais.length === 0 && temFoto(pecaFotos) && (
                  <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <img src={pecaFotos.imagemUrl!} alt="" className="w-14 h-14 rounded-lg object-contain bg-white border border-amber-200 flex-shrink-0" />
                    <p className="text-[12px] text-amber-900">Esta peça tem uma <strong>capa antiga</strong> que não aparece na lista de fotos abaixo. Ao enviar uma nova foto, ela passa a ser a capa no lugar desta.</p>
                  </div>
                )}
                <UploadImagens
                  pecaId={pecaFotos.id}
                  imagensAtuais={imagensAtuais}
                  onImagensChange={(imgs) => {
                    setImagensAtuais(imgs);
                    // Mantém a capa do card em sincronia com a foto principal
                    const principal = imgs.find(i => i.tipo === 'PRINCIPAL') || imgs[0];
                    const id = pecaFotos.id;
                    setPecas(prev => prev.map(p => p.id === id ? { ...p, imagemUrl: principal ? principal.url : null } : p));
                    setPecaFotos(prev => prev && prev.id === id ? { ...prev, imagemUrl: principal ? principal.url : null } : prev);
                  }}
                />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
