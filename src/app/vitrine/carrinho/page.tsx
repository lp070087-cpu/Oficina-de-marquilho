'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClienteVitrine } from '@/lib/vitrine-session';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CartItem { peca: any; quantidade: number; }

export default function CarrinhoPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cupom, setCupom] = useState('');
  const [observacao, setObservacao] = useState('');
  const [cliente, setCliente] = useState<any>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const s = sessionStorage.getItem('marquinho-cart');
    if (s) setCart(JSON.parse(s));
    const c = getClienteVitrine();
    if (c) setCliente(c);
  }, []);

  function atualizarQtd(i: number, q: number) {
    const n = [...cart];
    const limite = Number(n[i]?.peca?.quantidadeLoja ?? 0);
    if (q <= 0) n.splice(i, 1);
    else if (limite > 0 && q > limite) {
      setMsg('Quantidade máxima em estoque (loja) atingida.');
      setTimeout(() => setMsg(''), 2500);
      return;
    } else n[i] = { ...n[i], quantidade: q };
    setCart(n);
    sessionStorage.setItem('marquinho-cart', JSON.stringify(n));
  }

  const subtotal = cart.reduce((s, i) => s + (Number(i.peca.oferta && i.peca.precoOferta ? i.peca.precoOferta : i.peca.precoVenda)) * i.quantidade, 0);
  const desconto = 0; // cupom support prepared
  const total = subtotal - desconto;

  function irCheckout() {
    if (!cliente) { router.push('/vitrine/login'); return; }
    router.push('/vitrine/checkout');
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#0D1117] text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push('/vitrine')} className="text-slate-400 hover:text-white text-sm">← Voltar</button>
          <a href="/vitrine" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/25"><span className="font-extrabold text-white text-xs">MP</span></div>
            <span className="hidden sm:inline font-extrabold text-sm">Marquinho</span>
          </a>
          <span className="flex-1 text-right font-bold text-sm">Carrinho</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-extrabold text-slate-800 mb-2">Meu Carrinho</h1>
        <p className="text-sm text-slate-500 mb-6">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>

        {msg && <div className={`px-4 py-3 rounded-lg text-xs mb-4 ${msg.includes('sucesso') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg>
            </div>
            <p className="text-sm text-slate-400 mb-4">Seu carrinho está vazio</p>
            <button onClick={() => router.push('/vitrine')} className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-extrabold hover:bg-brand-700">Explorar Produtos</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-2">
              {cart.map((item, i) => {
                const preco = item.peca.oferta && item.peca.precoOferta ? Number(item.peca.precoOferta) : Number(item.peca.precoVenda);
                return (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
                    <a href={`/vitrine/produto/${item.peca.id}`} className="w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                      {item.peca.imagemUrl ? <img src={item.peca.imagemUrl} alt={item.peca.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Sem foto</div>}
                    </a>
                    <div className="flex-1 min-w-0">
                      <a href={`/vitrine/produto/${item.peca.id}`} className="text-sm font-semibold text-slate-700 hover:text-brand-600 line-clamp-2">{item.peca.nome}</a>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.peca.codigo}</p>
                      {item.peca.marca && <p className="text-[10px] text-brand-500 font-bold uppercase mt-0.5">{item.peca.marca}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <button onClick={() => atualizarQtd(i, item.quantidade - 1)} className="w-8 h-8 flex items-center justify-center text-xs hover:bg-slate-200 rounded-l-lg font-medium">−</button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantidade}</span>
                          <button onClick={() => atualizarQtd(i, item.quantidade + 1)} className="w-8 h-8 flex items-center justify-center text-xs hover:bg-slate-200 rounded-r-lg font-medium">+</button>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-800">{fm(preco * item.quantidade)}</span>
                          {item.peca.oferta && item.peca.precoOferta && <p className="text-[10px] text-slate-400 line-through">{fm(Number(item.peca.precoVenda) * item.quantidade)}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-20">
                <h3 className="text-sm font-extrabold text-slate-800 mb-4">Resumo do Pedido</h3>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{fm(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Desconto</span><span className="font-medium text-emerald-600">- {fm(desconto)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Frete</span><span className="font-medium text-slate-400">Calculado no checkout</span></div>
                  <div className="flex justify-between pt-3 border-t border-slate-100"><span className="font-bold text-slate-700">Total</span><span className="text-lg font-extrabold text-slate-800">{fm(total)}</span></div>
                </div>

                {/* Cupom */}
                <div className="mb-4">
                  <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Cupom de desconto</label>
                  <div className="flex gap-1">
                    <input value={cupom} onChange={e => setCupom(e.target.value)} placeholder="CUPOM10" className="input-field text-xs flex-1" />
                    <button className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">Aplicar</button>
                  </div>
                </div>

                {/* Observação */}
                <div className="mb-4">
                  <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Observações</label>
                  <textarea value={observacao} onChange={e => setObservacao(e.target.value)} className="input-field text-xs" rows={1} placeholder="Alguma observação?" />
                </div>

                {!cliente && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs mb-3">
                    Faça login para continuar.
                  </div>
                )}

                <button onClick={irCheckout} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold uppercase tracking-wider transition-colors shadow-lg">
                  Ir para o Checkout
                </button>

                <button onClick={() => router.push('/vitrine')} className="w-full py-2.5 mt-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
                  Continuar Comprando
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
