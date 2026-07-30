'use client';

import { useState, useEffect } from 'react';

const TABS = [
  { key: 'todas', label: 'Todas' },
  { key: 'naoLidas', label: 'Não lidas' },
  { key: 'alta', label: 'Alta prioridade' },
];

interface NotificationCenterProps {
  filtroInicial?: string;
  onNotificationClick?: (notif: any) => void;
}

export default function NotificationCenter({ filtroInicial = 'todas', onNotificationClick }: NotificationCenterProps) {
  const [filtro, setFiltro] = useState(filtroInicial);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificacoes();
  }, [filtro, tipoFiltro, page]);

  async function fetchNotificacoes() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtro === 'naoLidas') params.set('filtro', 'naoLidas');
    else if (filtro === 'alta') params.set('prioridade', 'ALTA');
    params.set('page', String(page));
    params.set('limit', '20');
    if (tipoFiltro) params.set('tipo', tipoFiltro);

    const r = await fetch(`/api/notificacoes?${params}`);
    if (r.ok) {
      const d = await r.json();
      setNotificacoes(d.notificacoes || []);
      setNaoLidas(d.naoLidas || 0);
      setTotal(d.total || 0);
      setTotalPages(d.totalPages || 1);
    }
    setLoading(false);
  }

  async function marcarLida(id: string) {
    await fetch(`/api/notificacoes/${id}`, { method: 'PATCH' });
    fetchNotificacoes();
  }

  async function marcarTodas() {
    await fetch('/api/notificacoes/read-all', { method: 'PATCH' });
    fetchNotificacoes();
  }

  async function deletar(id: string) {
    await fetch(`/api/notificacoes/${id}`, { method: 'DELETE' });
    fetchNotificacoes();
  }

  function handleClick(notif: any) {
    if (!notif.lida) marcarLida(notif.id);
    if (onNotificationClick) onNotificationClick(notif);
    else if (notif.urlDestino) window.location.href = notif.urlDestino;
  }

  const TIPOS = [
    { key: '', label: 'Todos' },
    { key: 'PEDIDO', label: 'Pedidos' },
    { key: 'VENDA', label: 'Vendas' },
    { key: 'OS', label: 'Oficina' },
    { key: 'ESTOQUE', label: 'Estoque' },
    { key: 'FINANCEIRO', label: 'Financeiro' },
    { key: 'SISTEMA', label: 'Sistema' },
  ];

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setFiltro(t.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filtro === t.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              {t.label} {t.key === 'naoLidas' && naoLidas > 0 ? `(${naoLidas})` : ''}
            </button>
          ))}
        </div>

        <select value={tipoFiltro} onChange={e => { setTipoFiltro(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border-0 cursor-pointer hover:bg-slate-200">
          {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>

        {naoLidas > 0 && (
          <button onClick={marcarTodas}
            className="px-3 py-1.5 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-lg ml-auto">
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Lista */}
      {!loading && (
        <>
          {notificacoes.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm text-slate-400">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notificacoes.map((n: any) => (
                <div key={n.id}
                  onClick={() => handleClick(n)}
                  className={`bg-white rounded-xl border p-4 flex items-start gap-3 cursor-pointer hover:border-brand-300 transition-colors ${
                    !n.lida ? 'border-brand-200 bg-brand-50/10' : 'border-slate-200'
                  }`}>
                  <span className="text-lg flex-shrink-0 pt-0.5">{n.icone || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold text-slate-700">{n.titulo}</p>
                      {!n.lida && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                        n.prioridade === 'CRITICA' ? 'bg-red-50 text-red-600' :
                        n.prioridade === 'ALTA' ? 'bg-amber-50 text-amber-600' :
                        n.prioridade === 'BAIXA' ? 'bg-slate-100 text-slate-500' :
                        'bg-sky-50 text-sky-600'
                      }`}>
                        {n.prioridade}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1">{n.mensagem}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString('pt-BR')}</span>
                      <button onClick={e => { e.stopPropagation(); deletar(n.id); }}
                        className="text-[10px] text-slate-300 hover:text-red-400">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 text-xs rounded hover:bg-slate-100 disabled:opacity-30">←</button>
              <span className="text-xs text-slate-400">Página {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 text-xs rounded hover:bg-slate-100 disabled:opacity-30">→</button>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-400 mt-3">{total} notificações no total</p>
        </>
      )}
    </div>
  );
}
