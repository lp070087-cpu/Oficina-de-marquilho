'use client';

import { useState, useEffect } from 'react';
import NotificationCenter from '@/components/notificacoes/NotificationCenter';
import NotificationCard from '@/components/notificacoes/NotificationCard';

export default function DonoNotificacoesPage() {
  const [resumo, setResumo] = useState({ total: 0, naoLidas: 0, alta: 0, hoje: 0 });
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    fetchResumo();
  }, []);

  async function fetchResumo() {
    try {
      const r = await fetch('/api/notificacoes?limit=200');
      if (r.ok) {
        const d = await r.json();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const altoCount = d.notificacoes?.filter((n: any) => n.prioridade === 'ALTA' || n.prioridade === 'CRITICA').length || 0;
        const hojeCount = d.notificacoes?.filter((n: any) => new Date(n.createdAt) >= hoje).length || 0;
        setResumo({
          total: d.total || 0,
          naoLidas: d.naoLidas || 0,
          alta: altoCount,
          hoje: hojeCount,
        });
      }
    } catch {}
  }

  const CARDS = [
    { label: 'Total', valor: resumo.total, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
    { label: 'Não lidas', valor: resumo.naoLidas, color: 'text-brand-600', bg: 'bg-brand-50 border-brand-200' },
    { label: 'Alta prioridade', valor: resumo.alta, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Hoje', valor: resumo.hoje, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Central de Notificações</h1>
        <p className="text-xs text-slate-400 mt-1">Acompanhe pedidos, vendas, oficina, estoque e mais</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CARDS.map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl border p-4`}>
            <p className="text-[11px] text-slate-500 font-medium mb-1">{c.label}</p>
            <p className={`text-2xl font-extrabold ${c.color}`}>{c.valor}</p>
          </div>
        ))}
      </div>

      {/* Lista com filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <NotificationCenter filtroInicial="todas" />
      </div>
    </div>
  );
}
