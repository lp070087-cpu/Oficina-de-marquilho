'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CardProdutoPremium from '@/components/vitrine/CardProdutoPremium';

export default function FavoritosPage() {
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<any>(null);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/vitrine/login'); return; }
    const d = JSON.parse(c);
    setCliente(d);

    fetch('/api/vitrine/favoritos', { headers: { Authorization: `Bearer ${d.token}` } })
      .then(r => r.json()).then(data => {
        setFavoritos(data);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [router]);

  async function toggleFavorito(pecaId: string) {
    await fetch('/api/vitrine/favoritos', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cliente?.token}` },
      body: JSON.stringify({ pecaId }),
    });
    setFavoritos(prev => prev.filter(f => f.pecaId !== pecaId));
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#0D1117] text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/vitrine" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center"><span className="font-extrabold text-white text-xs">MP</span></div>
            <span className="font-extrabold text-sm">Favoritos</span>
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Meus Favoritos</h1>
        <p className="text-sm text-slate-500 mb-6">{favoritos.length} produtos</p>

        {loading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>
        ) : favoritos.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <p className="text-sm text-slate-400">Nenhum favorito salvo ainda</p>
            <a href="/vitrine/catalogo" className="text-brand-600 text-sm font-bold mt-2 inline-block">Explorar catálogo</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {favoritos.map((f: any) => (
              <CardProdutoPremium key={f.id} p={f.peca} onFavorito={toggleFavorito} favorited={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
