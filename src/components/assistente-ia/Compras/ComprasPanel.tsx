'use client';
import React from 'react';

export function ComprasPanel({ ctx }: { ctx: any }) {
    const {
    analiseLucro,
    centralCompras,
    centralFornecedores,
    comprasAberto,
    comprasAdicionadas,
    comprasIgnoradas,
    curvaABC,
    dashboardData,
    iaConsultora,
    iaNegociadora,
    oportunidadesVenda,
    previsaoCompras,
    setComprasAdicionadas,
    setComprasIgnoradas
  } = ctx;

  return (<>
        {/* IA COMERCIAL, COMPRAS E FORNECEDORES (FASE 13)                      */}
        {/* ================================================================ */}
        {comprasAberto && dashboardData && (
          <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 animate-in fade-in duration-300">
            <div className="px-4 py-3 space-y-3 max-h-[1400px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-sm shadow-md shadow-emerald-500/20">🛒</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">IA Comercial, Compras & Fornecedores</p>
                  <p className="text-[10px] text-slate-500">Inteligência artificial para decisões comerciais estratégicas</p>
                </div>
              </div>

              {/* LINHA 1: CENTRAL DE COMPRAS + CENTRAL DE FORNECEDORES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* CENTRAL DE COMPRAS */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-xs">🛒</span>CENTRAL DE COMPRAS
                  </p>
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                    {centralCompras.length > 0 ? centralCompras.map((comp: any, i: any) => {
                      const adicionado = comprasAdicionadas.includes(comp.id);
                      const ignorado = comprasIgnoradas.includes(comp.id);
                      if (ignorado) return null;
                      return (
                        <div key={comp.id} className={`flex items-start gap-2 p-2 rounded-lg border transition-all duration-200 ${adicionado ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                          <span className="text-sm flex-shrink-0 mt-0.5">{comp.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[10px] font-semibold text-slate-700 truncate">{comp.nome}</p>
                              <span className={`text-[7px] font-bold px-1 rounded ${comp.urgencia === 'Urgente' ? 'bg-red-100 text-red-600' : comp.urgencia === 'Alta' ? 'bg-amber-100 text-amber-600' : 'bg-amber-50 text-amber-600'}`}>{comp.urgencia}</span>
                              <span className={`text-[7px] font-bold px-1 rounded ${comp.prioridade === 'Crítica' ? 'bg-red-100 text-red-600' : comp.prioridade === 'Alta' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{comp.prioridade}</span>
                            </div>
                            <p className="text-[8px] text-slate-400">{comp.categoria}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[8px] text-slate-500">Atual: <strong className="text-red-600">{comp.estoqueAtual}</strong> un.</span>
                              <span className="text-[8px] text-slate-500">Ideal: <strong>{comp.estoqueIdeal}</strong> un.</span>
                              <span className="text-[8px] font-bold text-emerald-600">Comprar: {comp.qtdSugerida} un.</span>
                            </div>
                            <p className="text-[8px] text-slate-400 mt-0.5 leading-relaxed">{comp.motivo}</p>
                          </div>
                          {!adicionado && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => { setComprasAdicionadas((p: any) => [...p, comp.id]); setComprasIgnoradas((p: any) => p.filter((id: any) => id !== comp.id)); }} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors" title="Adicionar à lista">✓</button>
                              <button onClick={() => setComprasIgnoradas((p: any) => [...p, comp.id])} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors" title="Ignorar">×</button>
                            </div>
                          )}
                          {adicionado && (<span className="text-[9px] font-bold text-emerald-600 flex-shrink-0 flex items-center gap-0.5">✅ <span className="hidden sm:inline">Adicionado</span></span>)}
                        </div>
                      );
                    }) : (
                      <div className="text-center py-3">
                        <p className="text-[10px] text-slate-400">Nenhuma compra sugerida no momento.</p>
                        <p className="text-[9px] text-slate-300 mt-0.5">Estoque está bem abastecido.</p>
                      </div>
                    )}
                  </div>
                  {comprasAdicionadas.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-emerald-700 font-medium">{comprasAdicionadas.length} item(ns) na lista de compras</span>
                        <button onClick={() => { setComprasAdicionadas([]); setComprasIgnoradas([]); }} className="text-[9px] font-bold text-slate-500 hover:text-red-600 transition-colors">Limpar lista</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CENTRAL DE FORNECEDORES */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-xs">🏭</span>CENTRAL DE FORNECEDORES
                  </p>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {centralFornecedores.map((f: any, i: any) => (
                      <div key={i} className={`p-2 rounded-lg border transition-all duration-200 ${f.tipo === 'Principal' ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300' : f.tipo === 'Emergencial' ? 'bg-red-50/30 border-red-100 hover:border-red-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{f.icon}</span>
                          <p className="text-[10px] font-semibold text-slate-700">{f.fornecedor}</p>
                          <span className={`text-[7px] font-bold px-1 rounded ${f.tipo === 'Principal' ? 'bg-blue-100 text-blue-700' : f.tipo === 'Emergencial' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{f.tipo}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div><span className="text-[8px] text-slate-400">Produtos</span><p className="text-[10px] font-semibold text-slate-700">{f.produtos}</p></div>
                          <div><span className="text-[8px] text-slate-400">Última compra</span><p className="text-[10px] font-semibold text-slate-700">{f.ultimaCompra}</p></div>
                          <div><span className="text-[8px] text-slate-400">Confiabilidade</span>
                            <div className="flex items-center gap-1">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${f.confiabilidade >= 90 ? 'bg-emerald-500' : f.confiabilidade >= 75 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${f.confiabilidade}%` }} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-500">{f.confiabilidade}%</span>
                            </div>
                          </div>
                          <div><span className="text-[8px] text-slate-400">Prazo médio</span><p className="text-[10px] font-semibold text-slate-700">{f.prazoMedio}</p></div>
                        </div>
                        <p className="text-[8px] text-slate-400 mt-1">Preço médio: <span className="font-semibold text-slate-600">{f.precoMedio}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* LINHA 2: ANÁLISE DE LUCRO + PREVISÃO DE COMPRAS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* ANÁLISE DE LUCRO */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-xs">💰</span>ANÁLISE DE LUCRO
                  </p>
                  {analiseLucro ? (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto">
                      <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
                        <p className="text-[9px] text-slate-500">Margem Média do Estoque</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xl font-black ${analiseLucro.margemMedia > 40 ? 'text-emerald-600' : analiseLucro.margemMedia > 25 ? 'text-amber-600' : 'text-red-600'}`}>{analiseLucro.margemMedia.toFixed(0)}%</span>
                          <span className="text-[9px] text-slate-400">{analiseLucro.margemMedia > 40 ? 'Excelente' : analiseLucro.margemMedia > 25 ? 'Boa' : 'Baixa — revise preços'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-slate-600 mb-1">Top 5 Produtos Mais Lucrativos</p>
                        {analiseLucro.maisLucrativos.slice(0, 5).map((p: any, i: any) => (
                          <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-50 last:border-0">
                            <span className="text-[9px] text-slate-600 truncate max-w-[140px]">{p.nome}</span>
                            <span className="text-[9px] font-bold text-emerald-600">{p.margem.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-slate-600 mb-1">Menos Lucrativos</p>
                        {analiseLucro.menosLucrativos.slice(0, 3).map((p: any, i: any) => (
                          <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-50 last:border-0">
                            <span className="text-[9px] text-slate-600 truncate max-w-[140px]">{p.nome}</span>
                            <span className={`text-[9px] font-bold ${p.margem < 20 ? 'text-red-600' : 'text-amber-600'}`}>{p.margem.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-slate-600 mb-1">Margem por Categoria</p>
                        {analiseLucro.margemPorCategoria.slice(0, 4).map((c: any, i: any) => (
                          <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-50 last:border-0">
                            <span className="text-[9px] text-slate-600">{c.nome}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${c.margemMedia > 40 ? 'bg-emerald-500' : c.margemMedia > 25 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.min(100, c.margemMedia)}%` }} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-600">{c.margemMedia.toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center py-3">Dados insuficientes para análise de lucro.</p>
                  )}
                </div>

                {/* PREVISÃO DE COMPRAS */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">📅</span>PREVISÃO DE COMPRAS
                  </p>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {previsaoCompras.map((p: any, i: any) => (
                      <div key={i} className={`p-2 rounded-lg border transition-all duration-200 ${p.impacto === 'Alto' ? 'bg-red-50/30 border-red-200' : p.impacto === 'Médio' ? 'bg-amber-50/30 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-700">{p.periodo}</span>
                          <span className={`text-[7px] font-bold px-1 rounded ${p.impacto === 'Alto' ? 'bg-red-100 text-red-600' : p.impacto === 'Médio' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.impacto}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div><span className="text-[8px] text-slate-400">Produtos</span><p className="text-[10px] font-semibold text-slate-700">{p.qtdProdutos}</p></div>
                          <div><span className="text-[8px] text-slate-400">Categorias</span><p className="text-[10px] font-semibold text-slate-700">{p.categorias}</p></div>
                          <div><span className="text-[8px] text-slate-400">Qtd. Prevista</span><p className="text-[10px] font-semibold text-slate-700">{p.qtdPrevista} un.</p></div>
                          <div><span className="text-[8px] text-slate-400">Valor Previsto</span><p className="text-[10px] font-bold text-slate-700">{p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* LINHA 3: IA NEGOCIADORA + CURVA ABC */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* IA NEGOCIADORA */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-xs">🤝</span>IA NEGOCIADORA
                  </p>
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                    {iaNegociadora.map((sug: any, i: any) => (
                      <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${sug.bg} border-slate-200 hover:shadow-sm transition-shadow`}>
                        <span className="text-sm flex-shrink-0 mt-0.5">{sug.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-[10px] font-bold ${sug.cor}`}>{sug.acao}</p>
                            <span className={`text-[7px] font-bold px-1 rounded ${sug.urgencia === 'Urgente' ? 'bg-red-100 text-red-600' : sug.urgencia === 'Alta' ? 'bg-amber-100 text-amber-600' : sug.urgencia === 'Média' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{sug.urgencia}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{sug.motivo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CURVA ABC */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">📊</span>CURVA ABC
                  </p>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {/* Classe A */}
                    <div className="bg-emerald-50/50 rounded-lg border border-emerald-200 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black text-emerald-700">CLASSE A</span>
                        <span className="text-[8px] text-emerald-600">70% do valor total</span>
                        <span className="text-[9px] font-bold text-emerald-600 ml-auto">{curvaABC.a.length} itens</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {curvaABC.a.slice(0, 6).map((item: any, i: any) => (
                          <span key={i} className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full truncate max-w-[120px]" title={item.nome}>{item.nome}</span>
                        ))}
                        {curvaABC.a.length > 6 && <span className="text-[8px] text-emerald-500">+{curvaABC.a.length - 6} mais</span>}
                      </div>
                    </div>
                    {/* Classe B */}
                    <div className="bg-amber-50/50 rounded-lg border border-amber-200 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black text-amber-700">CLASSE B</span>
                        <span className="text-[8px] text-amber-600">20% do valor total</span>
                        <span className="text-[9px] font-bold text-amber-600 ml-auto">{curvaABC.b.length} itens</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {curvaABC.b.slice(0, 4).map((item: any, i: any) => (
                          <span key={i} className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full truncate max-w-[100px]" title={item.nome}>{item.nome}</span>
                        ))}
                        {curvaABC.b.length > 4 && <span className="text-[8px] text-amber-500">+{curvaABC.b.length - 4} mais</span>}
                      </div>
                    </div>
                    {/* Classe C */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black text-slate-600">CLASSE C</span>
                        <span className="text-[8px] text-slate-500">10% do valor total</span>
                        <span className="text-[9px] font-bold text-slate-500 ml-auto">{curvaABC.c.length} itens</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {curvaABC.c.slice(0, 3).map((item: any, i: any) => (
                          <span key={i} className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full truncate max-w-[100px]" title={item.nome}>{item.nome}</span>
                        ))}
                        {curvaABC.c.length > 3 && <span className="text-[8px] text-slate-400">+{curvaABC.c.length - 3} mais</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LINHA 4: OPORTUNIDADES DE VENDA */}
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-xs">🎯</span>OPORTUNIDADES DE VENDA
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto">
                  {oportunidadesVenda.map((op: any, i: any) => (
                    <div key={i} className={`p-2 rounded-lg border ${op.bg} border-slate-200 hover:shadow-sm transition-shadow`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">{op.icon}</span>
                        <p className={`text-[10px] font-bold ${op.cor}`}>{op.tipo}</p>
                      </div>
                      <p className="text-[8px] text-slate-500 mb-1 leading-relaxed">{op.descricao}</p>
                      <div className="flex flex-wrap gap-1">
                        {op.itens.map((item: any, j: any) => (
                          <span key={j} className="text-[7px] bg-white/60 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[100px]">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {oportunidadesVenda.length === 0 && (
                    <p className="text-[10px] text-slate-400 col-span-full text-center py-3">Nenhuma oportunidade identificada no momento.</p>
                  )}
                </div>
              </div>

              {/* LINHA 5: IA CONSULTORA */}
              <div className="bg-gradient-to-r from-emerald-50 via-white to-green-50 rounded-xl border border-emerald-200 p-3">
                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-xs">🤖</span>IA CONSULTORA COMERCIAL
                </p>
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0 mt-0.5">💬</span>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg border border-emerald-200 p-2.5">
                      {iaConsultora ? (
                        iaConsultora.split('\n').map((linha: any, i: any) => {
                          const isBold = linha.startsWith('📊 **');
                          const clean = linha.replace(/\*\*/g, '');
                          return (
                            <p key={i} className={`text-[10px] leading-relaxed ${isBold ? 'font-bold text-slate-800 mb-1' : 'text-slate-600'}`}>{clean}</p>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-400">Carregando análise consultiva...</p>
                      )}
                    </div>
                    <p className="text-[8px] text-slate-400 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Análise gerada automaticamente com base nos dados atuais do estoque
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

  </>);
}
