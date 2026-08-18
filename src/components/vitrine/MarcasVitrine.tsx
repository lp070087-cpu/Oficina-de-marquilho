'use client';

import { useState, useEffect } from 'react';

export default function MarcasVitrine() {
  const [marcas, setMarcas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vitrine/marcas').then(r => r.json()).then(d => { setMarcas(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-12"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>;

  // Filtrar marcas que têm produtos
  const comProdutos = marcas.filter((m: any) => m.quantidadeProdutos > 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Marcas</h1>
      <p className="text-sm text-slate-500 mb-8">Confira as marcas disponíveis em nossa loja</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {comProdutos.map((m: any) => (
          <a key={m.slug || m.nome} href={`/vitrine/busca?marca=${encodeURIComponent(m.nome)}`}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center hover:border-brand-300 hover:shadow-lg transition-all group">
            <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-brand-50 transition-colors">
              {m.logoUrl ? <img src={m.logoUrl} alt={m.nome} className="max-w-full max-h-full object-contain" /> : <span className="text-2xl font-extrabold text-brand-600">{m.nome.charAt(0)}</span>}
            </div>
            <p className="text-xs font-bold text-slate-700">{m.nome}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.quantidadeProdutos} produtos</p>
          </a>
        ))}
      </div>
      {comProdutos.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Nenhuma marca cadastrada.</p>}
    </div>
  );
}
