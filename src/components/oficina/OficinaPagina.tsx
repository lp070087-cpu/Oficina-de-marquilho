'use client';

import { useState, useEffect, useCallback } from 'react';
import AgendaOficina from './AgendaOficina';
import DashboardOficina from './DashboardOficina';
import ServicosTabelados from './ServicosTabelados';
import ChecklistInteligente from './ChecklistInteligente';
import FotosOS from './FotosOS';
import AssinaturaOS from './AssinaturaOS';
import HistoricoOS from './HistoricoOS';
import TempoServico from './TempoServico';
import GarantiaAutomatica from './GarantiaAutomatica';
import RevisoesAgendadas from './RevisoesAgendadas';
import WhatsAppPanel from './WhatsAppPanel';
import FluxoOperacional from './FluxoOperacional';
import ValidadorFinalizacao from './ValidadorFinalizacao';

type MainTab = 'dashboard' | 'agenda' | 'servicos' | 'detalhe';

// FASE 15-F.1: Abas da Ordem reorganizadas
type OrdemTab = 'resumo' | 'checklist' | 'fotos' | 'pecas' | 'servicos_os' | 'garantia' | 'historico' | 'revisoes';

interface OSData {
  id: string;
  numero: number;
  nomeCliente: string;
  telefoneCliente: string;
  modeloMoto: string;
  placaMoto?: string | null;
  anoMoto?: string | null;
  descricaoProblema?: string | null;
  diagnostico?: string | null;
  status: string;
  statusPagamento?: string | null;
  valorTotal: number;
  valorMaoDeObra: number;
  valorPago?: number | null;
  kmAtual?: string | null;
  dataAgendamento?: string | null;
  horaAgendamento?: string | null;
  previsaoEntrega?: string | null;
  tempoEstimado?: number | null;
  inicioServico?: string | null;
  fimServico?: string | null;
  garantiaDias?: number | null;
  garantiaAte?: string | null;
  mecanico?: { name: string } | null;
  balcao?: { name: string } | null;
  servicos?: { id: string; nome: string; valor: number }[];
  itens?: { id: string; peca?: { nome: string } | null; nome?: string; quantidade: number; precoUnitario: number }[];
}

const ORDEM_TABS: { key: OrdemTab; label: string; icon: string }[] = [
  { key: 'resumo', label: 'Resumo', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { key: 'checklist', label: 'Checklist', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'fotos', label: 'Fotos', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'pecas', label: 'Peças', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { key: 'servicos_os', label: 'Serviços', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'garantia', label: 'Garantia', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { key: 'historico', label: 'Histórico', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'revisoes', label: 'Revisões', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const STATUS_BADGE: Record<string, string> = {
  ABERTA: 'bg-sky-50 text-sky-700',
  RECEPCAO: 'bg-sky-50 text-sky-700',
  EM_ANDAMENTO: 'bg-amber-50 text-amber-700',
  AGUARDANDO_PECAS: 'bg-orange-50 text-orange-700',
  AGUARDANDO_MECANICO: 'bg-violet-50 text-violet-700',
  EM_SERVICO: 'bg-blue-50 text-blue-700',
  TESTE: 'bg-indigo-50 text-indigo-700',
  LAVAGEM: 'bg-teal-50 text-teal-700',
  PRONTA: 'bg-emerald-50 text-emerald-700',
  ENTREGUE: 'bg-green-50 text-green-700',
  CONCLUIDA: 'bg-green-50 text-green-700',
  FINALIZADA: 'bg-green-50 text-green-700',
  CANCELADA: 'bg-red-50 text-red-700',
};

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ');
}

export default function OficinaPagina() {
  const [mainTab, setMainTab] = useState<MainTab>('dashboard');
  const [ordens, setOrdens] = useState<OSData[]>([]);
  const [osAtiva, setOsAtiva] = useState<OSData | null>(null);
  const [loading, setLoading] = useState(false);
  const [ordemTab, setOrdemTab] = useState<OrdemTab>('resumo');
  const [tipoServico, setTipoServico] = useState<string | null>(null);

  const fetchOrdens = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/ordens');
      const data = await r.json();
      setOrdens(Array.isArray(data) ? data : []);
    } catch { setOrdens([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrdens(); }, [fetchOrdens]);

  async function abrirOS(os: OSData) {
    setLoading(true);
    try {
      const r = await fetch(`/api/ordens/${os.id}`);
      if (r.ok) {
        const data = await r.json();
        setOsAtiva(data);
        setMainTab('detalhe');
        setOrdemTab('resumo');
        // Extrai tipo de serviço para o checklist inteligente
        if (data.servicos && data.servicos.length > 0) {
          setTipoServico(data.servicos.map((s: any) => s.nome).join(', '));
        } else {
          setTipoServico(null);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  function voltarLista() {
    setOsAtiva(null);
    setMainTab('dashboard');
    fetchOrdens();
  }

  // FASE 15-F.1: Status change handler para FluxoOperacional
  async function handleAvancarStatus(novoStatus: string) {
    if (!osAtiva) return;
    try {
      await fetch(`/api/ordens/${osAtiva.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      // Refresh OS data
      abrirOS(osAtiva);
    } catch { /* ignore */ }
  }

  async function handleVoltarStatus(novoStatus: string) {
    if (!osAtiva) return;
    try {
      await fetch(`/api/ordens/${osAtiva.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus, motivo: 'Retorno manual de status' }),
      });
      abrirOS(osAtiva);
    } catch { /* ignore */ }
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ======= VIEW: Detalhe da OS (tab-based FASE 15-F.1) =======
  if (mainTab === 'detalhe' && osAtiva) {
    const servicos = osAtiva.servicos || [];
    const itensOS = osAtiva.itens || [];

    return (
      <div className="flex flex-col h-full">
        {/* Header do detalhe */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={voltarLista} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">OS #{osAtiva.numero} — {osAtiva.nomeCliente}</h1>
              <p className="text-xs text-slate-400">{osAtiva.modeloMoto}{osAtiva.placaMoto ? ` • ${osAtiva.placaMoto}` : ''}{osAtiva.anoMoto ? ` • ${osAtiva.anoMoto}` : ''} {osAtiva.mecanico?.name ? `• Mecânico: ${osAtiva.mecanico.name}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${STATUS_BADGE[osAtiva.status] || 'bg-slate-50 text-slate-600'}`}>
              {statusLabel(osAtiva.status)}
            </span>
            {osAtiva.statusPagamento && (
              <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${osAtiva.statusPagamento === 'PAGO' ? 'bg-emerald-50 text-emerald-700' :
                osAtiva.statusPagamento === 'PARCIAL' ? 'bg-amber-50 text-amber-700' : 'bg-amber-50 text-amber-700'}`}>
                {osAtiva.statusPagamento.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* FASE 15-F.1: Abas da Ordem reorganizadas */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-white flex-shrink-0 overflow-x-auto">
          {ORDEM_TABS.map(t => (
            <button key={t.key} onClick={() => setOrdemTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                ordemTab === t.key ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon}/>
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        {/* Info rápida */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0 flex items-center gap-6 text-xs flex-wrap">
          <span className="text-slate-500">KM: <strong className="text-slate-700">{osAtiva.kmAtual || '—'}</strong></span>
          <span className="text-slate-500">Agendamento: <strong className="text-slate-700">
            {osAtiva.dataAgendamento ? `${new Date(osAtiva.dataAgendamento).toLocaleDateString('pt-BR')} ${osAtiva.horaAgendamento || ''}` : '—'}
          </strong></span>
          <span className="text-slate-500">Previsão: <strong className="text-slate-700">
            {osAtiva.previsaoEntrega ? new Date(osAtiva.previsaoEntrega).toLocaleDateString('pt-BR') : '—'}
          </strong></span>
          <span className="text-slate-500">Total: <strong className="text-brand-700">{fm(Number(osAtiva.valorTotal) || 0)}</strong></span>
          <span className="text-slate-500">Tel: <strong className="text-slate-700">{osAtiva.telefoneCliente || '—'}</strong></span>
        </div>

        {/* Conteúdo da aba selecionada */}
        <div className="flex-1 overflow-auto p-6">
          {/* ABA: Resumo — Fluxo Visual + Validação + Assinatura */}
          {ordemTab === 'resumo' && (
            <div className="space-y-6 max-w-3xl">
              {/* Fluxo Visual da Oficina (FASE 15-F.1) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Fluxo Operacional</h3>
                <FluxoOperacional
                  osId={osAtiva.id}
                  status={osAtiva.status}
                  statusPagamento={osAtiva.statusPagamento}
                  onAvancar={handleAvancarStatus}
                  onVoltar={handleVoltarStatus}
                />
              </div>

              {/* Descrição / Diagnóstico */}
              {(osAtiva.descricaoProblema || osAtiva.diagnostico) && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  {osAtiva.descricaoProblema && (
                    <div className="mb-3">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Problema Relatado</p>
                      <p className="text-xs text-slate-700">{osAtiva.descricaoProblema}</p>
                    </div>
                  )}
                  {osAtiva.diagnostico && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Diagnóstico</p>
                      <p className="text-xs text-slate-700">{osAtiva.diagnostico}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Assinatura Digital */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Assinatura do Cliente</h3>
                <AssinaturaOS osId={osAtiva.id} />
              </div>

              {/* Tempo do Serviço */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Tempo do Serviço</h3>
                <TempoServico
                  osId={osAtiva.id}
                  tempoEstimado={osAtiva.tempoEstimado}
                  inicioServico={osAtiva.inicioServico}
                  fimServico={osAtiva.fimServico}
                  onUpdate={() => abrirOS(osAtiva)}
                />
              </div>

              {/* Validação de Finalização (FASE 15-F.1) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Validação para Finalização</h3>
                <ValidadorFinalizacao osId={osAtiva.id} onFinalizar={() => abrirOS(osAtiva)} />
              </div>

              {/* WhatsApp */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Comunicação WhatsApp</h3>
                <WhatsAppPanel osId={osAtiva.id} telefone={osAtiva.telefoneCliente} modeloMoto={osAtiva.modeloMoto} />
              </div>
            </div>
          )}

          {/* ABA: Checklist (FASE 15-F.1: Inteligente) */}
          {ordemTab === 'checklist' && (
            <div className="max-w-2xl">
              <ChecklistInteligente
                osId={osAtiva.id}
                tipoServico={tipoServico}
                servicoTabeladoId={undefined}
              />
            </div>
          )}

          {/* ABA: Fotos (FASE 15-F.1: Obrigatórias + Extras) */}
          {ordemTab === 'fotos' && (
            <div className="max-w-3xl">
              <FotosOS osId={osAtiva.id} />
            </div>
          )}

          {/* ABA: Peças */}
          {ordemTab === 'pecas' && (
            <div className="max-w-2xl">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Peças Utilizadas</h3>
                {itensOS.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    </div>
                    <p className="text-xs font-medium text-slate-500">Nenhuma peça registrada</p>
                    <p className="text-[10px] text-slate-400 mt-1">Adicione peças pelo módulo de Estoque ou PDV</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-semibold text-slate-500">Peça</th>
                          <th className="text-center py-2 font-semibold text-slate-500">Qtd</th>
                          <th className="text-right py-2 font-semibold text-slate-500">Unitário</th>
                          <th className="text-right py-2 font-semibold text-slate-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itensOS.map((item, i) => (
                          <tr key={item.id || i} className="border-b border-slate-100">
                            <td className="py-2.5 font-medium text-slate-700">{item.peca?.nome || item.nome || '-'}</td>
                            <td className="py-2.5 text-center text-slate-600">{item.quantidade}</td>
                            <td className="py-2.5 text-right text-slate-600">{fm(Number(item.precoUnitario) || 0)}</td>
                            <td className="py-2.5 text-right font-bold text-slate-800">{fm(Number(item.precoUnitario) * item.quantidade || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA: Serviços da OS */}
          {ordemTab === 'servicos_os' && (
            <div className="max-w-2xl">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Serviços da OS</h3>
                {servicos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <p className="text-xs font-medium text-slate-500">Nenhum serviço registrado</p>
                    <p className="text-[10px] text-slate-400 mt-1">Adicione serviços pela aba "Serviços Tabelados"</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-semibold text-slate-500">Serviço</th>
                          <th className="text-right py-2 font-semibold text-slate-500">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicos.map((s, i) => (
                          <tr key={s.id || i} className="border-b border-slate-100">
                            <td className="py-2.5 font-medium text-slate-700">{s.nome}</td>
                            <td className="py-2.5 text-right text-slate-600">{fm(Number(s.valor) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200">
                          <td className="py-2.5 text-right font-bold text-slate-600">Total Serviços</td>
                          <td className="py-2.5 text-right font-black text-brand-700 text-sm">{fm(servicos.reduce((sum, s) => sum + Number(s.valor || 0), 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA: Garantia (FASE 15-F.1: Automática) */}
          {ordemTab === 'garantia' && (
            <div className="max-w-xl">
              <GarantiaAutomatica
                osId={osAtiva.id}
                numeroOS={String(osAtiva.numero)}
                garantiaDias={osAtiva.garantiaDias}
                garantiaAte={osAtiva.garantiaAte}
                dataConclusao={osAtiva.fimServico || undefined}
                readOnly={osAtiva.status === 'ENTREGUE' || osAtiva.status === 'CANCELADA'}
              />
            </div>
          )}

          {/* ABA: Histórico */}
          {ordemTab === 'historico' && (
            <div className="max-w-xl">
              <HistoricoOS osId={osAtiva.id} />
            </div>
          )}

          {/* ABA: Revisões */}
          {ordemTab === 'revisoes' && (
            <div className="max-w-xl">
              <RevisoesAgendadas osId={osAtiva.id} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ======= VIEW: Tabs principais (Dashboard / Agenda / Serviços) =======
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Oficina Premium</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Gestão completa da oficina</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          {[
            { key: 'dashboard' as MainTab, label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
            { key: 'agenda' as MainTab, label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { key: 'servicos' as MainTab, label: 'Serviços', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          ].map(t => (
            <button key={t.key} onClick={() => setMainTab(t.key)}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                mainTab === t.key ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon}/>
              </svg>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da tab principal */}
      <div className="flex-1 overflow-auto">
        {mainTab === 'dashboard' && (
          <div className="p-6">
            <DashboardOficina />
          </div>
        )}
        {mainTab === 'agenda' && <AgendaOficina />}
        {mainTab === 'servicos' && (
          <div className="p-6 max-w-4xl">
            <h2 className="text-base font-bold text-slate-800 mb-4">Serviços Tabelados</h2>
            <ServicosTabelados />
          </div>
        )}
      </div>

      {/* Lista rápida de OS recentes */}
      {mainTab === 'dashboard' && (
        <div className="border-t border-slate-200 px-6 py-4 bg-white overflow-auto max-h-[350px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700">Ordens de Serviço Recentes</h3>
            <span className="text-[10px] text-slate-400">{ordens.length} OS</span>
          </div>
          <div className="space-y-1">
            {loading ? (
              <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>
            ) : ordens.slice(0, 30).map(os => (
              <div key={os.id} onClick={() => abrirOS(os)}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-600 w-14">#{os.numero}</span>
                  <div>
                    <p className="text-xs font-medium text-slate-700">{os.nomeCliente}</p>
                    <p className="text-[10px] text-slate-400">{os.modeloMoto}{os.placaMoto ? ` • ${os.placaMoto}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[os.status] || 'bg-slate-50 text-slate-600'}`}>
                    {statusLabel(os.status)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">{fm(Number(os.valorTotal) || 0)}</span>
                  <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
