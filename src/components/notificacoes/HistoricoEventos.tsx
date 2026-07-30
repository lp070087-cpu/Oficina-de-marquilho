'use client';

import { useState, useEffect } from 'react';
import FiltroEventos from './FiltroEventos';

interface HistoricoEventosProps {
  limit?: number;
  showFilters?: boolean;
}

export default function HistoricoEventos({ limit = 50, showFilters = true }: HistoricoEventosProps) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [origemFiltro, setOrigemFiltro] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventos();
  }, [tipoFiltro, origemFiltro, page]);

  async function fetchEventos() {
    setLoading(true);
    const params = new URLSearchParams();
    if (tipoFiltro) params.set('tipo', tipoFiltro);
    if (origemFiltro) params.set('origem', origemFiltro);
    params.set('page', String(page));
    params.set('limit', String(limit));

    const r = await fetch(`/api/eventos?${params}`);
    if (r.ok) {
      const d = await r.json();
      setEventos(d.eventos || []);
      setTotal(d.total || 0);
      setTotalPages(d.totalPages || 1);
    }
    setLoading(false);
  }

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDENTE: { label: 'Pendente', color: 'bg-amber-50 text-amber-600' },
    PROCESSANDO: { label: 'Processando', color: 'bg-sky-50 text-sky-600' },
    CONCLUIDO: { label: 'Concluído', color: 'bg-emerald-50 text-emerald-600' },
    FALHA: { label: 'Falha', color: 'bg-red-50 text-red-600' },
  };

  const TIPO_LABELS: Record<string, string> = {
    PEDIDO_CRIADO: 'Pedido criado',
    PEDIDO_EM_SEPARACAO: 'Pedido em separação',
    PEDIDO_PRONTO_RETIRADA: 'Pedido pronto',
    PEDIDO_RETIRADO: 'Pedido retirado',
    PEDIDO_CANCELADO: 'Pedido cancelado',
    VENDA_CRIADA: 'Venda realizada',
    VENDA_PAGA: 'Pagamento confirmado',
    VENDA_CANCELADA: 'Venda cancelada',
    OS_CRIADA: 'OS criada',
    OS_ATUALIZADA: 'OS atualizada',
    OS_ATRASADA: 'OS atrasada',
    OS_PRONTA: 'OS pronta',
    OS_FINALIZADA: 'OS finalizada',
    OS_PAGA: 'OS paga',
    ESTOQUE_CRITICO: 'Estoque crítico',
    ESTOQUE_ZERADO: 'Estoque zerado',
    TRANSFERENCIA_PENDENTE: 'Transferência pendente',
    TRANSFERENCIA_CONCLUIDA: 'Transferência concluída',
    FINANCEIRO_CONTA_VENCENDO: 'Conta vencendo',
    FINANCEIRO_CONTA_VENCIDA: 'Conta vencida',
    FINANCEIRO_PAGAMENTO_RECEBIDO: 'Pagamento recebido',
    GARANTIA_PROXIMA_VENCIMENTO: 'Garantia próxima vencimento',
    REVISAO_PROXIMA: 'Revisão próxima',
    MENSAGEM_RECEBIDA: 'Mensagem recebida',
    SISTEMA_ALERTA: 'Alerta do sistema',
    CLIENTE_CADASTRADO: 'Cliente cadastrado',
    CUPOM_USADO: 'Cupom utilizado',
    PRODUTO_NOVO: 'Produto novo',
  };

  return (
    <div>
      {showFilters && (
        <FiltroEventos
          tipoFiltro={tipoFiltro} onTipoChange={t => { setTipoFiltro(t); setPage(1); }}
          origemFiltro={origemFiltro} onOrigemChange={o => { setOrigemFiltro(o); setPage(1); }}
        />
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="mt-4">
          {eventos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-400">Nenhum evento encontrado</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="px-4 py-3">Evento</th>
                      <th className="px-4 py-3">Origem</th>
                      <th className="px-4 py-3">Entidade</th>
                      <th className="px-4 py-3 hidden md:table-cell">Usuário</th>
                      <th className="px-4 py-3 hidden md:table-cell">Data</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map((evt: any) => (
                      <tr key={evt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-700">{TIPO_LABELS[evt.tipo] || evt.tipo}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-slate-500">{evt.origem}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-slate-500">{evt.entidadeTipo}{evt.entidadeId ? ` #${evt.entidadeId}` : ''}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[11px] text-slate-500">{evt.usuario?.name || 'Sistema'}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[11px] text-slate-400">{new Date(evt.createdAt).toLocaleString('pt-BR')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600">
                            {evt.processado ? 'OK' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-2 py-1 text-xs rounded hover:bg-slate-100 disabled:opacity-30">←</button>
                  <span className="text-xs text-slate-400">{page}/{totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-2 py-1 text-xs rounded hover:bg-slate-100 disabled:opacity-30">→</button>
                </div>
              )}

              <p className="text-center text-[10px] text-slate-400 mt-2">{total} eventos registrados</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
