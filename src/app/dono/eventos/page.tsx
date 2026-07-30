'use client';

import { useState, useEffect } from 'react';
import TimelineEventos from '@/components/notificacoes/TimelineEventos';
import HistoricoEventos from '@/components/notificacoes/HistoricoEventos';

export default function DonoEventosPage() {
  const [view, setView] = useState<'timeline' | 'tabela'>('tabela');
  const [eventosTimeline, setEventosTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  useEffect(() => {
    fetch('/api/eventos?limit=30')
      .then(r => r.json())
      .then(d => setEventosTimeline(d.eventos || []))
      .catch(() => {})
      .finally(() => setLoadingTimeline(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Eventos do Sistema</h1>
          <p className="text-xs text-slate-400 mt-1">Auditoria completa de acontecimentos do ERP</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setView('tabela')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'tabela' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            Tabela
          </button>
          <button onClick={() => setView('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'timeline' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            Timeline
          </button>
        </div>
      </div>

      {view === 'timeline' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <TimelineEventos eventos={eventosTimeline} loading={loadingTimeline} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <HistoricoEventos />
        </div>
      )}
    </div>
  );
}
