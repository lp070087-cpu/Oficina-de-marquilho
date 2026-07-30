'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ClienteHistoricoPage() {
  const router = useRouter();
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    fetch('/api/cliente/historico', { headers: { Authorization: `Bearer ${JSON.parse(c).token}` } })
      .then(r => r.json()).then(setHistorico).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">Produtos Vistos</h1>
        <span className="text-xs text-slate-400">Últimos {historico.length}</span>
      </div>

      {historico.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <p className="text-sm text-slate-400 mb-3">Nenhum produto visualizado ainda</p>
          <a href="/vitrine" className="text-brand-600 text-sm font-bold">Continuar navegando →</a>
        </div>
      ) : (
        <div className="space-y-2">
          {historico.map(h => {
            const p = h.peca;
            const preco = p.precoOferta && p.precoOferta < p.precoVenda ? p.precoOferta : p.precoVenda;
            return (
              <a key={h.id} href={`/vitrine/produto/${p.id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-brand-300 transition-colors cursor-pointer">
                {p.imagemUrl && <img src={p.imagemUrl} alt={p.nome} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">{p.nome}</p>
                  <p className="text-[10px] text-slate-400">{p.marca} · {p.categoria?.nome || 'Sem categoria'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Visto em {new Date(h.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="text-sm font-bold text-slate-700">{fm(Number(preco))}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
