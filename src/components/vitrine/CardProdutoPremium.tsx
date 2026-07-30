'use client';

import { useState } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Produto {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number;
  quantidade: number; estoqueMinimo: number; vitrine: boolean; destaque: boolean; oferta: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string }; createdAt?: string;
}

export default function CardProdutoPremium({
  p, onFavorito, favorited, onCarrinho, compact, onComparar, comparado
}: {
  p: Produto; onFavorito?: (id: string) => void; favorited?: boolean; onCarrinho?: (p: Produto) => void; compact?: boolean;
  onComparar?: (id: string) => void; comparado?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [hoverImg, setHoverImg] = useState(false);
  const oferta = p.oferta && p.precoOferta;
  const economia = oferta ? Number(p.precoVenda) - Number(p.precoOferta) : 0;
  const desconto = oferta ? Math.round((economia / Number(p.precoVenda)) * 100) : 0;
  const disponivel = p.quantidade > 0;
  const ultimasUnidades = p.quantidade > 0 && p.quantidade <= 5;
  const novo = p.createdAt ? (new Date().getTime() - new Date(p.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  const preco = oferta ? Number(p.precoOferta) : Number(p.precoVenda);
  const descontoPix = preco * 0.95;
  const parcelas = [2, 3, 4].find(x => preco / x >= 20);
  const precoAtual = oferta ? Number(p.precoOferta) : Number(p.precoVenda);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-xl transition-all duration-200 group flex flex-col ${compact ? '' : ''}`}>
      {/* Imagem */}
      <a href={`/vitrine/produto/${p.id}`} className="relative aspect-square bg-slate-50 rounded-t-xl overflow-hidden flex items-center justify-center"
        onMouseEnter={() => setHoverImg(true)} onMouseLeave={() => setHoverImg(false)}>
        {!imgError && p.imagemUrl ? (
          <img src={p.imagemUrl} alt={p.nome}
            className={`w-full h-full object-cover transition-all duration-500 ${hoverImg ? 'scale-110' : 'group-hover:scale-105'}`}
            onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {oferta && <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-extrabold rounded-full shadow-sm">{desconto}% OFF</span>}
          {novo && !oferta && <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-extrabold rounded-full shadow-sm">Novo</span>}
          {!disponivel && <span className="px-2 py-0.5 bg-slate-700 text-white text-[9px] font-bold rounded-full shadow-sm">Indisponível</span>}
          {ultimasUnidades && disponivel && <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full shadow-sm">Últimas {p.quantidade} un.</span>}
        </div>
        {/* Botões ação */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {onFavorito && (
            <button onClick={(e) => { e.preventDefault(); onFavorito(p.id); }}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all hover:scale-110">
              <svg className={`w-4 h-4 ${favorited ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
          {onComparar && (
            <button onClick={(e) => { e.preventDefault(); onComparar(p.id); }}
              className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all hover:scale-110 ${comparado ? 'bg-brand-600 text-white' : 'bg-white/90 hover:bg-white text-slate-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </button>
          )}
        </div>
      </a>

      {/* Info */}
      <div className={`p-3 flex-1 flex flex-col ${compact ? 'gap-1' : 'gap-1.5'}`}>
        {p.marca && <p className="text-[9px] text-brand-600 font-bold uppercase tracking-wider">{p.marca}</p>}
        <a href={`/vitrine/produto/${p.id}`} className="text-xs font-semibold text-slate-700 line-clamp-2 leading-snug hover:text-brand-600 transition-colors">{p.nome}</a>
        {!compact && <p className="text-[9px] text-slate-400 truncate">{p.categoria.nome}{p.compatibilidade ? ` · ${p.compatibilidade}` : ''}</p>}

        {/* Estoque */}
        {!compact && disponivel && <p className="text-[9px] text-emerald-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>{p.quantidade > 10 ? 'Em estoque' : `Apenas ${p.quantidade} un.`}</p>}

        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-slate-800">{fm(precoAtual)}</span>
            {oferta && <span className="text-[10px] text-slate-400 line-through">{fm(Number(p.precoVenda))}</span>}
          </div>

          {/* PIX */}
          {disponivel && <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">PIX {fm(descontoPix)}</p>}

          {/* Parcelamento */}
          {disponivel && parcelas && <p className="text-[9px] text-slate-400 mt-0.5">ou {parcelas}x de {fm(precoAtual / parcelas)} sem juros</p>}
        </div>

        {/* Botão carrinho */}
        {onCarrinho && disponivel && (
          <button onClick={() => onCarrinho(p)}
            className="mt-2 w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-colors opacity-0 group-hover:opacity-100 shadow-md shadow-brand-600/20">
            Adicionar ao Carrinho
          </button>
        )}
      </div>
    </div>
  );
}
