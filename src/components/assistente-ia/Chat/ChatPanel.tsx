'use client';
import React, { useRef, useEffect } from 'react';
import { ACOES_RAPIDAS, INTENT_STYLES, PLACEHOLDERS } from '@/components/assistente-ia/Utils/constants';
import { corConfianca, textoConfianca } from '@/components/assistente-ia/Utils/parser';

// ============================================================
// FASE 1 — CHAT INTERFACE ESTILO ChatGPT
// ============================================================

export function ChatPanel({ ctx }: { ctx: any }) {
  const {
    addMsg,
    analisarTextoParaFicha,
    bottomRef,
    cadastroAberto,
    chatImageInputRef,
    chatImagePreview,
    conversacaoAtiva,
    dataRelativa,
    executarAcao,
    formatarMarkdown,
    input,
    inputExpandido,
    inputRef,
    listening,
    loading,
    messages,
    modoCadastro,
    placeholderIndex,
    processandoVoz,
    processingImage,
    processarMensagem,
    processarImagemChat,
    setInput,
    setInputExpandido,
    setScannerPainelAberto,
    statusPeca,
    sugestoes,
    toggleVoz,
    transcricaoParcial,
    abrirChatImagePicker,
    limparChatImage,
    handleChatImageUpload,
    voiceSettings,
    vozRespondendo,
    scannerInputRef,
  } = ctx;

  return (
    <div className="flex flex-col h-full">
      {/* ================================================================ */}
      {/* QUICK ACTIONS BAR — 4 botões principais */}
      {/* ================================================================ */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {ACOES_RAPIDAS.slice(0, 4).map((acao: any, i: number) => (
            <button
              key={i}
              onClick={() => {
                setInput(acao.comando);
                inputRef.current?.focus();
              }}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all duration-150 flex-shrink-0 hover:scale-[1.02] active:scale-[0.97] ${acao.cor}`}
            >
              <span className="text-sm">{acao.icon}</span>
              <span className="hidden sm:inline">{acao.label}</span>
              <span className="sm:hidden">{acao.label.split(' ')[0]}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setScannerPainelAberto(true);
              setTimeout(() => scannerInputRef.current?.focus(), 100);
            }}
            className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all duration-150 flex-shrink-0 hover:scale-[1.02] active:scale-[0.97] bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          >
            <span className="text-sm">📷</span>
            <span className="hidden sm:inline">Scanner</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MESSAGES AREA */}
      {/* ================================================================ */}
      <div className="flex-1 overflow-y-auto bg-[#F3F6FB]">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-2xl rounded-br-md shadow-sm shadow-brand-600/15 px-4 py-2.5'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-md shadow-sm hover:shadow-md transition-shadow duration-300 px-4 py-3'
              }`}>
                {/* AI badge */}
                {m.role === 'assistant' && !m.id.startsWith('welcome') && (
                  <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm shadow-brand-600/20">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-semibold text-brand-700">Assistente IA</span>
                    {vozRespondendo && (
                      <span className="flex items-center gap-1 text-[9px] text-amber-600 ml-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"/>
                        Respondendo...
                      </span>
                    )}
                    <span className="ml-auto text-[9px] text-slate-400">
                      {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* IMAGE IN MESSAGE */}
                {m.data?.imagem && (
                  <div className="mb-2.5 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={m.data.imagem} alt="Upload" className="max-w-full max-h-64 object-contain mx-auto" />
                  </div>
                )}

                {/* Text content */}
                <div
                  className="text-sm whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatarMarkdown(m.content) }}
                />

                {/* TRACE */}
                {m.trace && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Entendimento da IA</span>
                      </div>
                      <div className="flex items-start gap-2"><span className="text-[9px] font-semibold text-slate-400 w-14 flex-shrink-0 pt-0.5">📝 Frase:</span><span className="text-[10px] text-slate-600 bg-slate-100 rounded-md px-2 py-0.5 flex-1 font-mono">{m.trace.frase}</span></div>
                      <div className="flex items-center gap-2"><span className="text-[9px] font-semibold text-slate-400 w-14 flex-shrink-0">🎯 Intenção:</span><span className={`text-[10px] font-bold ${INTENT_STYLES[m.trace.intent]?.cor || 'text-slate-700'}`}>{m.trace.intentLabel}</span><div className="flex items-center gap-1.5 ml-auto"><div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${corConfianca(m.trace.confianca)}`} style={{ width: `${m.trace.confianca}%` }} /></div><span className={`text-[10px] font-bold ${textoConfianca(m.trace.confianca)}`}>{m.trace.confianca}%</span></div></div>
                      <div className="flex items-start gap-2"><span className="text-[9px] font-semibold text-slate-400 w-14 flex-shrink-0 pt-0.5">⚡ Ação:</span><span className="text-[10px] text-slate-700">{m.trace.acao}{m.trace.params.length > 0 && ' • ' + m.trace.params.join(' • ')}</span></div>
                      <div className="flex items-start gap-2"><span className="text-[9px] font-semibold text-slate-400 w-14 flex-shrink-0 pt-0.5">{m.trace.sucesso ? '✅' : '❌'} Resultado:</span><span className={`text-[10px] font-medium ${m.trace.sucesso ? 'text-emerald-700' : 'text-red-700'}`}>{m.trace.resumo}</span></div>
                    </div>
                  </div>
                )}

                {/* Data tables */}
                {m.data && !m.actions && m.data.pecas && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    <div className="max-h-[320px] overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr>
                            <th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Código</th>
                            <th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Nome</th>
                            <th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 hidden sm:table-cell">Categoria</th>
                            <th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Estoque</th>
                            <th className="text-right font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 hidden sm:table-cell">Valor</th>
                            <th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 hidden md:table-cell">Localização</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.data.pecas.slice(0, 20).map((p: any, i: number) => {
                            const st = statusPeca(p.quantidade || 0, p.estoqueMinimo || 5);
                            return (
                              <tr key={i} className={`transition-colors duration-150 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                <td className="px-3 py-2 border-b border-slate-100 font-mono text-[10px] text-brand-700 font-semibold">{p.codigo}</td>
                                <td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{p.nome}</td>
                                <td className="px-3 py-2 border-b border-slate-100 text-slate-500 hidden sm:table-cell">{p.categoria?.nome || '-'}</td>
                                <td className="px-3 py-2 border-b border-slate-100 text-center">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className={`font-semibold ${st.cor}`}>{p.quantidade || 0}</span>
                                    {(p.quantidadeLoja || 0) > 0 && <span className="text-[9px] text-slate-400">Loja: {p.quantidadeLoja}</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-2 border-b border-slate-100 text-right font-medium text-slate-700 hidden sm:table-cell">
                                  {Number(p.precoVenda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-3 py-2 border-b border-slate-100 text-slate-500 hidden md:table-cell text-[10px]">{p.localizacao || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {m.data.pecas.length > 20 && (
                      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-center">
                        <span className="text-[10px] font-medium text-slate-500">+{m.data.pecas.length - 20} produtos não exibidos</span>
                      </div>
                    )}
                  </div>
                )}
                {m.data && !m.actions && m.data.ranking && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    <div className="max-h-[320px] overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 w-8">#</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Produto</th><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Qtd</th><th className="text-right font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Faturamento</th></tr>
                        </thead>
                        <tbody>
                          {m.data.ranking.map((r: any, i: number) => (
                            <tr key={i} className={`transition-colors duration-150 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                              <td className="px-3 py-2 border-b border-slate-100 text-center font-bold">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-slate-400">{i + 1}</span>}</td>
                              <td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{r.nome}</td>
                              <td className="px-3 py-2 border-b border-slate-100 text-center font-semibold text-slate-700">{r.qtd} un.</td>
                              <td className="px-3 py-2 border-b border-slate-100 text-right font-semibold text-emerald-700">{r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {m.data && !m.actions && m.data.parados && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    <div className="max-h-[320px] overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 w-8">#</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Produto</th><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Estoque</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 hidden sm:table-cell">Categoria</th></tr>
                        </thead>
                        <tbody>
                          {m.data.parados.map((p: any, i: number) => (
                            <tr key={i} className={`transition-colors duration-150 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                              <td className="px-3 py-2 border-b border-slate-100 text-center text-slate-400">{i + 1}</td>
                              <td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{p.nome}</td>
                              <td className="px-3 py-2 border-b border-slate-100 text-center"><span className="font-semibold text-amber-600">{p.quantidade} un.</span></td>
                              <td className="px-3 py-2 border-b border-slate-100 text-slate-500 hidden sm:table-cell">{p.categoria?.nome || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action cards */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {m.actions.map((action: any, i: number) => (
                      <div key={i} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-3 shadow-sm">
                        <p className="text-xs font-semibold text-slate-800 mb-1">{action.title}</p>
                        <p className="text-[11px] text-slate-500 mb-3">{action.description}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => executarAcao(action, m.id)} className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all duration-200 shadow-sm shadow-brand-600/15 hover:shadow-md hover:shadow-brand-600/20 active:scale-[0.97]">Confirmar</button>
                          <button onClick={() => { addMsg('Comando cancelado.', 'assistant'); }} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* LOADING / TYPING INDICATOR */}
          {loading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm max-w-[85%]">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-64 rounded bg-slate-100 animate-pulse" />
                  <div className="h-2.5 w-48 rounded bg-slate-100 animate-pulse" />
                  <div className="h-2.5 w-56 rounded bg-slate-100 animate-pulse" />
                  <div className="h-6 w-32 rounded-lg bg-slate-100 animate-pulse mt-3" />
                </div>
              </div>
            </div>
          )}

          {/* PROCESSING VOICE */}
          {processandoVoz && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-md max-w-[85%]">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm shadow-brand-600/20">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-700">Processando voz...</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }}/>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }}/>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROCESSING IMAGE */}
          {processingImage && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-md max-w-[85%]">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm shadow-purple-600/20">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700">Analisando imagem...</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}/>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}/>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ================================================================ */}
      {/* VOICE LISTENING INDICATOR (inline, no overlay) */}
      {/* ================================================================ */}
      {conversacaoAtiva && (
        <div className="flex-shrink-0 bg-gradient-to-r from-red-50 via-white to-red-50 border-t border-red-200 animate-in fade-in duration-200">
          <div className="px-3 py-2.5">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </div>
                <div className="absolute -inset-0.5 rounded-full bg-red-400/30 animate-ping" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-600">Escutando...</p>
                {transcricaoParcial ? (
                  <p className="text-[11px] text-slate-600 truncate">{transcricaoParcial}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Fale naturalmente...</p>
                )}
              </div>
              <button
                onClick={toggleVoz}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                Parar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* SUGGESTIONS BAR */}
      {/* ================================================================ */}
      {sugestoes && sugestoes.length > 0 && !inputExpandido && !cadastroAberto && !conversacaoAtiva && (
        <div className="flex-shrink-0 bg-white border-t border-slate-100 px-3 sm:px-4 pt-2">
          <div className="max-w-3xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">Sugestões:</span>
            {sugestoes.map((s: any, i: number) => (
              <button
                key={i}
                onClick={() => { setInput(s.comando); inputRef.current?.focus(); }}
                className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all duration-150 flex-shrink-0 active:scale-[0.97]"
              >
                <span className="text-[11px]">{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* IMAGE PREVIEW BAR */}
      {/* ================================================================ */}
      {chatImagePreview && (
        <div className="flex-shrink-0 bg-white border-t border-slate-200 px-3 sm:px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
              <img src={chatImagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-700">Imagem selecionada</p>
              <p className="text-[10px] text-slate-400 truncate">Pronta para análise com OCR</p>
            </div>
            <button onClick={limparChatImage} className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMPOSER (INPUT + BUTTONS) */}
      {/* ================================================================ */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          <div className="py-2.5 sm:py-3 flex items-end gap-1.5 sm:gap-2">
            {/* IMAGE UPLOAD BUTTON */}
            <button
              onClick={abrirChatImagePicker}
              disabled={processingImage}
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-150 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar imagem"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </button>
            <input
              ref={chatImageInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleChatImageUpload}
            />

            {/* MICROPHONE BUTTON */}
            <button
              onClick={toggleVoz}
              className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 flex-shrink-0 relative ${
                listening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
                  : conversacaoAtiva
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-105'
                    : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
              }`}
              title={listening ? 'Ouvindo...' : conversacaoAtiva ? 'Conversação ativa' : 'Ativar microfone'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              {listening && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white animate-ping" />}
            </button>

            {/* TEXT INPUT */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !inputExpandido) {
                    e.preventDefault();
                    if (chatImagePreview) {
                      processarImagemChat();
                    } else if (cadastroAberto && modoCadastro === 'texto') {
                      analisarTextoParaFicha();
                    } else {
                      processarMensagem();
                    }
                  }
                }}
                rows={inputExpandido ? 5 : 1}
                className="w-full resize-none border border-slate-200 bg-slate-50 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 pr-16 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 focus:bg-white placeholder:text-slate-400 transition-all duration-200 min-h-[42px]"
                placeholder={
                  listening ? '🎤 Ouvindo...' :
                  conversacaoAtiva ? '🎤 Fale naturalmente...' :
                  cadastroAberto && modoCadastro === 'texto' ? 'Descreva o produto...' :
                  PLACEHOLDERS[placeholderIndex]
                }
                disabled={listening}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                {input.length > 0 && (
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${input.length > 200 ? 'text-red-500' : input.length > 150 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {input.length}
                  </span>
                )}
                {input.length > 0 && (
                  <button onClick={() => { setInput(''); setTimeout(() => inputRef.current?.focus(), 50); }} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                )}
                <button
                  onClick={() => { setInputExpandido(!inputExpandido); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className={`p-1 rounded-md transition-all duration-200 ${inputExpandido ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  title={inputExpandido ? 'Recolher' : 'Expandir'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {inputExpandido
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {/* SEND BUTTON */}
            <button
              onClick={() => {
                if (chatImagePreview) {
                  processarImagemChat();
                } else if (cadastroAberto && modoCadastro === 'texto') {
                  analisarTextoParaFicha();
                } else {
                  processarMensagem();
                }
              }}
              disabled={(!input.trim() && !chatImagePreview) || loading || processingImage}
              className="p-2 sm:p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-brand-600/20 hover:shadow-md hover:shadow-brand-600/25 active:scale-[0.95] flex-shrink-0"
              title="Enviar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
