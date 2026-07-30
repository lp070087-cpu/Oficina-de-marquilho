'use client';

import { useState, useEffect, useCallback } from 'react';

interface MecanicoStat {
  nome: string;
  count: number;
  tempoMedioMinutos: number;
}

interface OSBasica {
  id: string;
  numero: string;
  nomeCliente: string;
  modeloMoto?: string;
  status: string;
  previsaoEntrega?: string | null;
  mecanico?: string | null;
  dias?: number;
  horas?: number;
}

interface OficinaKPIs {
  // Status counts
  abertas: number;
  emAndamento: number;
  aguardandoPecas: number;
  aguardandoMecanico: number;
  emServico: number;
  teste: number;
  lavagem: number;
  prontas: number;
  entregues: number;
  canceladas: number;
  aguardandoPagamento: number;
  totalMes: number;

  // Financeiro
  faturamentoMes: number;
  ticketMedio: number;
  finalizadasHoje: number;

  // Tempo
  tempoMedioMinutos: number;
  mecanicos: MecanicoStat[];

  // FASE 15-F.1
  atrasadas: OSBasica[];
  motosParadas: OSBasica[];
  servicoMaisVendido: [string, number][];
  agendadasHoje: any[];
  revisoesPendentes: any[];
}

const formatMin = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}min` : `${min}min`;
};

const STATUS_COR: Record<string, string> = {
  ABERTA: 'bg-sky-100 text-sky-700',
  EM_ANDAMENTO: 'bg-amber-100 text-amber-700',
  AGUARDANDO_PECAS: 'bg-orange-100 text-orange-700',
  AGUARDANDO_MECANICO: 'bg-violet-100 text-violet-700',
  EM_SERVICO: 'bg-blue-100 text-blue-700',
  TESTE: 'bg-indigo-100 text-indigo-700',
  LAVAGEM: 'bg-teal-100 text-teal-700',
  PRONTA: 'bg-emerald-100 text-emerald-700',
  ENTREGUE: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

export default function DashboardOficina() {
  const [data, setData] = useState<OficinaKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch('/api/dashboard/oficina');
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-slate-400">Erro ao carregar dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs principais — Status flow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        <KpiCard label="Recepção" value={data.abertas + data.aguardandoMecanico} color="bg-sky-50 border-sky-200" textColor="text-sky-700" />
        <KpiCard label="Em Serviço" value={data.emAndamento + data.emServico} color="bg-blue-50 border-blue-200" textColor="text-blue-700" />
        <KpiCard label="Aguard. Peças" value={data.aguardandoPecas} color="bg-orange-50 border-orange-200" textColor="text-orange-700" />
        <KpiCard label="Teste / Lavagem" value={(data.teste || 0) + (data.lavagem || 0)} color="bg-teal-50 border-teal-200" textColor="text-teal-700" />
        <KpiCard label={`Prontas (Entregar)`} value={data.prontas} color="bg-emerald-50 border-emerald-200" textColor="text-emerald-700" />
      </div>

      {/* Financeiro */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">OS no Mês</p>
          <p className="text-2xl font-black text-slate-800 mt-0.5">{data.totalMes}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">{data.entregues} entregues</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Tempo Médio</p>
          <p className="text-2xl font-black text-slate-800 mt-0.5">{formatMin(data.tempoMedioMinutos)}</p>
        </div>
      </div>

      {/* Linha 2: Aguardando pagamento + Canceladas + Finalizadas hoje */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-[10px] text-red-500 uppercase font-semibold">Aguard. Pagamento</p>
          <p className="text-xl font-black text-red-700 mt-1">{data.aguardandoPagamento}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Canceladas</p>
          <p className="text-xl font-black text-slate-600 mt-1">{data.canceladas}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-[10px] text-emerald-600 uppercase font-semibold">Finalizadas Hoje</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{data.finalizadasHoje}</p>
        </div>
      </div>

      {/* FASE 15-F.1: OS Atrasadas + Motos Paradas + Serviço + Mecânico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OS Atrasadas */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 className="text-xs font-bold text-slate-700">OS Atrasadas</h3>
            <span className="text-[10px] text-red-500 font-bold ml-auto">{data.atrasadas.length}</span>
          </div>
          {data.atrasadas.length === 0 ? (
            <p className="text-[11px] text-slate-400">Nenhuma OS com prazo vencido</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.atrasadas.slice(0, 5).map(os => (
                <div key={os.id} className="flex items-center justify-between p-2 bg-red-50/50 rounded-lg">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700">#{os.numero} {os.nomeCliente}</span>
                    {os.mecanico && <span className="text-[9px] text-slate-400 ml-1">({os.mecanico})</span>}
                  </div>
                  <span className="text-[9px] text-red-500 font-semibold">
                    {os.previsaoEntrega ? new Date(os.previsaoEntrega).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motos Paradas (mais antigas) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 className="text-xs font-bold text-slate-700">Motos Paradas</h3>
            <span className="text-[10px] text-slate-400 ml-auto">{data.motosParadas.length}</span>
          </div>
          {data.motosParadas.length === 0 ? (
            <p className="text-[11px] text-slate-400">Nenhuma moto parada</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.motosParadas.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-amber-50/30 rounded-lg">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700">#{m.numero} {m.nomeCliente}</span>
                    <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded ${STATUS_COR[m.status] || 'bg-slate-100 text-slate-500'}`}>
                      {m.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600">
                    {m.dias !== undefined && m.dias > 0 ? `${m.dias}d` : m.horas !== undefined ? `${m.horas}h` : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Serviço mais vendido + Top Mecânicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Serviço mais vendido */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
            <h3 className="text-xs font-bold text-slate-700">Serviço Mais Vendido</h3>
          </div>
          {data.servicoMaisVendido.length === 0 ? (
            <p className="text-[11px] text-slate-400">Nenhum serviço registrado este mês</p>
          ) : (
            <div className="space-y-2">
              {data.servicoMaisVendido.slice(0, 5).map(([nome, count], i) => {
                const maxCount = data.servicoMaisVendido[0][1];
                const pct = (count / maxCount) * 100;
                return (
                  <div key={nome}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-slate-600">{nome}</span>
                      <span className="text-[10px] font-bold text-violet-600">{count}x</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Mecânicos */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <h3 className="text-xs font-bold text-slate-700">Top Mecânicos (Mês)</h3>
          </div>
          <div className="space-y-2">
            {data.mecanicos.filter(m => m.count > 0).slice(0, 5).map((m, i) => (
              <div key={m.nome} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>
                  <span className="text-xs font-medium text-slate-700">{m.nome}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">{formatMin(m.tempoMedioMinutos)}/os</span>
                  <span className="text-xs font-bold text-brand-600">{m.count} OS</span>
                </div>
              </div>
            ))}
            {data.mecanicos.filter(m => m.count > 0).length === 0 && (
              <p className="text-xs text-slate-400">Nenhuma OS entregue este mês</p>
            )}
          </div>
        </div>
      </div>

      {/* Agendadas hoje */}
      {data.agendadasHoje.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <h3 className="text-xs font-bold text-slate-700">Agendadas para Hoje</h3>
            <span className="text-[10px] text-slate-400 ml-auto">{data.agendadasHoje.length} OS</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.agendadasHoje.map((os: any) => (
              <div key={os.id} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-xs">
                <span className="font-bold text-blue-700">#{os.numero}</span>
                <span className="text-slate-600">{os.nomeCliente}</span>
                {os.horaAgendamento && <span className="text-[10px] text-blue-500 font-semibold">{os.horaAgendamento}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) {
  return (
    <div className={`${color} rounded-xl p-3 border`}>
      <p className="text-[10px] text-slate-500 uppercase font-semibold">{label}</p>
      <p className={`text-2xl font-black ${textColor} mt-0.5`}>{value}</p>
    </div>
  );
}
