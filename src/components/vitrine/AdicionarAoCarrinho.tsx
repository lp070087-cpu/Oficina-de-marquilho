'use client';

import { useState } from 'react';
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

export default function AdicionarAoCarrinho({
  peca,
  disponivel,
  className = '',
}: {
  peca: PecaCarrinho;
  disponivel: boolean;
  className?: string;
}) {
  const { adicionar } = useCarrinhoVitrine();
  const [feito, setFeito] = useState(false);
  const [erro, setErro] = useState('');

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

  function handleClick() {
    const limite = peca.quantidadeLoja ?? 0;
    const jaNoCarrinho = JSON.parse(sessionStorage.getItem('marquinho-cart') || '[]')
      .find((i: any) => i.peca.id === peca.id)?.quantidade || 0;
    if (limite > 0 && jaNoCarrinho >= limite) {
      setErro('Quantidade máxima em estoque (loja) atingida.');
      setTimeout(() => setErro(''), 2500);
      return;
    }
    adicionar(peca);
    setFeito(true);
    setErro('');
    setTimeout(() => setFeito(false), 2000);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-extrabold transition-colors shadow-lg shadow-brand-600/25 ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg>
        {feito ? '✓ Adicionado!' : 'Adicionar ao Carrinho'}
      </button>
      {erro && <p className="text-[11px] text-red-600 mt-2 font-medium">{erro}</p>}
    </div>
  );
}
