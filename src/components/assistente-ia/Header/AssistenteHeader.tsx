'use client';
import React from 'react';
import { IconeCategoria } from '@/components/assistente-ia/Utils/icons';
import { CATEGORIAS_SIDEBAR } from '@/components/assistente-ia/Utils/constants';

export function AssistenteHeader({ ctx }: { ctx: any }) {
    const {
    acoesIAFaria,
    activeConversaId,
    automacaoAberto,
    categoriaAtiva,
    centralCompras,
    centralOperacionalAberto,
    checklistDefault,
    checklistItens,
    comandosExecutados,
    comprasAberto,
    conversacaoAtiva,
    conversations,
    copilotoAberto,
    dashboardAberto,
    dashboardData,
    dataRelativa,
    diagnosticGeral,
    formatarDataHora,
    fotoInputRef,
    gerenteAberto,
    handleFotoSelecionada,
    historicoAberto,
    historicoAcoes,
    input,
    inputRef,
    limparConversa,
    missoesDefault,
    missoesDia,
    novaConversa,
    pesquisaSidebar,
    pontuacaoEstoque,
    produtosPorCategoria,
    scannerAtivo,
    scannerFlashVerde,
    scannerInputRef,
    selecionarConversa,
    setAutomacaoAberto,
    setCategoriaAtiva,
    setCentralOperacionalAberto,
    setChecklistItens,
    setComprasAberto,
    setCopilotoAberto,
    setDashboardAberto,
    setGerenteAberto,
    setHistoricoAberto,
    setInput,
    setMissoesDia,
    setPesquisaSidebar,
    setSidebarOpen,
    setTarefasIA,
    setVoiceSettingsAberto,
    sidebarOpen,
    tarefasDefault,
    tarefasIA,
    toggleFavorito,
    voiceSettingsAberto,
    conversasFavoritas,
    conversasHoje,
    conversasSemana,
    conversasAnteriores,
  } = ctx;

  function ConversaItem({ conv, active, onSelect, onToggleFav, dataRelativa }: { conv: any; active: boolean; onSelect: () => void; onToggleFav: () => void; dataRelativa: (d: Date) => string; }) {
    return (
      <button onClick={onSelect} className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all duration-200 group flex items-center gap-2 ${active ? 'bg-brand-50 border border-brand-200 text-brand-800 shadow-sm' : 'hover:bg-slate-100 text-slate-600 border border-transparent'}`}>
        <span className="flex-1 min-w-0">
          <span className="font-medium truncate block leading-tight">{conv.titulo}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{dataRelativa(conv.data)}</span>
        </span>
        <span onClick={(e: any) => { e.stopPropagation(); onToggleFav(); }} className={`flex-shrink-0 p-0.5 rounded transition-all duration-200 ${conv.favorita ? 'text-amber-500' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-400'}`} title={conv.favorita ? 'Remover favorito' : 'Favoritar'}>
          <svg className="w-3.5 h-3.5" fill={conv.favorita ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </span>
      </button>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-3.5rem)] bg-white overflow-hidden transition-colors duration-500 ${scannerFlashVerde ? 'bg-emerald-50/30' : ''} ${conversacaoAtiva ? 'bg-gradient-to-br from-brand-50/50 via-white to-brand-50/50' : ''}`}>
      {scannerFlashVerde && (<div className="fixed inset-0 z-50 pointer-events-none"><div className="absolute inset-0 bg-emerald-400/10 animate-in fade-in duration-200" /><div className="absolute inset-0 ring-4 ring-emerald-400/40 ring-inset rounded-none animate-in zoom-in duration-300" /></div>)}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      <input ref={scannerInputRef} type="text" className="absolute w-0 h-0 opacity-0 pointer-events-none" tabIndex={-1} aria-hidden="true" />
      <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" className="absolute w-0 h-0 opacity-0 pointer-events-none" tabIndex={-1} onChange={handleFotoSelecionada} />

      {/* ================================================================ */}
      {/* SIDEBAR ESQUERDA */}
      {/* ================================================================ */}
      <aside className={`fixed md:relative z-30 md:z-auto w-[280px] h-full flex-shrink-0 bg-[#F8FAFC] border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-4 py-4 border-b border-slate-200"><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-md shadow-brand-600/20 flex-shrink-0"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg></div><div className="min-w-0"><p className="text-xs font-bold text-slate-800 truncate">Marquinho</p><p className="text-[10px] text-slate-500 -mt-0.5">Moto Peças</p></div></div></div>
        <div className="px-3 py-3 space-y-2">
          <button onClick={novaConversa} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 text-sm font-medium shadow-sm shadow-brand-600/20 hover:shadow-md hover:shadow-brand-600/25 active:scale-[0.98]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Nova Conversa</button>
          <div className="relative"><svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input value={pesquisaSidebar} onChange={e => setPesquisaSidebar(e.target.value)} placeholder="Pesquisar conversas..." className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-600 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-300 transition-all" />{pesquisaSidebar && <button onClick={() => setPesquisaSidebar('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}</div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1 min-h-0">
          {conversations.length === 0 ? (<div className="px-3 py-6 text-center"><div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-100 flex items-center justify-center"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></div><p className="text-xs text-slate-400">Nenhuma conversa ainda.<br/>Inicie uma nova!</p></div>) : (<>{conversasFavoritas.length > 0 && <><div className="px-3 pt-1 pb-0.5"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">⭐ Favoritos</p></div>{conversasFavoritas.map((conv: any) => <ConversaItem key={conv.id} conv={conv} active={activeConversaId === conv.id} onSelect={() => selecionarConversa(conv)} onToggleFav={() => toggleFavorito(conv.id)} dataRelativa={dataRelativa} />)}</>}{conversasHoje.length > 0 && <><div className="px-3 pt-1 pb-0.5"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hoje</p></div>{conversasHoje.map((conv: any) => <ConversaItem key={conv.id} conv={conv} active={activeConversaId === conv.id} onSelect={() => selecionarConversa(conv)} onToggleFav={() => toggleFavorito(conv.id)} dataRelativa={dataRelativa} />)}</>}{conversasSemana.length > 0 && <><div className="px-3 pt-1 pb-0.5"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Últimos 7 dias</p></div>{conversasSemana.map((conv: any) => <ConversaItem key={conv.id} conv={conv} active={activeConversaId === conv.id} onSelect={() => selecionarConversa(conv)} onToggleFav={() => toggleFavorito(conv.id)} dataRelativa={dataRelativa} />)}</>}{conversasAnteriores.length > 0 && <><div className="px-3 pt-1 pb-0.5"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Anteriores</p></div>{conversasAnteriores.map((conv: any) => <ConversaItem key={conv.id} conv={conv} active={activeConversaId === conv.id} onSelect={() => selecionarConversa(conv)} onToggleFav={() => toggleFavorito(conv.id)} dataRelativa={dataRelativa} />)}</>}</>)}
        </div>
        <div className="border-t border-slate-200 px-3 py-3 max-h-[280px] overflow-y-auto"><div className="flex items-center justify-between mb-2 px-0.5"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Categorias</p><span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{CATEGORIAS_SIDEBAR.length}</span></div><div className="space-y-0.5">{CATEGORIAS_SIDEBAR.map(cat => { const qtd = produtosPorCategoria[cat.slug] ?? '...'; const ativa = categoriaAtiva === cat.slug; return (<button key={cat.slug} onClick={() => { setCategoriaAtiva(ativa ? '' : cat.slug); setInput(`Buscar pecas da categoria ${cat.label}`); inputRef.current?.focus(); }} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] transition-all duration-200 group ${ativa ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-brand-700 border border-transparent hover:border-slate-200 hover:shadow-sm'}`}><span className={`flex-shrink-0 transition-colors duration-200 ${ativa ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-500'}`}><IconeCategoria slug={cat.slug} /></span><span className="flex-1 text-left truncate font-medium">{cat.label}</span><span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-all duration-200 ${ativa ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'}`}>{qtd}</span></button>); })}</div></div>
      </aside>

      {/* ================================================================ */}
      {/* ÁREA PRINCIPAL */}
      {/* ================================================================ */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* HEADER */}
        <header className="flex-shrink-0 border-b border-slate-200 bg-white">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg></button>
              <div><h1 className="text-sm font-bold text-slate-800">Assistente IA do Estoque</h1><div className="flex items-center gap-3 text-[10px] mt-0.5 flex-wrap"><div className="flex items-center gap-1"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span><span className="font-medium text-emerald-600">IA pronta — Fale naturalmente</span></div><span className="text-slate-300 hidden sm:inline">|</span><div className="hidden sm:flex items-center gap-1.5"><svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m4-7V5a2 2 0 00-2-2H8a2 2 0 00-2 2v4m0 0v10a2 2 0 002 2h8a2 2 0 002-2v-2M8 9h8"/></svg>{scannerAtivo ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-emerald-600 font-medium">Scanner conectado</span></span> : <span className="flex items-center gap-1 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" />Aguardando leitura...</span>}</div><span className="text-slate-300 hidden md:inline">|</span><span className="text-slate-500 hidden md:inline">{formatarDataHora()}</span></div></div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Dashboard Fase 8 */}
              <button onClick={() => setDashboardAberto(!dashboardAberto)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${dashboardAberto ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20' : 'text-slate-500 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                <span className="hidden sm:inline">Dashboard</span>
                {dashboardData && <span className="text-[9px] bg-white/20 px-1 rounded-full">{dashboardData.totalProdutos}</span>}
              </button>
              {/* Gerente IA Fase 9 */}
              <button onClick={() => { setGerenteAberto(!gerenteAberto); if (!gerenteAberto && checklistItens.length === 0) setChecklistItens(checklistDefault); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${gerenteAberto ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20' : 'text-slate-500 border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                <span className="hidden sm:inline">Gerente</span>
                {pontuacaoEstoque.score > 0 && <span className="text-[9px] bg-white/20 px-1 rounded-full">{pontuacaoEstoque.score}</span>}
              </button>
              {/* Central Operacional Fase 10 */}
              <button onClick={() => setCentralOperacionalAberto(!centralOperacionalAberto)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${centralOperacionalAberto ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm shadow-cyan-600/20' : 'text-slate-500 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                <span className="hidden sm:inline">Central</span>
                {dashboardData && <span className="text-[9px] bg-white/20 px-1 rounded-full">{acoesIAFaria.length}</span>}
              </button>
              {/* Copiloto Executivo Fase 11 */}
              <button onClick={() => { setCopilotoAberto(!copilotoAberto); if (!copilotoAberto && missoesDia.length === 0) setMissoesDia(missoesDefault); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${copilotoAberto ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20' : 'text-slate-500 border-slate-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>
                <span className="hidden sm:inline">Copiloto</span>
                {diagnosticGeral.nota > 0 && <span className="text-[9px] bg-white/20 px-1 rounded-full">{diagnosticGeral.nota}</span>}
              </button>
              {/* Automação Inteligente Fase 12 */}
              <button onClick={() => { setAutomacaoAberto(!automacaoAberto); if (!automacaoAberto && tarefasIA.length === 0) setTarefasIA(tarefasDefault); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${automacaoAberto ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/20' : 'text-slate-500 border-slate-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span className="hidden sm:inline">Automação</span>
                {tarefasIA.filter((t: any) => t.status === 'pendente').length > 0 && <span className="text-[9px] bg-white/20 px-1 rounded-full">{tarefasIA.filter((t: any) => t.status === 'pendente').length}</span>}
              </button>
              {/* IA Comercial, Compras e Fornecedores Fase 13 */}
              <button onClick={() => setComprasAberto(!comprasAberto)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${comprasAberto ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20' : 'text-slate-500 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                <span className="hidden sm:inline">Compras</span>
                {centralCompras.length > 0 && <span className="text-[9px] bg-white/20 px-1 rounded-full">{centralCompras.length}</span>}
              </button>
              {/* Configurações de Voz */}
              <button onClick={() => setVoiceSettingsAberto(!voiceSettingsAberto)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${voiceSettingsAberto ? 'bg-brand-600 text-white border-brand-600' : 'text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="hidden sm:inline">Voz</span>
              </button>
              <button onClick={() => setHistoricoAberto(!historicoAberto)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${historicoAberto ? 'bg-brand-600 text-white border-brand-600' : 'text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span className="hidden sm:inline">Histórico</span>{historicoAcoes.length > 0 && <span className="text-[9px] bg-white/20 px-1 rounded-full">{historicoAcoes.length}</span>}</button>
              {comandosExecutados > 0 && <span className="hidden lg:flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>{comandosExecutados} comandos</span>}
              <button onClick={limparConversa} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 border border-slate-200 hover:border-red-200"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>Limpar</button>
              <button onClick={novaConversa} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-all duration-150 border border-slate-200 hover:border-brand-300"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Nova</button>
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}
