'use client';
import React from 'react';

export function CentralPanel({ ctx }: { ctx: any }) {
    const {
    acoesIAFaria,
    addMsg,
    centralEventos,
    centralOperacionalAberto,
    dashboardData,
    executandoAcao,
    mapaSaudeEstoque,
    painelProdutividade,
    planoDoDia,
    recomendacoesAutomaticas,
    resumoExecutivoOficina,
    setExecutandoAcao,
    simuladorDecisoes
  } = ctx;

  return (<>
        {/* CENTRAL OPERACIONAL (FASE 10) */}
        {/* ================================================================ */}
        {centralOperacionalAberto && dashboardData && (
          <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50/20 animate-in fade-in duration-300">
            <div className="max-h-[420px] overflow-y-auto">
              <div className="px-4 py-4"><div className="max-w-5xl mx-auto space-y-4">

                {/* LINHA 1: O QUE A IA FARIA AGORA + PLANO DO DIA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* O QUE A IA FARIA AGORA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center text-xs">🤖</span>O QUE A IA FARIA AGORA
                    </p>
                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                      {acoesIAFaria.map((a: any) => (
                        <div key={a.id} className={`flex items-center gap-2 p-2 rounded-lg border ${a.bg} ${a.border} border-l-2 hover:shadow-sm transition-all duration-200`}>
                          <span className="text-sm flex-shrink-0">{a.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-semibold ${a.cor} truncate`}>{a.descricao}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[8px] font-bold px-1 rounded ${a.prioridade === 'Crítica' ? 'bg-red-100 text-red-600' : a.prioridade === 'Alta' ? 'bg-amber-100 text-amber-600' : 'bg-yellow-100 text-yellow-600'}`}>⚡{a.prioridade}</span>
                              <span className="text-[8px] text-slate-400">{a.impacto} impacto</span>
                              <span className="text-[8px] text-slate-400">⏱ {a.tempo}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => { setExecutandoAcao(a.id); setTimeout(() => { setExecutandoAcao(null); addMsg(`✅ "${a.descricao}" — ação simulada com sucesso.`, 'assistant'); }, 700); }}
                            disabled={executandoAcao === a.id}
                            className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 border ${a.cor} ${a.bg} hover:scale-105 disabled:opacity-50 disabled:cursor-wait`}>
                            {executandoAcao === a.id ? '...' : 'Executar'}
                          </button>
                        </div>
                      ))}
                      {acoesIAFaria.length === 0 && <p className="text-[10px] text-emerald-600 py-2">✅ Nenhuma ação pendente — estoque em ordem!</p>}
                    </div>
                  </div>

                  {/* PLANO DO DIA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-xs">🗓️</span>PLANO DO DIA
                    </p>
                    <div className="space-y-0">
                      {planoDoDia.map((p: any, i: any) => (
                        <div key={i} className="flex items-start gap-2 relative pl-7 pb-2.5 last:pb-0">
                          {i < planoDoDia.length - 1 && <div className="absolute left-[14px] top-5 bottom-0 w-px bg-slate-200" />}
                          <span className="absolute left-0 top-0.5 text-[8px] font-bold text-slate-400 bg-slate-50 px-1 rounded w-[26px] text-center flex-shrink-0">{p.hora}</span>
                          <div className="flex-1 min-w-0 bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                            <p className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                              <span className="text-xs">{p.icon}</span>{p.tarefa}
                            </p>
                            <p className={`text-[9px] ${p.cor} mt-0.5`}>{p.detalhe}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LINHA 2: MAPA DE SAÚDE + SIMULADOR DE DECISÕES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* MAPA DE SAÚDE DO ESTOQUE */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-xs">💚</span>MAPA DE SAÚDE DO ESTOQUE
                    </p>
                    <div className="space-y-2">
                      {mapaSaudeEstoque.map((m: any, i: any) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                              <span className="text-xs">{m.icon}</span>{m.label}
                            </span>
                            <span className={`text-[10px] font-bold ${m.pct >= 85 ? 'text-emerald-600' : m.pct >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{m.pct}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${m.cor} transition-all duration-700 ease-out`} style={{ width: `${m.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SIMULADOR DE DECISÕES */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">🧪</span>SIMULADOR DE DECISÕES
                    </p>
                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                      {simuladorDecisoes.map((s: any, i: any) => (
                        <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${s.bg} border-slate-200 hover:shadow-sm transition-shadow duration-200`}>
                          <span className="text-sm flex-shrink-0 mt-0.5">{s.icon}</span>
                          <div>
                            <p className={`text-[10px] leading-relaxed ${s.cor}`}>{s.texto}</p>
                            <span className={`text-[8px] font-semibold mt-0.5 inline-block px-1 rounded ${s.impacto === 'Alto' ? 'bg-red-100 text-red-600' : s.impacto === 'Médio' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>Impacto: {s.impacto}</span>
                          </div>
                        </div>
                      ))}
                      {simuladorDecisoes.length === 0 && <p className="text-[10px] text-slate-400 py-2">Nenhuma simulação disponível no momento.</p>}
                    </div>
                  </div>
                </div>

                {/* LINHA 3: RECOMENDAÇÕES AUTOMÁTICAS */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-xs">💬</span>RECOMENDAÇÕES AUTOMÁTICAS
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {[
                      { titulo: 'Financeiro', icon: '💰', cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', items: recomendacoesAutomaticas.financeiro },
                      { titulo: 'Operacional', icon: '⚙️', cor: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', items: recomendacoesAutomaticas.operacional },
                      { titulo: 'Organização', icon: '🗂️', cor: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', items: recomendacoesAutomaticas.organizacao },
                      { titulo: 'Compras', icon: '🛒', cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', items: recomendacoesAutomaticas.compras },
                      { titulo: 'Cadastro', icon: '📝', cor: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', items: recomendacoesAutomaticas.cadastro },
                    ].map((grupo, gi) => (
                      <div key={gi} className={`rounded-xl border ${grupo.border} ${grupo.bg} p-2.5`}>
                        <p className={`text-[10px] font-bold ${grupo.cor} flex items-center gap-1 mb-1.5`}>
                          <span className="text-xs">{grupo.icon}</span>{grupo.titulo}
                        </p>
                        {grupo.items.length > 0 ? (
                          <div className="space-y-1.5">
                            {grupo.items.map((rec: any, ri: any) => (
                              <div key={ri} className="border-t border-white/50 pt-1 first:border-0 first:pt-0">
                                <p className="text-[9px] text-slate-600 leading-relaxed">{rec.descricao}</p>
                                <span className="text-[8px] font-semibold text-slate-400 mt-0.5 block">✨ {rec.beneficio}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-400">Nenhuma recomendação.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* LINHA 4: PAINEL DE PRODUTIVIDADE + CENTRAL DE EVENTOS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* PAINEL DE PRODUTIVIDADE */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-xs">⚡</span>PAINEL DE PRODUTIVIDADE
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {painelProdutividade.map((pp: any, i: any) => (
                        <div key={i} className={`${pp.bg} rounded-lg p-2 border border-slate-100 hover:shadow-sm transition-shadow duration-200`}>
                          <span className="text-sm">{pp.icon}</span>
                          <p className={`text-sm font-bold ${pp.cor} mt-0.5`}>{pp.valor}</p>
                          <p className="text-[9px] text-slate-500 leading-tight">{pp.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CENTRAL DE EVENTOS */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-xs">📡</span>CENTRAL DE EVENTOS
                    </p>
                    <div className="space-y-0 max-h-[200px] overflow-y-auto">
                      {centralEventos.map((ev: any, i: any) => (
                        <div key={i} className="flex items-center gap-2 relative pl-8 pb-2 last:pb-0">
                          {i < centralEventos.length - 1 && <div className="absolute left-[11px] top-4 bottom-0 w-px bg-slate-200" />}
                          <span className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center text-[9px] ${ev.bg} ${ev.cor} flex-shrink-0 shadow-sm`}>{ev.icon}</span>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400">{ev.hora}</span>
                            <p className="text-[10px] text-slate-600 leading-snug">{ev.texto}</p>
                          </div>
                        </div>
                      ))}
                      {centralEventos.length === 0 && <p className="text-[10px] text-slate-400 py-2">Nenhum evento registrado ainda.</p>}
                    </div>
                  </div>
                </div>

                {/* LINHA 5: RESUMO EXECUTIVO DA OFICINA */}
                {resumoExecutivoOficina && (
                  <div className="bg-gradient-to-r from-cyan-50 to-white rounded-xl border border-cyan-200 p-3.5">
                    <p className="text-[11px] font-bold text-cyan-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center text-xs">📝</span>RESUMO EXECUTIVO DA OFICINA
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{resumoExecutivoOficina}</p>
                  </div>
                )}

              </div></div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
  </>);
}
