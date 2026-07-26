'use client';
import React from 'react';

export function GerentePanel({ ctx }: { ctx: any }) {
    const {
    addMsg,
    aplicandoSugestao,
    atividadeIA,
    checklistItens,
    dashboardData,
    gerenteAberto,
    oportunidades,
    pontuacaoEstoque,
    previsaoReposicao,
    prioridadesDoDia,
    produtosAtencao,
    resolvendoPrioridade,
    setAplicandoSugestao,
    setChecklistItens,
    setResolvendoPrioridade,
    sugestoesIA
  } = ctx;

  return (<>
        {/* GERENTE IA (FASE 9) — Painel Proativo */}
        {/* ================================================================ */}
        {gerenteAberto && dashboardData && (
          <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-rose-50/20 animate-in fade-in duration-300">
            <div className="max-h-[420px] overflow-y-auto">
              <div className="px-4 py-4"><div className="max-w-5xl mx-auto space-y-4">

                {/* LINHA 1: PONTUAÇÃO + PRIORIDADES DO DIA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* PONTUAÇÃO DO ESTOQUE — Gauge SVG */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col items-center">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1 w-full">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-xs">🏆</span>PONTUAÇÃO DO ESTOQUE
                    </p>
                    <div className="relative w-28 h-28">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="48" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                        <circle cx="60" cy="60" r="48" fill="none" stroke={pontuacaoEstoque.corBarra} strokeWidth="10"
                          strokeDasharray={`${(pontuacaoEstoque.score / 100) * 301.6} 301.6`}
                          strokeLinecap="round" className="transition-all duration-700 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${pontuacaoEstoque.cor}`}>{pontuacaoEstoque.score}</span>
                        <span className={`text-[10px] font-semibold ${pontuacaoEstoque.cor}`}>{pontuacaoEstoque.nivel}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2 w-full text-center">
                      <div className="bg-slate-50 rounded-lg p-1"><span className="text-[9px] text-slate-500">Produtos</span><p className="text-[11px] font-bold text-slate-700">{dashboardData.totalProdutos}</p></div>
                      <div className="bg-slate-50 rounded-lg p-1"><span className="text-[9px] text-slate-500">Categorias</span><p className="text-[11px] font-bold text-slate-700">{dashboardData.catsArray.length}</p></div>
                    </div>
                  </div>

                  {/* PRIORIDADES DO DIA */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-xs">📋</span>PRIORIDADES DO DIA
                    </p>
                    <div className="space-y-1.5">
                      {prioridadesDoDia.map((p: any) => (
                        <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg border ${p.border} ${p.bg} border-l-2 hover:shadow-sm transition-shadow duration-200`}>
                          <span className="text-sm flex-shrink-0">{p.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-semibold ${p.cor} truncate`}>{p.descricao}</p>
                          </div>
                          <button
                            onClick={() => { setResolvendoPrioridade(p.id); setTimeout(() => { setResolvendoPrioridade(null); addMsg(`✅ Ação "${p.acao}" simulada com sucesso. (Prioridade: ${p.descricao})`, 'assistant'); }, 800); }}
                            disabled={resolvendoPrioridade === p.id}
                            className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 border ${p.cor} ${p.bg} hover:scale-105 disabled:opacity-50 disabled:cursor-wait`}>
                            {resolvendoPrioridade === p.id ? (
                              <><span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />Resolvendo</>
                            ) : (
                              <>{p.acao}</>
                            )}
                          </button>
                        </div>
                      ))}
                      {prioridadesDoDia.length === 0 && <p className="text-[10px] text-slate-400 py-2">✅ Nenhuma prioridade pendente — estoque em ordem.</p>}
                    </div>
                  </div>
                </div>

                {/* LINHA 2: SUGESTÕES DA IA + PRODUTOS QUE PRECISAM DE ATENÇÃO */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* SUGESTÕES DA IA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">💡</span>SUGESTÕES DA IA
                    </p>
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                      {sugestoesIA.map((s: any, i: any) => (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${s.bg} border-slate-200 hover:shadow-sm transition-shadow duration-200`}>
                          <span className="text-sm flex-shrink-0">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-700 font-medium truncate">{s.motivo}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[8px] font-semibold text-slate-500 bg-slate-100 px-1 rounded">{s.confianca}% confiança</span>
                              <span className={`text-[8px] font-semibold px-1 rounded ${s.impacto === 'Alto' ? 'bg-red-100 text-red-600' : s.impacto === 'Médio' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{s.impacto} impacto</span>
                            </div>
                          </div>
                          <button
                            onClick={() => { setAplicandoSugestao(i); setTimeout(() => { setAplicandoSugestao(null); addMsg(`✅ Sugestão "${s.acao}" aplicada com sucesso.`, 'assistant'); }, 700); }}
                            disabled={aplicandoSugestao === i}
                            className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 border border-slate-200 bg-white ${s.cor} hover:bg-slate-50 hover:scale-105 disabled:opacity-50 disabled:cursor-wait`}>
                            {aplicandoSugestao === i ? '...' : s.acao}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PRODUTOS QUE PRECISAM DE ATENÇÃO */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-xs">🔍</span>PRECISAM DE ATENÇÃO
                    </p>
                    <div className="max-h-[280px] overflow-y-auto">
                      <div className="grid grid-cols-1 gap-1">
                        {/* Header */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-1 px-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                          <span>Nome</span><span>Categoria</span><span>Qtd</span><span>Valor</span><span>Problema</span>
                        </div>
                        {produtosAtencao.slice(0, 15).map((item: any, i: any) => (
                          <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-1 px-1.5 py-1 rounded-md hover:bg-slate-50 transition-colors items-center border-b border-slate-50 last:border-0">
                            <span className="text-[10px] text-slate-700 font-medium truncate">{item.peca.nome}</span>
                            <span className="text-[9px] text-slate-500 truncate">{item.peca.categoria?.nome || '-'}</span>
                            <span className={`text-[10px] font-bold ${(item.peca.quantidade || 0) <= 0 ? 'text-red-600' : (item.peca.quantidade || 0) <= (item.peca.estoqueMinimo || 5) ? 'text-amber-600' : 'text-slate-600'}`}>{item.peca.quantidade || 0}</span>
                            <span className="text-[10px] text-slate-600 truncate">{Number(item.peca.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                            <span className={`text-[8px] font-semibold px-1 py-0.5 rounded-full whitespace-nowrap text-center ${item.bgPrioridade} ${item.corPrioridade}`}>{item.problema}</span>
                          </div>
                        ))}
                        {produtosAtencao.length === 0 && <p className="text-[10px] text-emerald-600 py-2">✅ Nenhum produto precisa de atenção no momento.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* LINHA 3: PREVISÃO DE REPOSIÇÃO + OPORTUNIDADES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* PREVISÃO DE REPOSIÇÃO */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center text-xs">🔮</span>PREVISÃO DE REPOSIÇÃO
                    </p>
                    <div className="space-y-1.5">
                      {previsaoReposicao.map((p: any, i: any) => (
                        <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${p.bg} ${p.border} hover:shadow-sm transition-shadow duration-200`}>
                          <span className="text-sm flex-shrink-0 mt-0.5">{p.icon}</span>
                          <p className={`text-[10px] leading-relaxed ${p.cor}`}>{p.texto}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OPORTUNIDADES */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-xs">🚀</span>OPORTUNIDADES
                    </p>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                      {oportunidades.map((o: any, i: any) => (
                        <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${o.bg} ${o.border} hover:shadow-sm transition-shadow duration-200`}>
                          <span className="text-sm flex-shrink-0 mt-0.5">{o.icon}</span>
                          <div>
                            <p className={`text-[10px] font-semibold ${o.cor}`}>{o.titulo}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{o.descricao}</p>
                          </div>
                        </div>
                      ))}
                      {oportunidades.length === 0 && <p className="text-[10px] text-slate-400 py-2">Nenhuma oportunidade detectada no momento.</p>}
                    </div>
                  </div>
                </div>

                {/* LINHA 4: CHECKLIST DO ESTOQUE + ATIVIDADE DA IA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* CHECKLIST DO ESTOQUE */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-xs">✅</span>CHECKLIST DO ESTOQUE
                    </p>
                    <div className="space-y-1">
                      {checklistItens.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => setChecklistItens((prev: any) => prev.map((it: any) => it.id === item.id ? { ...it, feito: !it.feito } : it))}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 text-left ${item.feito ? 'bg-emerald-50 border-emerald-200 opacity-70' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${item.feito ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                            {item.feito && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                          </span>
                          <span className={`text-[10px] font-medium transition-all duration-200 ${item.feito ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.texto}</span>
                          {item.feito && <span className="ml-auto text-[9px] text-emerald-600 font-semibold">✓</span>}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${checklistItens.length > 0 ? Math.round((checklistItens.filter((i: any) => i.feito).length / checklistItens.length) * 100) : 0}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 flex-shrink-0">{checklistItens.filter((i: any) => i.feito).length}/{checklistItens.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* ATIVIDADE DA IA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center text-xs">📡</span>ATIVIDADE DA IA
                    </p>
                    <div className="space-y-0 max-h-[220px] overflow-y-auto">
                      {atividadeIA.map((ev: any, i: any) => (
                        <div key={i} className="flex items-start gap-2 relative pl-4 pb-3 last:pb-0">
                          {/* Timeline line */}
                          {i < atividadeIA.length - 1 && <div className="absolute left-[11px] top-4 bottom-0 w-px bg-slate-200" />}
                          <span className={`absolute left-0 top-0.5 w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center text-[8px] ${ev.cor} bg-slate-50 flex-shrink-0 shadow-sm`} style={{ fontSize: '8px' }}>{ev.texto.substring(0, 1)}</span>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400">{ev.hora}</span>
                            <p className="text-[10px] text-slate-600 leading-snug">{ev.texto}</p>
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
