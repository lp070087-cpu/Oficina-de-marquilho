'use client';

import { useState, useEffect } from 'react';
import { getClienteVitrine } from '@/lib/vitrine-session';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CartItem { peca: any; quantidade: number; }

export default function CarrinhoVitrine() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState<any>(null);

  useEffect(() => {
    const s = sessionStorage.getItem('marquinho-cart');
    if (s) setCart(JSON.parse(s));
    const c = getClienteVitrine();
    if (c) setCliente(c);
  }, []);

  function atualizarQtd(i: number, q: number) {
    const n = [...cart];
    if (q <= 0) n.splice(i, 1);
    else n[i] = { ...n[i], quantidade: q };
    setCart(n);
    sessionStorage.setItem('marquinho-cart', JSON.stringify(n));
  }

  function remover(i: number) { atualizarQtd(i, 0); }

  const total = cart.reduce((s, i) => s + Number(i.peca.precoVenda || i.peca.precoOferta || 0) * i.quantidade, 0);
  const qtdItens = cart.reduce((s, i) => s + i.quantidade, 0);

  return (
    <div className="relative group">
      <a href="/vitrine/carrinho" className="flex flex-col items-center justify-center px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
        </svg>
        <span className="text-[10px] text-slate-400 mt-0.5">Carrinho</span>
        {qtdItens > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
            {qtdItens > 9 ? '9+' : qtdItens}
          </span>
        )}
      </a>
    </div>
  );
}

// Hook global para adicionar ao carrinho
export function useCarrinhoVitrine() {
  function adicionar(peca: any) {
    const s = sessionStorage.getItem('marquinho-cart');
    let cart: CartItem[] = s ? JSON.parse(s) : [];
    const idx = cart.findIndex((i: CartItem) => i.peca.id === peca.id);
    if (idx >= 0) cart[idx].quantidade += 1;
    else cart.push({
      peca: {
        id: peca.id, nome: peca.nome, codigo: peca.codigo,
        precoVenda: peca.precoVenda, precoOferta: peca.precoOferta, oferta: peca.oferta,
        imagemUrl: peca.imagemUrl, marca: peca.marca, quantidadeLoja: peca.quantidadeLoja,
      },
      quantidade: 1,
    });
    sessionStorage.setItem('marquinho-cart', JSON.stringify(cart));
  }
  return { adicionar };
}
