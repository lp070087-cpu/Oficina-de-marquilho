'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ClienteFavoritosPage() {
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    fetchFavoritos(JSON.parse(c).token);
  }, [router]);

  async function fetchFavoritos(token: string) {
    const r = await fetch('/api/cliente/favoritos', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setFavoritos(await r.json());
    setLoading(false);
  }

  async function remover(pecaId: string) {
    const c = JSON.parse(sessionStorage.getItem('marquinho-cliente') || '{}');
    await fetch(`/api/cliente/favoritos?pecaId=${pecaId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${c.token}` } });
    setFavoritos(prev => prev.filter(f => f.pecaId !== pecaId));
  }

  function adicionarAoCarrinho(peca: any) {
    const cart = JSON.parse(sessionStorage.getItem('marquinho-cart') || '[]');
    const idx = cart.findIndex((i: any) => i.peca.id === peca.id);
    if (idx >= 0) cart[idx].quantidade += 1;
    else cart.push({ peca, quantidade: 1 });
    sessionStorage.setItem('marquinho-cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-update'));
    router.push('/vitrine/carrinho');
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">Meus Favoritos</h1>
        <span className="text-xs text-slate-400">{favoritos.length} {favoritos.length === 1 ? 'produto' : 'produtos'}</span>
      </div>

      {favoritos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <p className="text-sm text-slate-400 mb-3">Nenhum produto favorito ainda</p>
          <a href="/vitrine" className="text-brand-600 text-sm font-bold">Explorar produtos →</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {favoritos.map(f => {
            const p = f.peca;
            const preco = p.precoOferta && p.precoOferta < p.precoVenda ? p.precoOferta : p.precoVenda;
            return (
              <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
                {p.imagemUrl && (
                  <img src={p.imagemUrl} alt={p.nome} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">{p.nome}</p>
                  <p className="text-[10px] text-slate-400">{p.marca} · {p.categoria?.nome}</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-1">{fm(Number(preco))}</p>
                  {p.precoOferta && p.precoOferta < p.precoVenda && (
                    <p className="text-[11px] text-slate-400 line-through">{fm(Number(p.precoVenda))}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => adicionarAoCarrinho(p)}
                      className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-[11px] font-bold hover:bg-brand-700">
                      Comprar
                    </button>
                    <button onClick={() => remover(f.pecaId)}
                      className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-[11px] font-bold">
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
