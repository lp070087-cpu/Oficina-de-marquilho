'use client';
import React from 'react';

export function DashboardPanel({ ctx }: { ctx: any }) {
  const { alertasIA, analisesIA, dashboardAberto, dashboardData, resumoExecutivo } = ctx;

  return (<>
        {/* DASHBOARD — CENTRAL DE INTELIGÊNCIA (FASE 8) */}
        {/* ================================================================ */}
        {dashboardAberto && dashboardData && (
          <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-white animate-in fade-in duration-300">
            <div className="max-h-[420px] overflow-y-auto">
              <div className="px-4 py-4"><div className="max-w-5xl mx-auto space-y-4">

                {/* MÉTRICAS PRINCIPAIS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { label: 'Valor Total', valor: dashboardData.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: '💰', cor: 'border-l-emerald-500', bgIcon: 'bg-emerald-100', textIcon: 'text-emerald-600' },
                    { label: 'Produtos', valor: dashboardData.totalProdutos.toString(), icon: '📦', cor: 'border-l-blue-500', bgIcon: 'bg-blue-100', textIcon: 'text-blue-600' },
                    { label: 'Sem Estoque', valor: dashboardData.semEstoque.length.toString(), icon: '🚫', cor: dashboardData.semEstoque.length > 0 ? 'border-l-red-500' : 'border-l-emerald-500', bgIcon: 'bg-red-100', textIcon: 'text-red-600' },
                    { label: 'Críticos', valor: dashboardData.estoqueCritico.length.toString(), icon: '⚠️', cor: dashboardData.estoqueCritico.length > 0 ? 'border-l-amber-500' : 'border-l-emerald-500', bgIcon: 'bg-amber-100', textIcon: 'text-amber-600' },
                    { label: 'Preço Médio', valor: dashboardData.precoMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: '📊', cor: 'border-l-purple-500', bgIcon: 'bg-purple-100', textIcon: 'text-purple-600' },
                    { label: 'Categorias', valor: dashboardData.catsArray.length.toString(), icon: '📂', cor: 'border-l-cyan-500', bgIcon: 'bg-cyan-100', textIcon: 'text-cyan-600' },
                  ].map((m, i) => (
                    <div key={i} className={`bg-white rounded-xl border border-slate-200 p-2.5 ${m.cor} border-l-2 hover:shadow-sm transition-shadow duration-200`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-7 h-7 rounded-lg ${m.bgIcon} flex items-center justify-center text-xs`}>{m.icon}</span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">{m.label}</span>
                      </div>
                      <p className={`text-sm font-bold ${dashboardData.semEstoque.length > 0 && m.label === 'Sem Estoque' ? 'text-red-600' : dashboardData.estoqueCritico.length > 0 && m.label === 'Críticos' ? 'text-amber-600' : 'text-slate-800'}`}>{m.valor}</p>
                    </div>
                  ))}
                </div>

                {/* LINHA 2: DETALHES + PIZZA CATEGORIAS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Detalhes rápidos */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">📋</span>Detalhes do Estoque
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Produto mais caro', valor: dashboardData.maisCaro?.nome || '-', extra: dashboardData.maisCaro ? Number(dashboardData.maisCaro.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '' },
                        { label: 'Produto mais barato', valor: dashboardData.maisBarato?.nome || '-', extra: dashboardData.maisBarato ? Number(dashboardData.maisBarato.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '' },
                        { label: 'Maior categoria', valor: dashboardData.maiorCategoria?.nome || '-', extra: dashboardData.maiorCategoria ? `${dashboardData.maiorCategoria.qtd} un.` : '' },
                        { label: 'Menor categoria', valor: dashboardData.menorCategoria?.nome || '-', extra: dashboardData.menorCategoria ? `${dashboardData.menorCategoria.qtd} un.` : '' },
                        { label: 'Cadastrados hoje', valor: dashboardData.cadastradosHoje.length > 0 ? `${dashboardData.cadastradosHoje.length} prod.` : 'Nenhum' },
                        { label: 'Cadastrados semana', valor: dashboardData.cadastradosSemana.length > 0 ? `${dashboardData.cadastradosSemana.length} prod.` : 'Nenhum' },
                      ].map((d, i) => (
                        <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-50 last:border-0">
                          <span className="text-[10px] text-slate-500">{d.label}</span>
                          <span className="text-[10px] font-semibold text-slate-700 text-right truncate max-w-[55%]">{d.valor}{d.extra ? <span className="text-slate-400 ml-1">{d.extra}</span> : null}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pizza SVG por Categoria */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-xs">🍕</span>Distribuição por Categoria (un.)
                    </p>
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 100 100" className="w-24 h-24 flex-shrink-0">
                        {(() => {
                          const total = dashboardData.catsArray.reduce((s: any, c: any) => s + c.qtd, 0) || 1;
                          const cores = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#64748b','#14b8a6','#a855f7','#e11d48','#0ea5e9','#65a30d'];
                          let acum = 0;
                          return dashboardData.catsArray.filter((c: any) => c.qtd > 0).slice(0, 10).map((c: any, i: any) => {
                            const pct = (c.qtd / total) * 360;
                            const start = acum; acum += pct;
                            const mid = (start + acum) / 2 * Math.PI / 180;
                            const x1 = 50 + 40 * Math.cos(start * Math.PI / 180);
                            const y1 = 50 + 40 * Math.sin(start * Math.PI / 180);
                            const x2 = 50 + 40 * Math.cos(acum * Math.PI / 180);
                            const y2 = 50 + 40 * Math.sin(acum * Math.PI / 180);
                            const large = pct > 180 ? 1 : 0;
                            return <path key={i} d={`M50,50 L${x1},${y1} A40,40 0 ${large},1 ${x2},${y2} Z`} fill={cores[i % cores.length]} opacity={0.85}><title>{c.nome}: {c.qtd} un.</title></path>;
                          });
                        })()}
                      </svg>
                      <div className="flex-1 space-y-1 min-w-0">
                        {dashboardData.catsArray.filter((c: any) => c.qtd > 0).slice(0, 5).map((c: any, i: any) => {
                          const cores = ['bg-indigo-500','bg-emerald-500','bg-amber-500','bg-red-500','bg-purple-500'];
                          const total = dashboardData.catsArray.reduce((s: any, x: any) => s + x.qtd, 0) || 1;
                          return (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cores[i]}`} />
                              <span className="text-[10px] text-slate-600 truncate">{c.nome}</span>
                              <span className="text-[9px] font-semibold text-slate-500 ml-auto flex-shrink-0">{Math.round((c.qtd / total) * 100)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Barras por Categoria (Valor) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-xs">📊</span>Valor por Categoria
                    </p>
                    <div className="space-y-1.5">
                      {dashboardData.catsArray.filter((c: any) => c.valor > 0).sort((a: any, b: any) => b.valor - a.valor).slice(0, 6).map((c: any, i: any) => {
                        const maxVal = dashboardData.catsArray[0]?.valor || 1;
                        const pct = Math.round((c.valor / maxVal) * 100);
                        const coresBar = ['bg-indigo-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-violet-500'];
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 w-20 truncate flex-shrink-0">{c.nome}</span>
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${coresBar[i]} transition-all duration-500`} style={{ width: `${Math.max(pct, 4)}%` }} />
                            </div>
                            <span className="text-[9px] font-semibold text-slate-500 w-16 text-right flex-shrink-0">{c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* LINHA 3: PRODUTOS PARADOS + MAIS VENDIDOS + SEM ESTOQUE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Produtos com mais estoque (parados) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">⏸️</span>Estoque Parado Elevado
                    </p>
                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                      {dashboardData.paradosList.slice(0, 6).map((p: any, i: any) => (
                        <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[9px] font-bold text-slate-400 w-5 flex-shrink-0">#{i + 1}</span>
                          <span className="text-[10px] text-slate-700 truncate flex-1">{p.nome}</span>
                          <span className="text-[10px] font-bold text-amber-600 flex-shrink-0">{p.quantidade || 0} un.</span>
                        </div>
                      ))}
                      {dashboardData.paradosList.length === 0 && <p className="text-[10px] text-slate-400 py-2">Nenhum produto com estoque parado elevado.</p>}
                    </div>
                  </div>

                  {/* Mais vendidos */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-xs">🔥</span>Menor Estoque (possível alta saída)
                    </p>
                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                      {dashboardData.maisVendidosSimulado.slice(0, 6).map((p: any, i: any) => (
                        <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[9px] font-bold text-slate-400 w-5 flex-shrink-0">#{i + 1}</span>
                          <span className="text-[10px] text-slate-700 truncate flex-1">{p.nome}</span>
                          <span className="text-[10px] font-bold text-emerald-600 flex-shrink-0">{p.quantidade || 0} un.</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Produtos sem estoque */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-xs">🚫</span>Produtos sem Estoque
                    </p>
                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                      {dashboardData.semEstoque.slice(0, 8).map((p: any, i: any) => (
                        <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50 last:border-0">
                          <span className="text-[9px] font-bold text-red-400 w-5 flex-shrink-0">!</span>
                          <span className="text-[10px] text-slate-700 truncate flex-1">{p.nome}</span>
                          <span className="text-[10px] font-bold text-red-600 flex-shrink-0">0 un.</span>
                        </div>
                      ))}
                      {dashboardData.semEstoque.length === 0 && <p className="text-[10px] text-emerald-600 py-2">✅ Nenhum produto sem estoque!</p>}
                    </div>
                  </div>
                </div>

                {/* LINHA 4: ANÁLISES DA IA */}
                {analisesIA.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center text-xs">🧠</span>ANÁLISES DA IA
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {analisesIA.map((a: any, i: any) => (
                        <div key={i} className={`rounded-xl border p-2.5 ${a.bg} ${a.border} hover:shadow-sm transition-shadow duration-200`}>
                          <p className={`text-[10px] leading-relaxed ${a.cor}`}>
                            <span className="mr-1">{a.icon}</span>{a.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LINHA 5: ALERTAS DA IA */}
                {alertasIA.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-xs">🔔</span>ALERTAS DA IA
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {alertasIA.map((a: any, i: any) => (
                        <div key={i} className={`bg-white rounded-xl border border-slate-200 p-2.5 border-l-2 ${a.borderL} ${a.corCard} hover:shadow-sm transition-shadow duration-200`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`w-2 h-2 rounded-full ${a.corBadge}`} />
                            <span className="text-[10px] font-bold text-slate-700">{a.titulo}</span>
                            <span className={`ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${a.prioridade === 'critico' ? 'bg-red-100 text-red-600' : a.prioridade === 'atencao' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {a.prioridade === 'critico' ? 'Crítico' : a.prioridade === 'atencao' ? 'Atenção' : 'Normal'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 mb-1">{a.desc}</p>
                          <p className="text-[9px] text-slate-400 italic">💡 {a.acao}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LINHA 6: RESUMO EXECUTIVO */}
                {resumoExecutivo && (
                  <div className="bg-gradient-to-r from-indigo-50 to-white rounded-xl border border-indigo-200 p-3.5">
                    <p className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">📝</span>RESUMO EXECUTIVO
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{resumoExecutivo}</p>
                  </div>
                )}

              </div></div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
  </>);
}
