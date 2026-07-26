'use client';
import React from 'react';
import { IconeCategoria } from '@/components/assistente-ia/Utils/icons';
import { CATEGORIAS_SIDEBAR, ACOES_RAPIDAS, COMANDOS_GRUPOS, INTENT_STYLES, PLACEHOLDERS } from '@/components/assistente-ia/Utils/constants';
import type { ModoCadastro, FichaCadastro } from '@/components/assistente-ia/Types/cadastro.types';
import type { Conversa } from '@/components/assistente-ia/Types/assistente.types';
import { corConfianca, textoConfianca } from '@/components/assistente-ia/Utils/parser';
import { corStatusScanner, bolinhaStatus, labelStatus } from '@/components/assistente-ia/Utils/scanner';

export function ScannerCadastroPanel({ ctx }: { ctx: any }) {
    const {
    addMsg,
    analisarTextoParaFicha,
    ativarScannerOrigem,
    atualizarCampoFicha,
    audioTranscrito,
    bottomRef,
    cadastroAberto,
    camposFicha,
    cancelarCadastro,
    categorias,
    codigoEscaneadoCadastro,
    comandosRapidosAberto,
    conversacaoAtiva,
    dataRelativa,
    editarCadastro,
    executarAcao,
    fichaCadastro,
    formatarMarkdown,
    fotoPreview,
    gravandoAudio,
    historicoAberto,
    historicoAcoes,
    iniciarGravacaoAudio,
    input,
    inputExpandido,
    inputRef,
    interromperConversacao,
    listening,
    loading,
    messages,
    modoCadastro,
    novoCadastro,
    pararGravacaoAudio,
    placeholderIndex,
    processandoVoz,
    processarMensagem,
    progressoCadastro,
    salvarCadastro,
    scannerDispositivos,
    scannerInputRef,
    scannerLeituras,
    scannerOrigemAtiva,
    scannerPainelAberto,
    scannerUltimoCodigo,
    selecionarFoto,
    setCadastroAberto,
    setComandosRapidosAberto,
    setHistoricoAcoes,
    setInput,
    setInputExpandido,
    setModoCadastro,
    setMsgFichaId,
    setScannerLeituras,
    setScannerPainelAberto,
    simularLeitura,
    speakResponse,
    statusPeca,
    sugestoes,
    toggleVoz,
    transcricaoParcial,
    voiceSettings,
    vozComandosRecentes,
    vozRespondendo
  } = ctx;

  return (
      <>
        {/* SCANNER INTELIGENTE */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="px-4 py-2"><div className="max-w-3xl mx-auto flex items-center gap-2 flex-wrap">
            <button onClick={() => { setScannerPainelAberto(!scannerPainelAberto); if (!scannerPainelAberto) scannerInputRef.current?.focus(); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${scannerPainelAberto ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m4-7V5a2 2 0 00-2-2H8a2 2 0 00-2 2v4m0 0v10a2 2 0 002 2h8a2 2 0 002-2v-2M8 9h8"/></svg>Scanner Inteligente{scannerUltimoCodigo && <span className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-200 px-1.5 py-0.5 rounded-full">{scannerLeituras.length}</span>}</button>
            {!scannerPainelAberto && scannerDispositivos.map((d: any) => (<span key={d.tipo} className="flex items-center gap-1 text-[10px] text-slate-500"><span className={`w-1.5 h-1.5 rounded-full ${bolinhaStatus(d.status)}`} />{d.icon} {d.label}</span>))}
            <button onClick={() => ativarScannerOrigem('camera')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all duration-150 flex-shrink-0">📷 Escanear pela câmera</button>
            <button onClick={simularLeitura} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-dashed border-slate-200 hover:border-slate-300 transition-all flex-shrink-0">🧪 Testar</button>
          </div>
          {scannerPainelAberto && (<div className="max-w-3xl mx-auto mt-2 pt-2 border-t border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200"><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div className="md:col-span-2 space-y-2"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dispositivos</p><div className="grid grid-cols-3 gap-2">{scannerDispositivos.map((d: any) => (<button key={d.tipo} onClick={() => ativarScannerOrigem(d.tipo)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-200 hover:shadow-sm active:scale-[0.97] ${scannerOrigemAtiva === d.tipo ? `shadow-sm ${corStatusScanner(d.status)} ring-2 ring-offset-1 ring-current/20` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}><span className="text-lg">{d.icon}</span><span className="text-[10px] font-semibold leading-tight">{d.label}</span><span className="flex items-center gap-1 text-[9px] font-medium"><span className={`w-1.5 h-1.5 rounded-full ${bolinhaStatus(d.status)}`} />{labelStatus(d.status)}</span></button>))}</div>{scannerUltimoCodigo && (<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200"><svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span className="text-[11px] font-bold text-emerald-800 font-mono">{scannerUltimoCodigo}</span><span className="text-[9px] text-emerald-600 ml-auto">{scannerOrigemAtiva === 'usb' ? '🔌 USB' : scannerOrigemAtiva === 'bluetooth' ? '📡 BT' : '📷 Câmera'}</span></div>)}</div><div><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Histórico</p>{scannerLeituras.length > 0 && <button onClick={() => setScannerLeituras([])} className="text-[9px] text-slate-400 hover:text-red-500 transition-colors">Limpar</button>}</div><div className="max-h-[130px] overflow-y-auto space-y-1 rounded-lg border border-slate-200 bg-white p-1.5">{scannerLeituras.length === 0 ? <p className="text-[10px] text-slate-400 text-center py-3">● Aguardando leitura...</p> : scannerLeituras.slice(0, 15).map((l: any) => (<div key={l.id} className="flex items-center gap-2 px-2 py-1 rounded-md text-[10px] hover:bg-slate-50 transition-colors"><span className="text-[9px]">{l.origem === 'usb' ? '🔌' : l.origem === 'bluetooth' ? '📡' : '📷'}</span><span className="font-mono font-semibold text-slate-700 flex-1 truncate">{l.codigo}</span><span className="text-[9px] text-slate-400 flex-shrink-0">{l.horario.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>))}</div></div></div></div>)}
          </div>
        </div>

        {/* CADASTRO INTELIGENTE (FASE 6) */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-emerald-50/30 via-white to-emerald-50/30">
          <div className="px-4 py-2">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => { setCadastroAberto(!cadastroAberto); if (!cadastroAberto) { setModoCadastro('texto'); setMsgFichaId(null); } }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${cadastroAberto ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  Cadastro Inteligente
                  {progressoCadastro > 0 && (
                    <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full ${cadastroAberto ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                      {progressoCadastro}%
                    </span>
                  )}
                </button>

                {cadastroAberto && (
                  <>
                    <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
                      {([
                        { modo: 'texto' as ModoCadastro, icon: '📝', label: 'Texto' },
                        { modo: 'foto' as ModoCadastro, icon: '📷', label: 'Foto' },
                        { modo: 'audio' as ModoCadastro, icon: '🎤', label: 'Áudio' },
                        { modo: 'codigo' as ModoCadastro, icon: '📷', label: 'Cód.Barras' },
                      ]).map(m => (
                        <button key={m.modo} onClick={() => setModoCadastro(m.modo)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${modoCadastro === m.modo ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/15' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                          {m.icon} <span className="hidden sm:inline">{m.label}</span>
                        </button>
                      ))}
                    </div>
                    {modoCadastro === 'foto' && (
                      <button onClick={selecionarFoto} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all duration-150">
                        📷 Enviar Foto
                      </button>
                    )}
                    {modoCadastro === 'audio' && (
                      <button onClick={gravandoAudio ? pararGravacaoAudio : iniciarGravacaoAudio}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 ${gravandoAudio ? 'bg-red-500 text-white border-red-500 animate-pulse shadow-lg shadow-red-500/30' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
                        {gravandoAudio ? '⏹️ Parar' : '🎤 Gravar'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {cadastroAberto && (
                <div className="mt-2 pt-2 border-t border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200">
                  {fotoPreview && modoCadastro === 'foto' && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Preview da imagem</p>
                      <div className="flex items-start gap-3">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm flex-shrink-0 bg-slate-100"><img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" /></div>
                        <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3"><div className="flex items-center gap-2"><span className="text-lg">🔍</span><div><p className="text-[11px] font-bold text-amber-800">Aguardando analise da IA</p><p className="text-[10px] text-amber-600 mt-0.5">A imagem sera processada para extrair dados do produto automaticamente.</p></div></div></div>
                      </div>
                    </div>
                  )}
                  {modoCadastro === 'audio' && audioTranscrito && (
                    <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><span className="text-lg">🎤</span><p className="text-[11px] font-bold text-blue-800">Áudio transcrito</p></div><p className="text-[10px] text-blue-700 bg-white/60 rounded-lg p-2 font-mono">{audioTranscrito}</p></div>
                  )}
                  {modoCadastro === 'codigo' && codigoEscaneadoCadastro && (
                    <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><span className="text-lg">📷</span><div><p className="text-[11px] font-bold text-emerald-800">Código recebido</p><p className="text-[10px] text-emerald-600 font-mono">{codigoEscaneadoCadastro}</p></div></div></div>
                  )}
                  {modoCadastro === 'codigo' && !codigoEscaneadoCadastro && (
                    <div className="mb-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center"><p className="text-[11px] text-slate-500">Escaneie um código de barras com o scanner USB/Bluetooth ou clique em "🧪 Testar" para simular.</p></div>
                  )}

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-50 to-white px-4 py-2.5 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-lg">🧠</span><div><p className="text-[11px] font-bold text-slate-800">Ficha de Cadastro</p><p className="text-[9px] text-slate-500">{fichaCadastro.nome || 'Novo produto'}</p></div></div><div className="flex items-center gap-2"><div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${progressoCadastro >= 80 ? 'bg-emerald-500' : progressoCadastro >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${progressoCadastro}%` }} /></div><span className={`text-[11px] font-bold ${progressoCadastro >= 80 ? 'text-emerald-600' : progressoCadastro >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>{progressoCadastro}%</span></div></div>
                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {camposFicha.map((campo: any) => (
                        <div key={campo.campo} className={`rounded-lg border p-2 transition-all duration-200 ${campo.status === 'preenchido' ? 'bg-white border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-1"><span className="text-[9px] font-semibold text-slate-500 uppercase">{campo.icon} {campo.label}</span><span className={`text-[9px] font-bold ${campo.status === 'preenchido' ? 'text-emerald-600' : 'text-amber-500'}`}>{campo.status === 'preenchido' ? '✔' : '⚠'}</span></div>
                          {campo.campo === 'categoria' ? (
                            <select value={fichaCadastro.categoriaId || fichaCadastro.categoria} onChange={e => { atualizarCampoFicha('categoriaId', e.target.value); const cat = categorias.find((c: any) => c.id === e.target.value); if (cat) atualizarCampoFicha('categoria', cat.nome); }} className="w-full text-[10px] font-medium text-slate-700 bg-transparent border-none outline-none p-0 cursor-pointer"><option value="">Selecionar...</option>{categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
                          ) : campo.campo === 'observacoes' ? (
                            <textarea value={fichaCadastro.observacoes} onChange={e => atualizarCampoFicha('observacoes', e.target.value)} placeholder="Observações..." rows={2} className="w-full text-[10px] text-slate-700 bg-transparent resize-none outline-none placeholder:text-slate-400 mt-0.5" />
                          ) : campo.campo === 'imagem' ? (
                            campo.status === 'preenchido' ? (<div className="w-full h-10 rounded-md overflow-hidden bg-slate-100 mt-0.5"><img src={fichaCadastro.imagemPreview!} alt="Preview" className="w-full h-full object-cover" /></div>) : (<span className="text-[10px] text-slate-400">Nenhuma imagem</span>)
                          ) : (
                            <input type="text" value={(fichaCadastro as any)[campo.campo] || ''} onChange={e => atualizarCampoFicha(campo.campo as keyof FichaCadastro, e.target.value)} placeholder={campo.status === 'pendente' ? `Informe ${campo.label.toLowerCase()}...` : ''} className="w-full text-[11px] font-medium text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-400 mt-0.5" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5"><div className="flex items-center gap-4 flex-wrap"><div className="flex items-center gap-1.5"><span className="text-[10px] font-semibold text-slate-500">Validação:</span><span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" />{camposFicha.filter((c: any) => c.status === 'preenchido').length} preenchidos</span><span className="text-slate-300">•</span><span className="flex items-center gap-1 text-[10px] font-medium text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400" />{camposFicha.filter((c: any) => c.status === 'pendente').length} pendentes</span></div><div className="flex-1" /><div className="flex items-center gap-1.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${progressoCadastro >= 80 ? 'bg-emerald-100 text-emerald-700' : progressoCadastro >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{fichaCadastro.statusGeral === 'completo' ? '✅ Completo' : fichaCadastro.statusGeral === 'validando' ? '🔄 Validando' : '📝 Rascunho'}</span></div></div></div>
                    <div className="border-t border-slate-100 bg-white px-4 py-2.5 flex items-center gap-2 flex-wrap">
                      <button onClick={salvarCadastro} disabled={progressoCadastro < 30} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 shadow-sm shadow-emerald-600/15 hover:shadow-md hover:shadow-emerald-600/20 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Salvar cadastro</button>
                      <button onClick={editarCadastro} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 active:scale-[0.97]"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>Editar</button>
                      <button onClick={cancelarCadastro} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 border border-transparent hover:border-red-200 active:scale-[0.97]">Cancelar</button>
                      <button onClick={novoCadastro} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-brand-600 hover:bg-brand-50 transition-all duration-150 border border-transparent hover:border-brand-200 active:scale-[0.97] ml-auto"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Novo cadastro</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HISTÓRICO DE AÇÕES */}
        {historicoAberto && (
          <div className="flex-shrink-0 border-b border-slate-200 bg-white animate-in slide-in-from-top-2 fade-in duration-200"><div className="px-4 py-3"><div className="max-w-3xl mx-auto"><div className="flex items-center justify-between mb-2"><p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Histórico de Ações</p>{historicoAcoes.length > 0 && <button onClick={() => setHistoricoAcoes([])} className="text-[9px] text-slate-400 hover:text-red-500 transition-colors">Limpar tudo</button>}</div>{historicoAcoes.length === 0 ? (<p className="text-[11px] text-slate-400 text-center py-3">Nenhuma ação registrada ainda.</p>) : (<div className="max-h-[160px] overflow-y-auto space-y-1">{historicoAcoes.slice(0, 20).map((h: any) => (<div key={h.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"><span className="text-sm flex-shrink-0">{h.icon}</span><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="text-[11px] font-semibold text-slate-700">{h.tipo}</span><div className="w-12 h-1 rounded-full overflow-hidden bg-slate-100 flex-shrink-0"><div className={`h-full rounded-full ${corConfianca(h.confianca)}`} style={{ width: `${h.confianca}%` }} /></div><span className={`text-[9px] font-medium ${textoConfianca(h.confianca)}`}>{h.confianca}%</span></div><p className="text-[10px] text-slate-500 truncate">{h.resumo}</p></div><div className="flex-shrink-0 flex flex-col items-end gap-0.5"><span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${h.resultado === 'sucesso' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{h.resultado === 'sucesso' ? 'OK' : 'Erro'}</span><span className="text-[8px] text-slate-400">{h.horario.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div></div>))}</div>)}</div></div></div>
        )}

        {/* PAINEL DE COMANDOS RÁPIDOS */}
        <div className="flex-shrink-0 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50"><div className="px-4 py-2"><div className="max-w-3xl mx-auto"><div className="flex items-center justify-between"><button onClick={() => setComandosRapidosAberto(!comandosRapidosAberto)} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-brand-700 transition-colors"><svg className={`w-3.5 h-3.5 transition-transform duration-200 ${comandosRapidosAberto ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>Comandos rápidos</button><div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">{ACOES_RAPIDAS.slice(0, 4).map((acao, i) => (<button key={i} onClick={() => { setInput(acao.comando); inputRef.current?.focus(); }} className={`whitespace-nowrap flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all duration-150 flex-shrink-0 hover:scale-[1.02] active:scale-[0.97] ${acao.cor}`}><span className="text-xs">{acao.icon}</span>{acao.label}</button>))}</div></div>{comandosRapidosAberto && (<div className="mt-2.5 pt-2.5 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200"><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">{COMANDOS_GRUPOS.map((grupo, gi) => (<div key={gi} className={`bg-white rounded-xl border border-slate-200 p-2.5 hover:shadow-sm transition-shadow duration-200 border-l-2 ${grupo.cor}`}><p className="text-[10px] font-bold text-slate-700 mb-2 flex items-center gap-1">{grupo.icon} {grupo.titulo}</p><div className="space-y-1">{grupo.comandos.map((cmd, ci) => (<button key={ci} onClick={() => { if (cmd.acao === 'abrirScanner') { setScannerPainelAberto(true); scannerInputRef.current?.focus(); } else if (cmd.acao === 'abrirCadastro') { setCadastroAberto(true); setModoCadastro('texto'); } else { setInput(cmd.comando); inputRef.current?.focus(); } }} className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-150 group ${cmd.cor || 'hover:bg-slate-50'}`}><span className="flex items-center gap-1"><span className="text-[11px]">{cmd.icon}</span>{cmd.label}</span><span className="text-[8px] text-slate-400 block mt-0.5">{cmd.desc}</span></button>))}</div></div>))}</div></div>)}</div></div></div>

        {/* ================================================================ */}
        {/* COMANDOS RÁPIDOS POR VOZ — ÚLTIMOS UTILIZADOS (FASE 7) */}
        {/* ================================================================ */}
        {vozComandosRecentes.length > 0 && (
          <div className="flex-shrink-0 border-b border-slate-100 bg-gradient-to-r from-brand-50/30 via-white to-brand-50/30">
            <div className="px-4 py-2"><div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <span className="text-[9px] font-semibold text-brand-500 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                  Últimos comandos de voz
                </span>
                {vozComandosRecentes.slice(0, 10).map((cmd: any) => (
                  <button key={cmd.id} onClick={() => { setInput(cmd.comando); inputRef.current?.focus(); }}
                    className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] ${cmd.resultado === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : cmd.resultado === 'erro' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                    <span className="text-[11px]">{cmd.icon}</span>
                    <span className="max-w-[120px] truncate">{cmd.comando}</span>
                    <span className="text-[8px] opacity-60 ml-0.5">{cmd.horario.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </button>
                ))}
              </div>
            </div></div>
          </div>
        )}

        {/* ================================================================ */}
        {/* MENSAGENS */}
        {/* ================================================================ */}
        <div className="flex-1 overflow-y-auto bg-[#F3F6FB]">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] ${m.role === 'user' ? 'bg-brand-600 text-white rounded-2xl rounded-br-md shadow-sm shadow-brand-600/15 px-4 py-2.5' : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-md shadow-sm hover:shadow-md transition-shadow duration-300 px-4 py-3'}`}>
                  {m.role === 'assistant' && !m.id.startsWith('welcome') && (
                    <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-100">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm shadow-brand-600/20"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5"/></svg></div>
                      <span className="text-[10px] font-semibold text-brand-700">Assistente IA</span>
                      {vozRespondendo && <span className="flex items-center gap-1 text-[9px] text-amber-600 ml-auto"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"/>Respondendo...</span>}
                      <span className="ml-auto text-[9px] text-slate-400">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatarMarkdown(m.content) }} />

                  {/* TRACE */}
                  {m.trace && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-3 space-y-2">
                        <div className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg><span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Entendimento da IA</span></div>
                        <div className="flex items-start gap-2"><span className="text-[9px] font-semibold text-slate-400 w-14 flex-shrink-0 pt-0.5">📝 Frase:</span><span className="text-[10px] text-slate-600 bg-slate-100 rounded-md px-2 py-0.5 flex-1 font-mono">{m.trace.frase}</span></div>
                        <div className="flex items-center gap-2"><span className="text-[9px] font-semibold text-slate-400 w-14 flex-shrink-0">🎯 Intenção:</span><span className={`text-[10px] font-bold ${INTENT_STYLES[m.trace.intent]?.cor || 'text-slate-700'}`}>{m.trace.intentLabel}</span><div className="flex items-center gap-1.5 ml-auto"><div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${corConfianca(m.trace.confianca)}`} style={{ width: `${m.trace.confianca}%` }} /></div><span className={`text-[10px] font-bold ${textoConfianca(m.trace.confianca)}`}>{m.trace.confianca}%</span></div></div>
                        <div className="flex items-start gap-2"><span className="text-[9px] font-semibold text-slate-400 w-14 flex-shrink-0 pt-0.5">⚡ Ação:</span><span className="text-[10px] text-slate-700">{m.trace.acao}{m.trace.params.length > 0 && ' • ' + m.trace.params.join(' • ')}</span></div>
                        <div className="flex items-start gap-2"><span className="text-[9px] font-semibold text-slate-400 w-14 flex-shrink-0 pt-0.5">{m.trace.sucesso ? '✅' : '❌'} Resultado:</span><span className={`text-[10px] font-medium ${m.trace.sucesso ? 'text-emerald-700' : 'text-red-700'}`}>{m.trace.resumo}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Tabela de produtos */}
                  {m.data && !m.actions && m.data.pecas && (<div className="mt-3 overflow-hidden rounded-xl border border-slate-200"><div className="max-h-[320px] overflow-y-auto"><table className="w-full text-[11px]"><thead className="sticky top-0 bg-slate-50"><tr><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Código</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Nome</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 hidden sm:table-cell">Categoria</th><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Estoque</th><th className="text-right font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 hidden sm:table-cell">Valor</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 hidden md:table-cell">Localização</th></tr></thead><tbody>{m.data.pecas.slice(0, 20).map((p: any, i: number) => { const st = statusPeca(p.quantidade || 0, p.estoqueMinimo || 5); return (<tr key={i} className={`transition-colors duration-150 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}><td className="px-3 py-2 border-b border-slate-100 font-mono text-[10px] text-brand-700 font-semibold">{p.codigo}</td><td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{p.nome}</td><td className="px-3 py-2 border-b border-slate-100 text-slate-500 hidden sm:table-cell">{p.categoria?.nome || '-'}</td><td className="px-3 py-2 border-b border-slate-100 text-center"><div className="flex flex-col items-center gap-0.5"><span className={`font-semibold ${st.cor}`}>{p.quantidade || 0}</span>{(p.quantidadeLoja || 0) > 0 && <span className="text-[9px] text-slate-400">Loja: {p.quantidadeLoja}</span>}</div></td><td className="px-3 py-2 border-b border-slate-100 text-right font-medium text-slate-700 hidden sm:table-cell">{Number(p.precoVenda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="px-3 py-2 border-b border-slate-100 text-slate-500 hidden md:table-cell text-[10px]">{p.localizacao || '-'}</td></tr>); })}</tbody></table></div>{m.data.pecas.length > 20 && <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-center"><span className="text-[10px] font-medium text-slate-500">+{m.data.pecas.length - 20} produtos não exibidos</span></div>}</div>)}
                  {m.data && !m.actions && m.data.ranking && (<div className="mt-3 overflow-hidden rounded-xl border border-slate-200"><div className="max-h-[320px] overflow-y-auto"><table className="w-full text-[11px]"><thead className="sticky top-0 bg-slate-50"><tr><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 w-8">#</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Produto</th><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Qtd</th><th className="text-right font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Faturamento</th></tr></thead><tbody>{m.data.ranking.map((r: any, i: number) => (<tr key={i} className={`transition-colors duration-150 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}><td className="px-3 py-2 border-b border-slate-100 text-center font-bold">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-slate-400">{i + 1}</span>}</td><td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{r.nome}</td><td className="px-3 py-2 border-b border-slate-100 text-center font-semibold text-slate-700">{r.qtd} un.</td><td className="px-3 py-2 border-b border-slate-100 text-right font-semibold text-emerald-700">{r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>))}</tbody></table></div></div>)}
                  {m.data && !m.actions && m.data.parados && (<div className="mt-3 overflow-hidden rounded-xl border border-slate-200"><div className="max-h-[320px] overflow-y-auto"><table className="w-full text-[11px]"><thead className="sticky top-0 bg-slate-50"><tr><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 w-8">#</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Produto</th><th className="text-center font-semibold text-slate-500 px-3 py-2 border-b border-slate-200">Estoque</th><th className="text-left font-semibold text-slate-500 px-3 py-2 border-b border-slate-200 hidden sm:table-cell">Categoria</th></tr></thead><tbody>{m.data.parados.map((p: any, i: number) => (<tr key={i} className={`transition-colors duration-150 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}><td className="px-3 py-2 border-b border-slate-100 text-center text-slate-400">{i + 1}</td><td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{p.nome}</td><td className="px-3 py-2 border-b border-slate-100 text-center"><span className="font-semibold text-amber-600">{p.quantidade} un.</span></td><td className="px-3 py-2 border-b border-slate-100 text-slate-500 hidden sm:table-cell">{p.categoria?.nome || '-'}</td></tr>))}</tbody></table></div></div>)}

                  {/* Cards de ação */}
                  {m.actions && m.actions.length > 0 && (<div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{m.actions.map((action: any, i: any) => (<div key={i} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-xs font-semibold text-slate-800 mb-1">{action.title}</p><p className="text-[11px] text-slate-500 mb-3">{action.description}</p><div className="flex items-center gap-2"><button onClick={() => executarAcao(action, m.id)} className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all duration-200 shadow-sm shadow-brand-600/15 hover:shadow-md hover:shadow-brand-600/20 active:scale-[0.97]">Confirmar</button><button onClick={() => { addMsg('Comando cancelado.', 'assistant'); if (voiceSettings.responderPorVoz) speakResponse('Comando cancelado.'); }} className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button></div></div>))}</div>)}
                </div>
              </div>
            ))}
            {loading && (<div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300"><div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm max-w-[85%]"><div className="flex items-center gap-2.5 mb-3"><div className="w-6 h-6 rounded-lg bg-slate-200 animate-pulse" /><div className="h-3 w-20 rounded bg-slate-200 animate-pulse" /></div><div className="space-y-2"><div className="h-2.5 w-64 rounded bg-slate-100 animate-pulse" /><div className="h-2.5 w-48 rounded bg-slate-100 animate-pulse" /><div className="h-2.5 w-56 rounded bg-slate-100 animate-pulse" /><div className="h-6 w-32 rounded-lg bg-slate-100 animate-pulse mt-3" /></div></div></div>)}
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
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ================================================================ */}
        {/* MODO CONVERSAÇÃO — OVERLAY DE ONDAS SONORAS (FASE 7) */}
        {/* ================================================================ */}
        {conversacaoAtiva && (
          <div className="flex-shrink-0 bg-gradient-to-r from-brand-50 via-white to-brand-50 border-t border-brand-200 animate-in fade-in duration-300">
            <div className="px-4 py-4">
              <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
                {/* Forma de onda animada */}
                <div className="flex items-center justify-center gap-1 h-12">
                  {[0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0].map((h: any, i: any) => (
                    <div key={i} className="w-1.5 rounded-full bg-brand-500 animate-pulse"
                      style={{
                        height: `${8 + h * 6}px`,
                        animationDelay: `${i * 80}ms`,
                        opacity: 0.5 + (h * 0.1),
                      }}
                    />
                  ))}
                </div>

                {/* Indicador "Escutando..." */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                        <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                      </div>
                      <div className="absolute -inset-1 rounded-full bg-red-400/30 animate-ping" />
                      <div className="absolute -inset-3 rounded-full bg-red-300/20 animate-pulse" />
                      <div className="absolute -inset-5 rounded-full bg-red-200/10 animate-pulse" style={{ animationDelay: '200ms' }}/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-600">Escutando...</p>
                      <p className="text-[10px] text-slate-500">Fale naturalmente — a IA vai entender</p>
                    </div>
                  </div>
                </div>

                {/* Transcrição em tempo real */}
                <div className="w-full max-w-lg bg-white rounded-2xl border border-brand-200 shadow-sm p-4 min-h-[60px]">
                  {transcricaoParcial ? (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {transcricaoParcial}
                      <span className="inline-block w-0.5 h-4 bg-brand-600 ml-0.5 animate-pulse align-middle" />
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic text-center">Diga algo...</p>
                  )}
                </div>

                {/* Botão Interromper */}
                <button onClick={interromperConversacao}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-red-300 text-red-600 font-bold text-sm hover:bg-red-50 hover:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                  Interromper
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INPUT + CONTROLES + SUGESTÕES */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            {sugestoes.length > 0 && !inputExpandido && !cadastroAberto && !conversacaoAtiva && (<div className="pt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide animate-in fade-in slide-in-from-bottom-1 duration-150"><span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">Sugestões:</span>{sugestoes.map((s: any, i: any) => (<button key={i} onClick={() => { setInput(s.comando); inputRef.current?.focus(); }} className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all duration-150 flex-shrink-0 active:scale-[0.97]"><span className="text-[11px]">{s.icon}</span>{s.label}</button>))}</div>)}
            <div className="py-3 flex items-end gap-2">
              <button className="p-2 rounded-xl text-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-all duration-150 flex-shrink-0 opacity-50 cursor-not-allowed" title="Anexar imagem (em breve)" disabled><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></button>
              {/* Botão microfone — MODO CONVERSAÇÃO */}
              <button onClick={toggleVoz}
                className={`p-2 rounded-xl transition-all duration-300 flex-shrink-0 relative ${
                  listening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
                    : conversacaoAtiva
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-105'
                      : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                }`}
                title={listening ? 'Ouvindo...' : conversacaoAtiva ? 'Conversação ativa' : 'Ativar conversação por voz'}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                {listening && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white animate-ping" />}
              </button>
              <div className="flex-1 relative">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !inputExpandido) { e.preventDefault(); cadastroAberto && modoCadastro === 'texto' ? analisarTextoParaFicha() : processarMensagem(); } }} rows={inputExpandido ? 6 : 1} className="w-full resize-none border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2.5 pr-20 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 focus:bg-white placeholder:text-slate-400 transition-all duration-200 min-h-[44px]" placeholder={conversacaoAtiva ? '🎤 Modo Conversação ativo — fale naturalmente...' : listening ? '🎤 Ouvindo...' : cadastroAberto && modoCadastro === 'texto' ? 'Descreva o produto... Ex: "Filtro de oleo Fazer 250, marca Tecfil, preco 39,90, quantidade 20"' : PLACEHOLDERS[placeholderIndex]} disabled={listening} />
                <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                  {input.length > 0 && <span className={`text-[10px] font-medium transition-colors duration-200 ${input.length > 200 ? 'text-red-500' : input.length > 150 ? 'text-amber-500' : 'text-slate-400'}`}>{input.length}</span>}
                  {input.length > 0 && <button onClick={() => { setInput(''); inputRef.current?.focus(); }} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}
                  <button onClick={() => { setInputExpandido(!inputExpandido); setTimeout(() => inputRef.current?.focus(), 50); }} className={`p-1 rounded-md transition-all duration-200 ${inputExpandido ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`} title={inputExpandido ? 'Recolher' : 'Expandir'}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{inputExpandido ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>}</svg></button>
                </div>
              </div>
              <button onClick={() => cadastroAberto && modoCadastro === 'texto' ? analisarTextoParaFicha() : processarMensagem()} disabled={(!input.trim() && (!cadastroAberto || modoCadastro !== 'texto')) || loading} className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-brand-600/20 hover:shadow-md hover:shadow-brand-600/25 active:scale-[0.95] flex-shrink-0" title="Enviar"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg></button>
            </div>
          </div>
        </div>
      </>
  );
}

// ============================================================
// COMPONENTE: ITEM DE CONVERSA NA SIDEBAR
// ============================================================
function ConversaItem({ conv, active, onSelect, onToggleFav, dataRelativa }: { conv: Conversa; active: boolean; onSelect: () => void; onToggleFav: () => void; dataRelativa: (d: Date) => string; }) {
  return (<button onClick={onSelect} className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all duration-200 group flex items-center gap-2 ${active ? 'bg-brand-50 border border-brand-200 text-brand-800 shadow-sm' : 'hover:bg-slate-100 text-slate-600 border border-transparent'}`}><span className="flex-1 min-w-0"><span className="font-medium truncate block leading-tight">{conv.titulo}</span><span className="text-[10px] text-slate-400 block mt-0.5">{dataRelativa(conv.data)}</span></span><span onClick={(e) => { e.stopPropagation(); onToggleFav(); }} className={`flex-shrink-0 p-0.5 rounded transition-all duration-200 ${conv.favorita ? 'text-amber-500' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-400'}`} title={conv.favorita ? 'Remover favorito' : 'Favoritar'}><svg className="w-3.5 h-3.5" fill={conv.favorita ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg></span></button>);
}
