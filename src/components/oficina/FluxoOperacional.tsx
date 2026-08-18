'use client';

import { useState } from 'react';

interface FluxoOperacionalProps {
  osId: string;
  status: string;
  statusPagamento?: string | null;
  onAvancar: (novoStatus: string) => Promise<void>;
  onVoltar: (novoStatus: string) => Promise<void>;
}

const FLUXO = [
  { key: 'RECEPCAO', label: 'Recepção', step: 0, icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', desc: 'Moto recebida, cliente cadastrado' },
  { key: 'AGUARDANDO_MECANICO', label: 'Aguard. Mecânico', step: 1, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Na fila aguardando mecânico disponível' },
  { key: 'EM_SERVICO', label: 'Em Serviço', step: 2, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', desc: 'Mecânico trabalhando na moto' },
  { key: 'AGUARDANDO_PECAS', label: 'Aguard. Peças', step: 3, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', desc: 'Aguardando chegada de peças' },
  { key: 'TESTE', label: 'Teste', step: 4, icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'Teste de rodagem / verificação' },
  { key: 'PRONTA', label: 'Pronta', step: 5, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Serviço concluído, aguardando retirada' },
  { key: 'ENTREGUE', label: 'Entregue', step: 6, icon: 'M5 13l4 4L19 7', desc: 'Moto entregue ao cliente' },
];

// Mapeia status legados para o novo fluxo
function mapearStatus(status: string): string {
  const mapa: Record<string, string> = {
    'ABERTA': 'RECEPCAO',
    'EM_ANDAMENTO': 'EM_SERVICO',
    'CONCLUIDA': 'ENTREGUE',
  };
  return mapa[status] || status;
}

function getStepIndex(status: string): number {
  const mapped = mapearStatus(status);
  const found = FLUXO.find(f => f.key === mapped);
  return found ? found.step : 0;
}

export default function FluxoOperacional({ osId, status, statusPagamento, onAvancar, onVoltar }: FluxoOperacionalProps) {
  const [confirmacao, setConfirmacao] = useState<{ acao: 'avancar' | 'voltar'; key: string } | null>(null);
  const [executando, setExecutando] = useState(false);

  const currentIdx = getStepIndex(status);
  const isEntregue = status === 'ENTREGUE' || status === 'CONCLUIDA';
  const isCancelada = status === 'CANCELADA';

  function getEstado(key: string, step: number) {
    if (isCancelada && step > currentIdx) return 'cancelado';
    if (step < currentIdx) return 'concluido';
    if (step === currentIdx) return 'atual';
    return 'pendente';
  }

  async function executarAcao() {
    if (!confirmacao) return;
    setExecutando(true);
    const { acao, key } = confirmacao;
    if (acao === 'avancar') await onAvancar(key);
    else await onVoltar(key);
    setConfirmacao(null);
    setExecutando(false);
  }

  const podeAvancar = !isEntregue && !isCancelada;
  const podeVoltar = currentIdx > 0 && !isEntregue && !isCancelada;

  const proximoStatus = podeAvancar ? FLUXO[currentIdx + 1] : null;
  const anteriorStatus = podeVoltar ? FLUXO[currentIdx - 1] : null;

  return (
    <div className="space-y-6">
      {/* Timeline visual */}
      <div className="relative">
        {/* Linha de progresso */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 rounded-full hidden sm:block">
          {!isCancelada && (
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-700"
              style={{ width: `${(currentIdx / (FLUXO.length - 1)) * 100}%` }}
            />
          )}
        </div>

        {/* Steps */}
        <div className="flex flex-col sm:flex-row justify-between relative">
          {FLUXO.map((f, i) => {
            const estado = getEstado(f.key, i);
            return (
              <div key={f.key} className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 py-2">
                {/* Circle */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  estado === 'concluido' ? 'bg-emerald-500 border-emerald-500 text-white' :
                  estado === 'atual' ? 'bg-brand-600 border-brand-600 text-white ring-4 ring-brand-100' :
                  estado === 'cancelado' ? 'bg-red-100 border-red-200 text-red-400' :
                  'bg-white border-slate-300 text-slate-400'
                }`}>
                  {estado === 'concluido' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  ) : estado === 'atual' ? (
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon}/></svg>
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="text-center">
                  <p className={`text-[11px] font-semibold ${estado === 'atual' ? 'text-brand-700' : estado === 'concluido' ? 'text-emerald-700' : estado === 'cancelado' ? 'text-red-400' : 'text-slate-400'}`}>
                    {f.label}
                  </p>
                  {estado === 'atual' && (
                    <p className="text-[9px] text-slate-400 mt-0.5">{f.desc}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status atual destacado */}
      <div className={`rounded-xl border p-4 ${
        isEntregue ? 'bg-emerald-50 border-emerald-200' :
        isCancelada ? 'bg-red-50 border-red-200' :
        'bg-brand-50 border-brand-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isEntregue ? 'bg-emerald-500 text-white' : isCancelada ? 'bg-red-500 text-white' : 'bg-brand-600 text-white'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={FLUXO[currentIdx]?.icon || FLUXO[0].icon}/>
            </svg>
          </div>
          <div>
            <p className={`text-sm font-bold ${isEntregue ? 'text-emerald-800' : isCancelada ? 'text-red-800' : 'text-brand-800'}`}>
              {FLUXO[currentIdx]?.label || status}
            </p>
            <p className="text-[11px] text-slate-500">
              {isEntregue ? 'Moto entregue ao cliente. OS concluída.' :
               isCancelada ? 'OS cancelada.' :
               `Etapa ${currentIdx + 1} de ${FLUXO.length}`}
            </p>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center gap-3">
        {proximoStatus && (
          <button
            onClick={() => setConfirmacao({ acao: 'avancar', key: proximoStatus.key })}
            className="btn-primary text-xs px-4 py-2.5 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            Avançar para: {proximoStatus.label}
          </button>
        )}
        {anteriorStatus && (
          <button
            onClick={() => setConfirmacao({ acao: 'voltar', key: anteriorStatus.key })}
            className="btn-secondary text-xs px-4 py-2.5 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Voltar para: {anteriorStatus.label}
          </button>
        )}
      </div>

      {/* Modal de confirmação */}
      {confirmacao && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setConfirmacao(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                confirmacao.acao === 'avancar' ? 'bg-brand-100' : 'bg-amber-100'
              }`}>
                {confirmacao.acao === 'avancar' ? (
                  <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {confirmacao.acao === 'avancar' ? 'Avançar Status' : 'Voltar Status'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {confirmacao.acao === 'avancar'
                  ? `Confirmar avanço para "${FLUXO.find(f => f.key === confirmacao.key)?.label}"?`
                  : `Confirmar retorno para "${FLUXO.find(f => f.key === confirmacao.key)?.label}"?`
                }
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Esta ação será registrada no histórico da OS.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmacao(null)} className="btn-secondary flex-1 text-xs py-2.5">Cancelar</button>
              <button
                onClick={executarAcao}
                disabled={executando}
                className={`flex-1 text-xs py-2.5 rounded-xl font-bold text-white inline-flex items-center justify-center gap-2 ${
                  confirmacao.acao === 'avancar' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {executando ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Confirmando...</>
                ) : (
                  <>Sim, {confirmacao.acao === 'avancar' ? 'Avançar' : 'Voltar'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
