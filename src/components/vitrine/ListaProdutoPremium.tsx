'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCarrinhoVitrine } from './CarrinhoIcone';
import { rotuloAtributosAcessorio } from '@/lib/vitrine-utils';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Produto {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number; precoVitrine?: number;
  quantidade?: number; quantidadeLoja?: number; marca?: string; compatibilidade?: string; imagemUrl?: string;
  descricaoCurta?: string; subcategoria?: string; tamanho?: string | null; genero?: string | null;
  categoria: { nome: string; slug: string };
}

export default function ListaProdutoPremium({ p, onComparar, comparado }: {
  p: Produto; onComparar?: (id: string) => void; comparado?: boolean;
}) {
  const router = useRouter();
  const { adicionar } = useCarrinhoVitrine();
  const [imgError, setImgError] = useState(false);
  const [adicionado, setAdicionado] = useState(false);
  const [erro, setErro] = useState('');
  // Preço público oficial (item 6): precoVitrine > precoOferta > precoVenda.
  const precoBase = Number(p.precoVenda);
  const temOverride = p.precoVitrine != null && Number(p.precoVitrine) > 0;
  const oferta = !temOverride && p.precoOferta && Number(p.precoOferta) > 0 && Number(p.precoOferta) < precoBase;
  const desconto = oferta ? Math.round(((precoBase - Number(p.precoOferta)) / precoBase) * 100) : 0;
  const precoAtual = temOverride ? Number(p.precoVitrine) : (oferta ? Number(p.precoOferta) : precoBase);
  // Disponibilidade pelo estoque da LOJA. Nunca expor o estoque central (quantidade).
  const disponivel = (p.quantidadeLoja ?? 0) > 0;

  // AJUSTE 7: adicionar respeitando estoque da LOJA; COMPRAR adiciona e vai ao carrinho.
  function adicionarAoCarrinho() {
    const limite = p.quantidadeLoja ?? 0;
    const jaNoCarrinho = JSON.parse(sessionStorage.getItem('marquinho-cart') || '[]')
      .find((i: any) => i.peca.id === p.id)?.quantidade || 0;
    if (limite > 0 && jaNoCarrinho >= limite) {
      setErro('Quantidade máxima em estoque (loja) atingida.');
      setTimeout(() => setErro(''), 2500);
      return;
    }
    adicionar(p);
    setAdicionado(true);
    setErro('');
    setTimeout(() => setAdicionado(false), 1800);
  }

  function comprar() {
    const limite = p.quantidadeLoja ?? 0;
    const jaNoCarrinho = JSON.parse(sessionStorage.getItem('marquinho-cart') || '[]')
      .find((i: any) => i.peca.id === p.id)?.quantidade || 0;
    if (limite > 0 && jaNoCarrinho >= limite) {
      setErro('Quantidade máxima em estoque (loja) atingida.');
      setTimeout(() => setErro(''), 2500);
      return;
    }
    adicionar(p);
    router.push('/vitrine/carrinho');
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all duration-200 p-4 flex gap-4 group">
      {/* Imagem */}
      <a href={`/vitrine/produto/${p.id}`} className="w-28 h-28 rounded-lg bg-slate-50 flex-shrink-0 overflow-hidden">
        {p.imagemUrl && !imgError ? (
          <img src={p.imagemUrl} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
        )}
      </a>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {p.marca && <span className="text-[9px] text-brand-600 font-bold uppercase">{p.marca}</span>}
            {oferta && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-extrabold rounded-full">-{desconto}%</span>}
          </div>
          <a href={`/vitrine/produto/${p.id}`} className="text-sm font-semibold text-slate-700 line-clamp-2 hover:text-brand-600 transition-colors">{p.nome}</a>
          {p.descricaoCurta && <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.descricaoCurta}</p>}
          <p className="text-[10px] text-slate-400 mt-1">{p.categoria.nome}{rotuloAtributosAcessorio(p) ? ` · ${rotuloAtributosAcessorio(p)}` : ''}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-800">{fm(precoAtual)}</span>
              {(oferta || temOverride) && <span className="text-xs text-slate-400 line-through">{fm(precoBase)}</span>}
            </div>
            {disponivel && <span className="text-[10px] text-emerald-600 font-medium">Em estoque</span>}
            {erro && <span className="text-[10px] text-red-600 font-medium ml-2">{erro}</span>}
          </div>

          <div className="flex items-center gap-2">
            {onComparar && (
              <button onClick={() => onComparar(p.id)} className={`p-2 rounded-lg text-xs transition-colors ${comparado ? 'bg-brand-100 text-brand-600' : 'bg-slate-50 text-slate-400 hover:text-brand-600'}`}>
                ⚖️
              </button>
            )}
            {disponivel && (
              <button onClick={adicionarAoCarrinho}
                className={`px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-colors border ${
                  adicionado ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-brand-600 text-brand-700 hover:bg-brand-50'
                }`}>
                {adicionado ? '✓ Adicionado!' : 'Carrinho'}
              </button>
            )}
            <button onClick={comprar}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors">
              Comprar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
