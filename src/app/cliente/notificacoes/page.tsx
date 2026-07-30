'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClienteNotificacoesPage() {
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    fetchNotificacoes(JSON.parse(c).token);
  }, [router]);

  async function fetchNotificacoes(token: string) {
    const r = await fetch('/api/cliente/notificacoes', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const d = await r.json();
      setNotificacoes(d.notificacoes || []);
      setNaoLidas(d.totalNaoLidas || 0);
    }
    setLoading(false);
  }

  async function marcarLida(id?: string) {
    const c = JSON.parse(sessionStorage.getItem('marquinho-cliente') || '{}');
    await fetch('/api/cliente/notificacoes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.token}` },
      body: JSON.stringify(id ? { id } : {}),
    });
    fetchNotificacoes(c.token);
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Notificações</h1>
          {naoLidas > 0 && <p className="text-xs text-slate-400 mt-1">{naoLidas} não lidas</p>}
        </div>
        {naoLidas > 0 && (
          <button onClick={() => marcarLida()}
            className="px-3 py-1.5 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-lg">
            Marcar todas como lidas
          </button>
        )}
      </div>

      {notificacoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          </div>
          <p className="text-sm text-slate-400">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notificacoes.map(n => {
            const icones: Record<string, string> = {
              PEDIDO_RECEBIDO: '📥', PEDIDO_SEPARADO: '📦', PEDIDO_PRONTO: '✅',
              CUPOM_NOVO: '🎫', PROMOCAO: '🔥', FAVORITO_OFERTA: '❤️',
            };
            return (
              <div key={n.id}
                onClick={() => { if (!n.lida) marcarLida(n.id); if (n.link) router.push(n.link); }}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-brand-300 transition-colors ${!n.lida ? 'border-brand-200 bg-brand-50/20' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{icones[n.tipo] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-700">{n.titulo}</p>
                      {!n.lida && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{n.mensagem}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
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
