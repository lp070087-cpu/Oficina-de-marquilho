'use client';
import React from 'react';

export function CopilotoPanel({ ctx }: { ctx: any }) {
    const {
    centralDecisoes,
    copilotoAberto,
    copilotoInput,
    copilotoResposta,
    dashboardData,
    diagnosticGeral,
    iaObservando,
    input,
    insightsPremium,
    memoriaIA,
    missaoConcluindo,
    missoesDia,
    rankingEficiencia,
    resumoDoDia,
    setCopilotoInput,
    setCopilotoResposta,
    setMissaoConcluindo,
    setMissoesDia,
    simulacoesRespostas,
    statusIACopiloto
  } = ctx;

  return (<>
        {/* COPILOTO EXECUTIVO (FASE 11) */}
        {/* ================================================================ */}
        {copilotoAberto && dashboardData && (
          <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/20 animate-in fade-in duration-300">
            <div className="max-h-[420px] overflow-y-auto">
              <div className="px-4 py-4"><div className="max-w-5xl mx-auto space-y-4">

                {/* LINHA 1: RESUMO DO DIA */}
                <div className="bg-gradient-to-r from-teal-50 via-white to-emerald-50 rounded-xl border border-teal-200 p-4">
                  <p className="text-[11px] font-bold text-teal-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-xs">📰</span>RESUMO DO DIA
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">{resumoDoDia}</p>
                </div>

                {/* LINHA 2: PERGUNTE AO SEU GERENTE + DIAGNÓSTICO GERAL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* PERGUNTE AO SEU GERENTE — Conversa Natural */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-xs">💬</span>PERGUNTE AO SEU GERENTE
                    </p>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={copilotoInput}
                        onChange={e => setCopilotoInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && copilotoInput.trim()) { setCopilotoResposta(simulacoesRespostas(copilotoInput)); setCopilotoInput(''); } }}
                        placeholder='Ex: "O que você acha do estoque?" ou "Qual categoria merece atenção?"'
                        className="flex-1 text-[10px] px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 focus:bg-white placeholder:text-slate-400 transition-all"
                      />
                      <button
                        onClick={() => { if (copilotoInput.trim()) { setCopilotoResposta(simulacoesRespostas(copilotoInput)); setCopilotoInput(''); } }}
                        disabled={!copilotoInput.trim()}
                        className="px-3 py-2 rounded-lg bg-teal-600 text-white text-[10px] font-semibold hover:bg-teal-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
                        Enviar
                      </button>
                    </div>
                    {/* Exemplos rápidos */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {['O que você acha?', 'Qual categoria merece atenção?', 'Como está o estoque?', 'O que melhorar?'].map(ex => (
                        <button key={ex} onClick={() => setCopilotoResposta(simulacoesRespostas(ex))}
                          className="text-[9px] px-2 py-1 rounded-full border border-slate-200 text-slate-500 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-all">
                          {ex}
                        </button>
                      ))}
                    </div>
                    {/* Resposta */}
                    {copilotoResposta && (
                      <div className="bg-teal-50 rounded-xl border border-teal-200 p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{copilotoResposta.icon}</span>
                          <p className="text-[10px] text-slate-700 leading-relaxed">{copilotoResposta.resposta}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DIAGNÓSTICO GERAL */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-xs">🩺</span>DIAGNÓSTICO GERAL
                    </p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke={diagnosticGeral.corBarra} strokeWidth="8"
                            strokeDasharray={`${(diagnosticGeral.nota / 100) * 238.8} 238.8`}
                            strokeLinecap="round" className="transition-all duration-700 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-lg font-bold ${diagnosticGeral.cor}`}>{diagnosticGeral.nota}</span>
                          <span className={`text-[8px] font-bold ${diagnosticGeral.cor}`}>{diagnosticGeral.nivel}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1 max-h-[120px] overflow-y-auto">
                        {diagnosticGeral.justificativas.slice(0, 5).map((j: any, i: any) => (
                          <p key={i} className="text-[9px] text-slate-600 leading-snug">{j}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* LINHA 3: RANKING DE EFICIÊNCIA + MISSÕES DO DIA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* RANKING DE EFICIÊNCIA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">🏅</span>RANKING DE EFICIÊNCIA
                    </p>
                    <div className="space-y-1.5">
                      {rankingEficiencia.map((r: any, i: any) => (
                        <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg ${r.bg} border border-slate-100 hover:shadow-sm transition-shadow`}>
                          <span className="text-lg flex-shrink-0">{r.medalha}</span>
                          <span className="text-xs flex-shrink-0">{r.icon}</span>
                          <span className="text-[10px] font-medium text-slate-700 flex-1">{r.area}</span>
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                            <div className={`h-full rounded-full transition-all duration-500 ${r.pct >= 90 ? 'bg-amber-400' : r.pct >= 75 ? 'bg-emerald-500' : r.pct >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${r.cor} w-8 text-right flex-shrink-0`}>{r.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MISSÕES DO DIA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-xs">🎯</span>MISSÕES DO DIA
                    </p>
                    <div className="space-y-1">
                      {missoesDia.map((m: any) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            if (!m.concluida) { setMissaoConcluindo(m.id); setTimeout(() => { setMissoesDia((prev: any) => prev.map((mi: any) => mi.id === m.id ? { ...mi, concluida: true } : mi)); setMissaoConcluindo(null); }, 600); }
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg border-l-2 ${m.cor} transition-all duration-300 text-left ${m.concluida ? 'bg-emerald-50 border-emerald-200 opacity-70' : 'bg-white border-slate-100 hover:border-teal-200 hover:bg-teal-50'}`}>
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${m.concluida ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'} ${missaoConcluindo === m.id ? 'animate-bounce bg-teal-500 border-teal-500' : ''}`}>
                            {m.concluida ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> : <span className="text-[7px] text-slate-400">{m.icon}</span>}
                          </span>
                          <span className={`text-[10px] font-medium transition-all duration-300 ${m.concluida ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{m.texto}</span>
                          {m.concluida && <span className="ml-auto text-[9px] text-emerald-600 font-bold">Concluída!</span>}
                          {missaoConcluindo === m.id && <span className="ml-auto text-[9px] text-teal-600 font-bold animate-pulse">...✓</span>}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${missoesDia.length > 0 ? Math.round((missoesDia.filter((m: any) => m.concluida).length / missoesDia.length) * 100) : 0}%` }} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500">{missoesDia.filter((m: any) => m.concluida).length}/{missoesDia.length}</span>
                    </div>
                  </div>
                </div>

                {/* LINHA 4: INSIGHTS PREMIUM + CENTRAL DE DECISÕES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* INSIGHTS PREMIUM */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-xs">✨</span>INSIGHTS PREMIUM
                    </p>
                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                      {insightsPremium.map((ins: any, i: any) => (
                        <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${ins.bg} border-slate-200 hover:shadow-sm transition-shadow`}>
                          <span className="text-sm flex-shrink-0 mt-0.5">{ins.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] leading-relaxed ${ins.cor}`}>{ins.texto}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={`text-[7px] font-bold px-1 rounded ${ins.impacto === 'Alto' ? 'bg-red-100 text-red-600' : ins.impacto === 'Médio' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>⚡{ins.impacto}</span>
                              <span className="text-[7px] text-slate-400">🧩 {ins.dificuldade}</span>
                              <span className="text-[7px] text-slate-400">⏱ {ins.tempo}</span>
                              <span className="text-[7px] text-slate-400">📈 {ins.retorno}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {insightsPremium.length === 0 && <p className="text-[10px] text-slate-400 py-2">Nenhum insight disponível no momento.</p>}
                    </div>
                  </div>

                  {/* CENTRAL DE DECISÕES */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-xs">🎯</span>CENTRAL DE DECISÕES
                    </p>
                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                      {centralDecisoes.map((cd: any, i: any) => (
                        <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border ${cd.border} ${cd.bg} hover:shadow-sm transition-shadow`}>
                          <span className="text-lg flex-shrink-0">{cd.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className={`text-[10px] font-bold ${cd.cor}`}>{cd.acao}</p>
                              <span className={`text-[7px] font-bold px-1 rounded-full ${cd.urgencia === 'Urgente' ? 'bg-red-100 text-red-600' : cd.urgencia === 'Alta' ? 'bg-amber-100 text-amber-600' : cd.urgencia === 'Média' ? 'bg-yellow-100 text-yellow-600' : 'bg-emerald-100 text-emerald-600'}`}>{cd.urgencia}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 leading-snug">{cd.motivo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LINHA 5: IA OBSERVANDO + STATUS DA IA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* IA OBSERVANDO O ESTOQUE */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">👁️</span>IA OBSERVANDO O ESTOQUE
                    </p>
                    <div className="space-y-1">
                      {iaObservando.map((obs: any, i: any) => (
                        <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg ${obs.bg} border border-slate-100 hover:shadow-sm transition-shadow`}>
                          <span className="text-xs flex-shrink-0">{obs.icon}</span>
                          <p className={`text-[10px] ${obs.cor} leading-snug`}>{obs.texto}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* STATUS DA IA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center text-xs">🟢</span>STATUS DA IA
                    </p>
                    <div className="space-y-1">
                      {statusIACopiloto.map((st: any, i: any) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${st.cor.replace('text-', 'bg-')} animate-pulse flex-shrink-0`} style={{ animationDelay: `${i * 200}ms` }} />
                          <span className={`text-[10px] font-medium ${st.cor}`}>{st.icon} {st.texto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LINHA 6: MEMÓRIA DA IA */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-xs">🧠</span>MEMÓRIA DA IA
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                    {memoriaIA.map((m: any, i: any) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <span className="text-[8px] font-semibold text-slate-400 uppercase block">{m.label}</span>
                        <p className="text-[10px] font-medium text-slate-700 truncate flex items-center gap-1 mt-0.5">
                          <span className="text-xs">{m.icon}</span>{m.valor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div></div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
  </>);
}
