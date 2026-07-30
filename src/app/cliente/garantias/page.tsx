'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ClienteGarantiasPage() {
  const router = useRouter();
  const [garantias, setGarantias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    fetch('/api/cliente/garantias', { headers: { Authorization: `Bearer ${JSON.parse(c).token}` } })
      .then(r => r.json()).then(setGarantias).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  function diasRestantes(expiraEm: string) {
    const diff = new Date(expiraEm).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function progressoRestante(expiraEm: string, diasTotais: number) {
    return Math.min(100, Math.round((diasRestantes(expiraEm) / diasTotais) * 100));
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">Minhas Garantias</h1>

      {garantias.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <p className="text-sm text-slate-400">Nenhuma garantia registrada</p>
        </div>
      ) : garantias.map(g => {
        const restante = diasRestantes(g.expiraEm);
        const progresso = progressoRestante(g.expiraEm, g.diasGarantia);
        const statusColor = g.status === 'ATIVA'
          ? restante > 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          : g.status === 'EXPIRADA' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200';

        return (
          <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {g.peca?.imagemUrl && <img src={g.peca.imagemUrl} alt="" className="w-10 h-10 rounded object-cover" />}
                <div>
                  <p className="text-sm font-bold text-slate-700">{g.peca?.nome || 'Produto'}</p>
                  <p className="text-[10px] text-slate-400">{g.peca?.marca} · Pedido #{g.pedido?.numero || '—'}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                {g.status === 'ATIVA' ? 'Ativa' : g.status === 'EXPIRADA' ? 'Expirada' : 'Acionada'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Data da compra</span>
                <span className="text-slate-600">{new Date(g.dataCompra).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expira em</span>
                <span className="text-slate-600">{new Date(g.expiraEm).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dias restantes</span>
                <span className={`font-bold ${restante <= 10 && g.status === 'ATIVA' ? 'text-red-500' : 'text-slate-700'}`}>
                  {restante} dias
                </span>
              </div>
            </div>

            {g.status === 'ATIVA' && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Garantia</span><span>{restante} de {g.diasGarantia} dias</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${restante > 30 ? 'bg-emerald-500' : restante > 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${progresso}%` }} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
