'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCarrinhoVitrine } from './CarrinhoIcone';

interface PecaCarrinho {
  id: string;
  nome: string;
  codigo?: string;
  precoVenda?: number;
  precoOferta?: number;
  precoVitrine?: number;
  oferta?: boolean;
  imagemUrl?: string;
  marca?: string;
  quantidadeLoja?: number;
}

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdicionarAoCarrinho({
  peca,
  disponivel,
  className = '',
}: {
  peca: PecaCarrinho;
  disponivel: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { adicionar } = useCarrinhoVitrine();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');

  // Preço público oficial (item 6): precoVitrine > precoOferta > precoVenda.
  function precoItem(p: PecaCarrinho): number {
    const pv = p.precoVitrine != null ? Number(p.precoVitrine) : NaN;
    if (Number.isFinite(pv) && pv > 0) return pv;
    if (p.oferta && p.precoOferta && Number(p.precoOferta) < Number(p.precoVenda)) return Number(p.precoOferta);
    return Number(p.precoVenda) || 0;
  }

  if (!disponivel) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-8 py-3.5 bg-slate-200 text-slate-500 rounded-xl text-sm font-extrabold cursor-not-allowed ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg>
        Indisponível
      </button>
    );
  }

  function handleAdicionar() {
    const limite = peca.quantidadeLoja ?? 0;
    const jaNoCarrinho = JSON.parse(sessionStorage.getItem('marquinho-cart') || '[]')
      .find((i: any) => i.peca.id === peca.id)?.quantidade || 0;
    if (limite > 0 && jaNoCarrinho >= limite) {
      setErro('Quantidade máxima em estoque (loja) atingida.');
      setTimeout(() => setErro(''), 2500);
      return;
    }
    adicionar(peca);
    setErro('');
    setAberto(true); // AJUSTE 6: confirmação elegante
  }

  return (
    <div>
      <button
        onClick={handleAdicionar}
        className={`inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-extrabold transition-colors shadow-lg shadow-brand-600/25 ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg>
        Adicionar ao Carrinho
      </button>
      {erro && <p className="text-[11px] text-red-600 mt-2 font-medium">{erro}</p>}

      {/* Confirmação elegante */}
      {aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAberto(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 className="text-center text-sm font-extrabold text-slate-800 mb-1">Adicionado ao carrinho!</h3>
            <p className="text-center text-xs text-slate-500 mb-4">{peca.nome}</p>
            <p className="text-center text-lg font-extrabold text-slate-800 mb-5">{fm(precoItem(peca))}</p>
            <div className="space-y-2">
              <button
                onClick={() => { setAberto(false); router.push('/vitrine/carrinho'); }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-600/20">
                Finalizar Compra
              </button>
              <button
                onClick={() => { setAberto(false); router.push('/vitrine'); }}
                className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
