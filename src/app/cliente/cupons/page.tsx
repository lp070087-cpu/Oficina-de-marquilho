'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const TABS = [
  { key: 'disponiveis', label: 'Disponíveis' },
  { key: 'utilizados', label: 'Utilizados' },
  { key: 'expirados', label: 'Expirados' },
];

export default function ClienteCuponsPage() {
  const router = useRouter();
  const [cupons, setCupons] = useState<any[]>([]);
  const [tab, setTab] = useState('disponiveis');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    const cd = JSON.parse(c);
    setLoading(true);
    fetch(`/api/cliente/cupons?tipo=${tab}`, { headers: { Authorization: `Bearer ${cd.token}` } })
      .then(r => r.json()).then(setCupons).catch(() => {}).finally(() => setLoading(false));
  }, [tab, router]);

  const STATUS_COLORS: Record<string, string> = {
    DISPONIVEL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    USADO: 'bg-sky-50 text-sky-700 border-sky-200',
    EXPIRADO: 'bg-red-50 text-red-700 border-red-200',
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">Meus Cupons</h1>

      <div className="flex items-center gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === t.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {cupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
          </div>
          <p className="text-sm text-slate-400">Nenhum cupom {tab === 'disponiveis' ? 'disponível' : tab === 'utilizados' ? 'utilizado' : 'expirado'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cupons.map(c => (
            <div key={c.id || c.codigo} className={`bg-white rounded-xl border p-4 ${c.status === 'DISPONIVEL' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-brand-600 font-mono">{c.codigo}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[c.status] || ''}`}>
                    {c.status === 'DISPONIVEL' ? 'Disponível' : c.status === 'USADO' ? 'Utilizado' : 'Expirado'}
                  </span>
                </div>
                {c.valor && (
                  <span className="text-lg font-extrabold text-emerald-600">
                    {c.tipo === 'PERCENTUAL' ? `${Number(c.valor)}%` : fm(Number(c.valor))}
                  </span>
                )}
              </div>
              {c.descricao && <p className="text-xs text-slate-500">{c.descricao}</p>}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                {c.dataInicio && <span>Válido de {new Date(c.dataInicio).toLocaleDateString('pt-BR')}</span>}
                {c.dataFim && <span>até {new Date(c.dataFim).toLocaleDateString('pt-BR')}</span>}
                {c.usadoEm && <span>Usado em {new Date(c.usadoEm).toLocaleDateString('pt-BR')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
