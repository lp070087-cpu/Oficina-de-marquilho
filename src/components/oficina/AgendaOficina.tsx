'use client';

import { useState, useEffect, useCallback } from 'react';

interface OS {
  id: string;
  numero: number;
  nomeCliente: string;
  modeloMoto: string;
  placaMoto?: string | null;
  dataAgendamento?: string | null;
  horaAgendamento?: string | null;
  previsaoEntrega?: string | null;
  status: string;
  statusPagamento?: string | null;
  mecanico?: { name: string } | null;
}

type Vista = 'diario' | 'semanal' | 'mensal';

export default function AgendaOficina() {
  const [vista, setVista] = useState<Vista>('diario');
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [mecanicoFiltro, setMecanicoFiltro] = useState('');
  const [mecanicos, setMecanicos] = useState<{ id: string; name: string }[]>([]);
  const [dataRef, setDataRef] = useState(new Date());

  const fetchOrdens = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/ordens');
      const data = await r.json();
      setOrdens(Array.isArray(data) ? data : []);
    } catch { setOrdens([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrdens();
    fetch('/api/mecanicos').then(r => r.json()).then(setMecanicos).catch(() => {});
  }, [fetchOrdens]);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const agendadas = ordens.filter(o => o.dataAgendamento && o.status !== 'FINALIZADA' && o.status !== 'CANCELADA');

  // Filtro por mecanico
  const filtradas = mecanicoFiltro
    ? agendadas.filter(o => o.mecanico?.name === mecanicoFiltro)
    : agendadas;

  // Agrupar por dia
  const dias: Record<string, OS[]> = {};
  filtradas.forEach(o => {
    const d = o.dataAgendamento!.slice(0, 10);
    if (!dias[d]) dias[d] = [];
    dias[d].push(o);
  });
  Object.values(dias).forEach(arr => arr.sort((a, b) => (a.horaAgendamento || '99:99').localeCompare(b.horaAgendamento || '99:99')));

  const sortedDias = Object.keys(dias).sort();

  const navegar = (dir: number) => {
    const d = new Date(dataRef);
    if (vista === 'diario') d.setDate(d.getDate() + dir);
    else if (vista === 'semanal') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setDataRef(d);
  };

  const tituloPeriodo = () => {
    if (vista === 'diario') return dataRef.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (vista === 'semanal') {
      const ini = new Date(dataRef);
      ini.setDate(ini.getDate() - ini.getDay());
      const fim = new Date(ini);
      fim.setDate(fim.getDate() + 6);
      return `${ini.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — ${fim.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const isHoje = (dateStr: string) => dateStr === hoje.toISOString().slice(0, 10);
  const statusBadge = (os: OS) => {
    if (os.statusPagamento === 'PAGO') return 'bg-emerald-100 text-emerald-700';
    if (os.statusPagamento === 'AGUARDANDO_PAGAMENTO') return 'bg-amber-100 text-amber-700';
    if (os.status === 'EM_ANDAMENTO') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Agenda da Oficina</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ordens agendadas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Vista toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {([['diario', 'Dia'], ['semanal', 'Semana'], ['mensal', 'Mês']] as [Vista, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setVista(k)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${vista === k ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
            ))}
          </div>
          {/* Navegacao */}
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => navegar(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[180px] text-center capitalize">{tituloPeriodo()}</span>
            <button onClick={() => navegar(1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
            <button onClick={() => setDataRef(new Date())} className="ml-2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-600 text-white hover:bg-brand-700">Hoje</button>
          </div>
        </div>
      </div>

      {/* Filtro mecanico */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0 flex items-center gap-3">
        <span className="text-[11px] font-semibold text-slate-500 uppercase">Mecânico:</span>
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setMecanicoFiltro('')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${!mecanicoFiltro ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Todos</button>
          {mecanicos.map(m => (
            <button key={m.id} onClick={() => setMecanicoFiltro(mecanicoFiltro === m.name ? '' : m.name)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${mecanicoFiltro === m.name ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{m.name}</button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-slate-400">{filtradas.length} OS agendadas</span>
      </div>

      {/* Conteudo */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : sortedDias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">Nenhuma OS agendada</p>
            <p className="text-xs text-slate-400 mt-1">As OS com data de agendamento aparecerao aqui</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDias.map(dia => {
              const osDoDia = dias[dia];
              const destaque = isHoje(dia);
              const dataObj = new Date(dia + 'T12:00:00');
              return (
                <div key={dia}>
                  <div className={`flex items-center gap-3 mb-3 ${destaque ? '' : ''}`}>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${destaque ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {dataObj.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {destaque && <span className="ml-2 text-[10px] opacity-80">HOJE</span>}
                    </div>
                    <div className="h-px flex-1 bg-slate-100"/>
                    <span className="text-[10px] text-slate-400">{osDoDia.length} OS</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {osDoDia.map(os => (
                      <div key={os.id} className={`p-4 rounded-xl border ${destaque ? 'border-brand-200 bg-brand-50/30' : 'border-slate-200 bg-white'} hover:shadow-sm transition-shadow cursor-pointer`}
                        onClick={() => window.location.href = `/balcao/ordens?os=${os.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-brand-600">OS #{os.numero}</span>
                          {os.horaAgendamento && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{os.horaAgendamento}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{os.nomeCliente}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{os.modeloMoto}{os.placaMoto ? ` • ${os.placaMoto}` : ''}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-slate-400">{os.mecanico?.name || 'Sem mecânico'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(os)}`}>
                            {os.statusPagamento === 'PAGO' ? 'Pago' : os.statusPagamento === 'AGUARDANDO_PAGAMENTO' ? 'Aguard. Pag.' : os.status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Aberta'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
