'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { rotuloAtributosAcessorio } from '@/lib/vitrine-utils';
import { useCarrinhoVitrine } from './CarrinhoIcone';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Produto {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number; precoVitrine?: number;
  quantidade?: number; quantidadeLoja?: number; estoqueMinimo?: number; vitrine?: boolean; destaque?: boolean; oferta?: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  subcategoria?: string; tamanho?: string | null; genero?: string | null;
  categoria: { nome: string; slug: string }; createdAt?: string;
}

// Preço público oficial (item 6): precoVitrine > precoOferta > precoVenda. Só leitura na Vitrine.
function precoExibicao(p: Produto): number {
  const pv = p.precoVitrine != null ? Number(p.precoVitrine) : NaN;
  if (Number.isFinite(pv) && pv > 0) return pv;
  if (p.oferta && p.precoOferta && Number(p.precoOferta) < Number(p.precoVenda)) return Number(p.precoOferta);
  return Number(p.precoVenda) || 0;
}

export default function CardProdutoPremium({
  p, onFavorito, favorited, onCarrinho, compact, onComparar, comparado
}: {
  p: Produto; onFavorito?: (id: string) => void; favorited?: boolean; onCarrinho?: (p: Produto) => void; compact?: boolean;
  onComparar?: (id: string) => void; comparado?: boolean;
}) {
  const router = useRouter();
  const { adicionar } = useCarrinhoVitrine();
  const [imgError, setImgError] = useState(false);
  const [hoverImg, setHoverImg] = useState(false);
  const [adicionado, setAdicionado] = useState(false);
  const [erro, setErro] = useState('');
  const precoBase = Number(p.precoVenda);
  const temOverride = p.precoVitrine != null && Number(p.precoVitrine) > 0;
  const oferta = p.oferta && p.precoOferta && Number(p.precoOferta) < precoBase && !temOverride;
  const economia = oferta ? precoBase - Number(p.precoOferta) : 0;
  const desconto = oferta ? Math.round((economia / precoBase) * 100) : 0;
  // Disponibilidade baseada no estoque da LOJA (quantidadeLoja). Nunca expor o estoque central.
  const qtdLoja = p.quantidadeLoja ?? 0;
  const disponivel = qtdLoja > 0;
  const ultimasUnidades = qtdLoja > 0 && qtdLoja <= 5;
  const novo = p.createdAt ? (new Date().getTime() - new Date(p.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  const precoAtual = precoExibicao(p);

  // AJUSTE 7: adicionar ao carrinho respeitando o estoque da LOJA; COMPRAR adiciona e vai ao carrinho.
  function adicionarAoCarrinho(e?: React.MouseEvent) {
    e?.preventDefault();
    const limite = p.quantidadeLoja ?? 0;
    const jaNoCarrinho = JSON.parse(sessionStorage.getItem('marquinho-cart') || '[]')
      .find((i: any) => i.peca.id === p.id)?.quantidade || 0;
    if (limite > 0 && jaNoCarrinho >= limite) {
      setErro('Quantidade máxima em estoque (loja) atingida.');
      setTimeout(() => setErro(''), 2500);
      return;
    }
    if (onCarrinho) { onCarrinho(p); }
    else adicionar(p);
    setAdicionado(true);
    setErro('');
    setTimeout(() => setAdicionado(false), 1800);
  }

  function comprar(e: React.MouseEvent) {
    e.preventDefault();
    const limite = p.quantidadeLoja ?? 0;
    const jaNoCarrinho = JSON.parse(sessionStorage.getItem('marquinho-cart') || '[]')
      .find((i: any) => i.peca.id === p.id)?.quantidade || 0;
    if (limite > 0 && jaNoCarrinho >= limite) {
      setErro('Quantidade máxima em estoque (loja) atingida.');
      setTimeout(() => setErro(''), 2500);
      return;
    }
    if (onCarrinho) { onCarrinho(p); }
    else adicionar(p);
    router.push('/vitrine/carrinho');
  }

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
          {p.destaque && <span className="px-2 py-0.5 bg-brand-600 text-white text-[9px] font-extrabold rounded-full shadow-sm">Destaque</span>}
          {oferta && <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-extrabold rounded-full shadow-sm">{desconto}% OFF</span>}
          {novo && !oferta && !p.destaque && <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-extrabold rounded-full shadow-sm">Novo</span>}
          {!disponivel && <span className="px-2 py-0.5 bg-slate-700 text-white text-[9px] font-bold rounded-full shadow-sm">Indisponível</span>}
          {ultimasUnidades && disponivel && <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full shadow-sm">Últimas unidades</span>}
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
        {!compact && <p className="text-[9px] text-slate-400 truncate">{p.categoria.nome}{rotuloAtributosAcessorio(p) ? ` · ${rotuloAtributosAcessorio(p)}` : ''}{p.compatibilidade ? ` · ${p.compatibilidade}` : ''}</p>}

        {/* Disponibilidade (sem expor número do estoque central) */}
        {!compact && disponivel && <p className="text-[9px] text-emerald-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>{ultimasUnidades ? 'Últimas unidades' : 'Em estoque'}</p>}

        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-slate-800">{fm(precoAtual)}</span>
            {(oferta || temOverride) && <span className="text-[10px] text-slate-400 line-through">{fm(precoBase)}</span>}
          </div>
        </div>

        {erro && <p className="text-[10px] text-red-600 font-medium mt-1">{erro}</p>}

        {/* AJUSTE 7: botões [ADICIONAR AO CARRINHO] e [COMPRAR] */}
        {disponivel && (
          <div className="flex gap-1.5 mt-2">
            <button onClick={adicionarAoCarrinho}
              className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all border ${
                adicionado ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-brand-600 text-brand-700 hover:bg-brand-50'
              }`}>
              {adicionado ? '✓ Adicionado!' : 'Adicionar ao Carrinho'}
            </button>
            <button onClick={comprar}
              className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-colors shadow-md shadow-brand-600/20">
              Comprar
            </button>
          </div>
        )}
        {!disponivel && (
          <p className="mt-2 text-[10px] text-slate-400 text-center py-2">Indisponível no momento</p>
        )}
      </div>
    </div>
  );
}
