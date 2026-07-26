'use client';
import React from 'react';

export function AutomacaoPanel({ ctx }: { ctx: any }) {
    const {
    assistenteAuditoria,
    automacaoAberto,
    centroProdutividade,
    dashboardData,
    filaProcessos,
    iaOrganizacao,
    iaPensandoSteps,
    planejadorReposicao,
    rotinaInteligente,
    setFilaProcessos,
    setTarefaEmExecucao,
    setTarefasIA,
    tarefasIA
  } = ctx;

  return (<>
        {/* AUTOMAÇÃO INTELIGENTE (FASE 12) */}
        {/* ================================================================ */}
        {automacaoAberto && dashboardData && (
          <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 animate-in fade-in duration-300">
            <div className="max-h-[420px] overflow-y-auto">
              <div className="px-4 py-4"><div className="max-w-5xl mx-auto space-y-4">

                {/* LINHA 1: CENTRAL DE TAREFAS + ROTINA INTELIGENTE */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                  {/* CENTRAL DE TAREFAS (3 colunas) */}
                  <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">📋</span>CENTRAL DE TAREFAS DA IA
                    </p>
                    <div className="space-y-1 max-h-[260px] overflow-y-auto">
                      {tarefasIA.map((t: any) => (
                        <div key={t.id} className={`flex items-center gap-2 p-2 rounded-lg border-l-2 ${t.cor} border border-slate-100 ${t.status === 'concluida' ? 'bg-emerald-50/50 opacity-60' : t.status === 'ignorada' ? 'bg-slate-50 opacity-50' : t.status === 'executando' ? 'bg-amber-50 border-amber-200' : 'bg-white'} hover:shadow-sm transition-all duration-200`}>
                          <span className="text-sm flex-shrink-0">{t.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-medium truncate ${t.status === 'concluida' ? 'text-slate-400 line-through' : t.status === 'ignorada' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.texto}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[7px] font-bold px-1 rounded ${t.prioridade === 'Crítica' ? 'bg-red-100 text-red-600' : t.prioridade === 'Alta' ? 'bg-amber-100 text-amber-600' : 'bg-yellow-100 text-yellow-600'}`}>⚡{t.prioridade}</span>
                              <span className="text-[7px] text-slate-400">⏱ {t.tempo}</span>
                              <span className="text-[7px] text-slate-400">🧩 {t.dificuldade}</span>
                              <span className="text-[7px] text-slate-400">📁 {t.categoria}</span>
                            </div>
                          </div>
                          {t.status === 'pendente' && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => { setTarefaEmExecucao(t.id); setTarefasIA((prev: any) => prev.map((ti: any) => ti.id === t.id ? { ...ti, status: 'executando' } : ti)); setTimeout(() => { setTarefasIA((prev: any) => prev.map((ti: any) => ti.id === t.id ? { ...ti, status: 'concluida' } : ti)); setTarefaEmExecucao(null); setFilaProcessos((prev: any) => [...prev, { id: `proc-${Date.now()}`, texto: t.texto, status: 'concluido', icon: '✅' }].slice(-8)); }, 1200); }}
                                className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-all">
                                Executar
                              </button>
                              <button onClick={() => setTarefasIA((prev: any) => prev.map((ti: any) => ti.id === t.id ? { ...ti, status: 'ignorada' } : ti))}
                                className="px-2 py-1 rounded-lg text-[9px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                                Ignorar
                              </button>
                            </div>
                          )}
                          {t.status === 'executando' && <span className="text-[9px] font-bold text-amber-600 animate-pulse flex-shrink-0">⏳...</span>}
                          {t.status === 'concluida' && <span className="text-[9px] font-bold text-emerald-600 flex-shrink-0">✓</span>}
                          {t.status === 'ignorada' && <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">—</span>}
                        </div>
                      ))}
                      {tarefasIA.length === 0 && <p className="text-[10px] text-slate-400 py-2">Nenhuma tarefa pendente — estoque em ordem!</p>}
                    </div>
                    {/* Resumo */}
                    {tarefasIA.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-3 text-[9px]">
                        <span className="text-slate-500">{tarefasIA.filter((t: any) => t.status === 'pendente').length} pendente(s)</span>
                        <span className="text-amber-500">{tarefasIA.filter((t: any) => t.status === 'executando').length} executando</span>
                        <span className="text-emerald-500">{tarefasIA.filter((t: any) => t.status === 'concluida').length} concluída(s)</span>
                        <span className="text-slate-400">{tarefasIA.filter((t: any) => t.status === 'ignorada').length} ignorada(s)</span>
                      </div>
                    )}
                  </div>

                  {/* ROTINA INTELIGENTE (2 colunas) */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-xs">🕐</span>ROTINA INTELIGENTE
                    </p>
                    <div className="space-y-0">
                      {rotinaInteligente.map((r: any, i: any) => (
                        <div key={i} className="flex items-start gap-2 relative pl-8 pb-2 last:pb-0">
                          {i < rotinaInteligente.length - 1 && <div className="absolute left-[11px] top-4 bottom-0 w-px bg-slate-200" />}
                          <span className="absolute left-0 top-1 text-[8px] font-bold text-slate-400 bg-amber-50 px-1 rounded w-[24px] text-center">{r.hora}</span>
                          <div className="flex-1 min-w-0 bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                            <p className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                              <span className="text-xs">{r.icon}</span>{r.tarefa}
                            </p>
                            <p className={`text-[8px] ${r.cor} mt-0.5`}>{r.detalhe}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LINHA 2: FILA DE EXECUÇÃO + IA PENSANDO */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* FILA DE EXECUÇÃO */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-xs">⚙️</span>FILA DE EXECUÇÃO
                    </p>
                    <div className="space-y-1 max-h-[180px] overflow-y-auto">
                      {filaProcessos.length > 0 ? filaProcessos.map((f: any) => (
                        <div key={f.id} className={`flex items-center gap-2 p-2 rounded-lg border border-slate-100 transition-all duration-300 ${f.status === 'processando' ? 'bg-amber-50 border-amber-200 animate-pulse' : f.status === 'concluido' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50'}`}>
                          <span className="text-sm">{f.icon}</span>
                          <p className="text-[10px] text-slate-700 font-medium flex-1 truncate">{f.texto}</p>
                          <span className={`text-[9px] font-bold flex-shrink-0 ${f.status === 'processando' ? 'text-amber-600' : f.status === 'concluido' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {f.status === 'fila' ? 'Na fila' : f.status === 'processando' ? 'Executando...' : 'Concluído ✓'}
                          </span>
                        </div>
                      )) : (
                        <div className="text-center py-4">
                          <p className="text-[10px] text-slate-400">Nenhum processo na fila.</p>
                          <p className="text-[9px] text-slate-300 mt-0.5">Execute tarefas para preencher.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* IA PENSANDO */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-xs">🧠</span>IA PENSANDO
                    </p>
                    <div className="space-y-0 relative pl-6">
                      <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-violet-200 rounded-full" />
                      {iaPensandoSteps.map((step: any, i: any) => (
                        <div key={i} className={`relative pb-2 last:pb-0 opacity-${i <= iaPensandoSteps.length - 1 ? '100' : '30'}`}>
                          <div className={`absolute left-[-18px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${i < iaPensandoSteps.length - 1 ? 'bg-violet-400' : 'bg-emerald-400'} flex-shrink-0`} />
                          <p className={`text-[10px] leading-relaxed ${i < iaPensandoSteps.length - 1 ? 'text-slate-600' : 'text-emerald-700 font-semibold'}`}>
                            <span className="mr-1">{step.icon}</span>{step.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LINHA 3: PLANEJADOR DE REPOSIÇÃO + IA DE ORGANIZAÇÃO */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* PLANEJADOR DE REPOSIÇÃO */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-xs">🛒</span>PLANEJADOR DE REPOSIÇÃO
                    </p>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                      {planejadorReposicao.map((pr: any, i: any) => (
                        <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${pr.bg} border-slate-200 hover:shadow-sm transition-shadow`}>
                          <span className="text-sm flex-shrink-0 mt-0.5">{pr.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-slate-700 truncate">{pr.oque}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[8px] font-bold text-slate-500">Qtd: {pr.quanto > 0 ? `${pr.quanto} un.` : '—'}</span>
                              <span className="text-[8px] text-slate-400">{pr.categoria}</span>
                              <span className={`text-[7px] font-bold px-1 rounded ${pr.urgencia === 'Urgente' ? 'bg-red-100 text-red-600' : pr.urgencia === 'Alta' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{pr.urgencia}</span>
                              <span className={`text-[7px] px-1 rounded ${pr.impacto === 'Alto' ? 'bg-red-50 text-red-600' : pr.impacto === 'Médio' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>{pr.impacto} impacto</span>
                            </div>
                            <p className="text-[8px] text-slate-400 mt-0.5">{pr.motivo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* IA DE ORGANIZAÇÃO */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">🗂️</span>IA DE ORGANIZAÇÃO
                    </p>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                      {iaOrganizacao.map((s: any, i: any) => (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${s.bg} border-slate-200 hover:shadow-sm transition-shadow`}>
                          <span className="text-sm flex-shrink-0">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-medium ${s.cor}`}>{s.acao}</p>
                            <p className="text-[9px] text-slate-500">{s.texto}</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">💡 {s.motivo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LINHA 4: ASSISTENTE DE AUDITORIA + CENTRO DE PRODUTIVIDADE */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* ASSISTENTE DE AUDITORIA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-xs">🔎</span>ASSISTENTE DE AUDITORIA
                    </p>
                    <div className="space-y-1 max-h-[220px] overflow-y-auto">
                      <div className="grid grid-cols-[2fr_1fr_1fr] gap-1 px-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-tight border-b border-slate-100 pb-1 mb-1">
                        <span>Problema</span><span>Qtd</span><span>Severidade</span>
                      </div>
                      {assistenteAuditoria.map((a: any, i: any) => (
                        <div key={i} className={`grid grid-cols-[2fr_1fr_1fr] gap-1 px-1.5 py-1 rounded-md ${a.bg} border border-slate-50 items-center`}>
                          <span className="text-[10px] text-slate-700 font-medium flex items-center gap-1 truncate">
                            <span className="text-xs">{a.icon}</span>{a.problema}
                          </span>
                          <span className={`text-[10px] font-bold ${a.qtd > 0 ? a.cor : 'text-slate-400'}`}>{a.qtd}</span>
                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full text-center ${a.severidade === 'Crítica' ? 'bg-red-100 text-red-600' : a.severidade === 'Alta' ? 'bg-orange-100 text-orange-600' : a.severidade === 'Média' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{a.severidade}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CENTRO DE PRODUTIVIDADE */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center text-xs">📈</span>CENTRO DE PRODUTIVIDADE
                    </p>
                    <div className="space-y-2">
                      {centroProdutividade.map((cp: any, i: any) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                              <span className="text-xs">{cp.icon}</span>{cp.label}
                            </span>
                            <span className={`text-[10px] font-bold ${cp.cor}`}>{cp.valor}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ease-out ${cp.pct >= 80 ? 'bg-emerald-500' : cp.pct >= 50 ? 'bg-blue-500' : cp.pct >= 30 ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: `${cp.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div></div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
  </>);
}
