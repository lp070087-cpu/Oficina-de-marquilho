'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const [count, setCount] = useState(0);
  const [ultimas, setUltimas] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const r = await fetch('/api/notificacoes/unread');
      if (r.ok) {
        const d = await r.json();
        setCount(d.count || 0);
        setUltimas(d.ultimas || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function marcarLida(id: string) {
    await fetch(`/api/notificacoes/${id}`, { method: 'PATCH' });
    fetchUnread();
  }

  async function marcarTodas() {
    await fetch('/api/notificacoes/read-all', { method: 'PATCH' });
    fetchUnread();
    setOpen(false);
  }

  function abrirUrl(notif: any) {
    marcarLida(notif.id);
    if (notif.urlDestino) window.location.href = notif.urlDestino;
    setOpen(false);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchUnread(); }}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        title="Notificações"
      >
        <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[90vw] bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-extrabold text-slate-700">Notificações</span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button onClick={marcarTodas} className="text-[11px] font-bold text-brand-600 hover:underline">
                  Marcar todas
                </button>
              )}
              <a href="/dono/notificacoes" onClick={() => setOpen(false)} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">
                Ver todas
              </a>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto">
            {ultimas.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-xs text-slate-400">Nenhuma notificação</p>
              </div>
            ) : (
              ultimas.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => abrirUrl(n)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors flex items-start gap-3"
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{n.icone || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-slate-700 truncate">{n.titulo}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                        n.prioridade === 'CRITICA' ? 'bg-red-50 text-red-600' :
                        n.prioridade === 'ALTA' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {n.prioridade}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{n.mensagem}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
