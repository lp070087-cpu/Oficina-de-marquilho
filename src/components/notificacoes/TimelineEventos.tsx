'use client';

interface Evento {
  id: string;
  tipo: string;
  origem: string;
  entidadeTipo: string;
  entidadeId?: string | null;
  processado: boolean;
  processadoEm?: string | null;
  createdAt: string;
  usuario?: { name: string; role: string } | null;
  payload?: string | null;
}

interface TimelineEventosProps {
  eventos: Evento[];
  loading?: boolean;
}

const LABELS: Record<string, string> = {
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
  GARANTIA_PROXIMA_VENCIMENTO: 'Garantia próxima do vencimento',
  REVISAO_PROXIMA: 'Revisão próxima',
  MENSAGEM_RECEBIDA: 'Mensagem recebida',
  SISTEMA_ALERTA: 'Alerta do sistema',
  CLIENTE_CADASTRADO: 'Cliente cadastrado',
  CUPOM_USADO: 'Cupom utilizado',
  PRODUTO_NOVO: 'Produto novo',
};

const CORES: Record<string, string> = {
  PEDIDO: 'border-l-brand-500',
  VENDA: 'border-l-emerald-500',
  OS: 'border-l-amber-500',
  ESTOQUE: 'border-l-red-500',
  FINANCEIRO: 'border-l-sky-500',
  SISTEMA: 'border-l-slate-400',
};

function getCor(tipo: string): string {
  for (const [prefix, cor] of Object.entries(CORES)) {
    if (tipo.startsWith(prefix)) return cor;
  }
  return 'border-l-slate-300';
}

export default function TimelineEventos({ eventos, loading }: TimelineEventosProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">Nenhum evento registrado</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Linha central */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200" />

      <div className="space-y-0">
        {eventos.map((evt, i) => (
          <div key={evt.id} className={`relative pl-12 pb-5 ${i === eventos.length - 1 ? '' : ''}`}>
            {/* Bolinha */}
            <div className={`absolute left-[12px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
              evt.processado ? 'border-emerald-400' : 'border-slate-300'
            }`} />

            <div className={`bg-white rounded-xl border border-l-2 ${getCor(evt.tipo)} border-slate-200 p-3`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">{LABELS[evt.tipo] || evt.tipo}</p>
                {!evt.processado && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-600 font-bold">Pendente</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                <span>{evt.origem}</span>
                <span>·</span>
                <span>{evt.entidadeTipo}{evt.entidadeId ? ` #${evt.entidadeId}` : ''}</span>
                {evt.usuario && <><span>·</span><span>{evt.usuario.name}</span></>}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{new Date(evt.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
