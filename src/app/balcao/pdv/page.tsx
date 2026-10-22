'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import CarrinhoPDV, { ItemCarrinho } from '@/components/pdv/CarrinhoPDV';
import PagamentoModal from '@/components/pdv/PagamentoModal';
import ComprovanteVenda from '@/components/pdv/ComprovanteVenda';
import VendaRapida from '@/components/pdv/VendaRapida';
import ScannerUniversal from '@/components/scanner/ScannerUniversal';

interface Pagamento {
  tipo: string;
  valor: number;
  troco: number;
  bandeira?: string;
  parcelas?: number;
}

interface VendaCompleta {
  numero: number;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  clienteCpf?: string | null;
  subtotal: number;
  descontoTotal: number;
  total: number;
  createdAt: string;
  itens: any[];
  pagamentos: Pagamento[];
}

export default function BalcaoPdvPage() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [showCliente, setShowCliente] = useState(false);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [vendaFinalizada, setVendaFinalizada] = useState<VendaCompleta | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const preloadRef = useRef(false);
  const hydratedRef = useRef(false);
  const CARRINHO_KEY = 'pdv_carrinho';

  // BLOCO 5 — Persistência do carrinho:
  // 1. Hidrata o carrinho salvo em sessionStorage('pdv_carrinho') ao montar
  //    (navegar para fora e voltar / refresh / fechar modal mantém os itens).
  // 2. Consome itens pré-carregados via sessionStorage('pdv_preload')
  //    (Estoque → VENDER / Adicionar ao Carrinho) mesclando por cima.
  // 3. Um effect separado grava sessionStorage('pdv_carrinho') sempre que o
  //    carrinho mudar — limpo apenas em venda concluída ou cancelar explícito.
  useEffect(() => {
    if (preloadRef.current) return;
    preloadRef.current = true;
    (async () => {
      // 1) Hidratar carrinho persistido (nunca limpar aqui — a limpeza é
      //    exclusiva de venda concluída / cancelamento explícito).
      let persistido: ItemCarrinho[] = [];
      try {
        const raw = sessionStorage.getItem(CARRINHO_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) persistido = parsed;
        }
      } catch { /* ignore parse errors */ }
      if (persistido.length > 0) setItens(persistido);

      let preloadData: any[] = [];
      try {
        const raw = sessionStorage.getItem('pdv_preload');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) preloadData = parsed;
        }
      } catch { /* ignore parse errors */ }
      try { sessionStorage.removeItem('pdv_preload'); } catch { /* cleanup */ }

      if (preloadData.length === 0) {
        hydratedRef.current = true;
        return;
      }

      // Busca dados completos de cada peca via API
      const novosItems: ItemCarrinho[] = [];
      for (const pre of preloadData) {
        try {
          const res = await fetch(`/api/pecas/${pre.pecaId}`);
          if (!res.ok) { console.warn('[PDV] Peca nao encontrada ou erro:', pre.pecaId, res.status); continue; }
          const peca = await res.json();
          if (!peca || !peca.id || !peca.ativo) { console.warn('[PDV] Peca inativa ou invalida:', pre.pecaId); continue; }
          if (!Number.isFinite(Number(peca.precoVenda)) || Number(peca.precoVenda) <= 0) {
            setErro(`"${peca.nome}" não tem preço cadastrado (R$ 0,00). Corrija o cadastro antes de vender.`);
            continue;
          }
          novosItems.push({
            id: `${peca.id}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
            pecaId: peca.id,
            nome: peca.nome,
            codigo: peca.codigo,
            imagemUrl: peca.imagemUrl,
            precoOriginal: Number(peca.precoVenda),
            precoUnitario: Number(peca.precoVenda),
            descontoPercent: 0,
            descontoReais: 0,
            quantidade: pre.quantidade || 1,
            subtotal: Number(peca.precoVenda) * (pre.quantidade || 1),
            reservado: false,
          });
        } catch (err) { console.error('[PDV] Erro ao buscar peca para carrinho:', pre.pecaId, err); }
      }

      if (novosItems.length === 0) {
        hydratedRef.current = true;
        return;
      }

      setItens(prev => {
        const merged = [...prev];
        for (const novo of novosItems) {
          const existente = merged.find(i => i.pecaId === novo.pecaId);
          if (existente) {
            existente.quantidade += novo.quantidade;
            existente.subtotal = existente.precoUnitario * existente.quantidade;
          } else {
            merged.push(novo);
          }
        }
        return merged;
      });
      hydratedRef.current = true;
    })();
  }, []);

  // BLOCO 5 — grava o carrinho em sessionStorage a cada mudança, exceto logo
  // após o mount (evita sobrescrever o item persistido antes da hidratação).
  useEffect(() => {
    if (!hydratedRef.current) return;
    try { sessionStorage.setItem(CARRINHO_KEY, JSON.stringify(itens)); } catch { /* sessionStorage indisponivel */ }
  }, [itens]);

  // Atualizacoes do carrinho
  const updateQuantidade = useCallback((id: string, qtd: number) => {
    setItens(prev => prev.map(item => {
      if (item.id !== id) return item;
      const novoSub = item.precoUnitario * qtd;
      return { ...item, quantidade: qtd, subtotal: novoSub };
    }));
  }, []);
  const updateObservacao = useCallback((id: string, obs: string) => {
    setItens(prev => prev.map(item => item.id === id ? { ...item, observacao: obs } : item));
  }, []);

  const removerItem = useCallback((id: string) => {
    setItens(prev => prev.filter(i => i.id !== id));
  }, []);

  const adicionarItem = useCallback((item: ItemCarrinho) => {
    setItens(prev => {
      const existente = prev.find(i => i.pecaId === item.pecaId);
      if (existente) {
        return prev.map(i => {
          if (i.pecaId !== item.pecaId) return i;
          const novaQtd = i.quantidade + 1;
          return { ...i, quantidade: novaQtd, subtotal: i.precoUnitario * novaQtd };
        });
      }
      return [...prev, item];
    });
  }, []);

  const cancelarPedido = useCallback(async () => {
    if (pedidoId) {
      try {
        await fetch('/api/pedidos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: pedidoId, status: 'CANCELADO' }),
        });
      } catch { /* ignore */ }
    }
    setItens([]);
    setPedidoId(null);
    setClienteTelefone('');
    setClienteNome('');
    setShowCliente(false);
    setErro('');
    // BLOCO 5 — cancelamento explícito limpa o carrinho persistido.
    try { sessionStorage.removeItem(CARRINHO_KEY); } catch { /* ignore */ }
  }, [pedidoId]);

  // BLOCO 2 — nenhuma venda sem sessão de caixa ABERTA (proteção no frontend)
  const verificarCaixaAberto = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/caixa');
      const data = await res.json();
      if (data?.sessaoAberta) return true;
      setErro('Nenhum caixa aberto. Abra o caixa antes de realizar uma venda.');
    } catch {
      setErro('Não foi possível verificar o caixa. Tente novamente.');
    }
    return false;
  }, []);

  const handleFinalizar = useCallback(async () => {
    if (itens.length === 0) return;
    setErro('');
    // BLOCO 2 — bloqueia antes de criar pedido / abrir pagamento
    if (!(await verificarCaixaAberto())) return;
    // FASE 15-N: impede venda com itens sem preço (R$ 0,00) — não inventar preço
    const semPreco = itens.filter(i => !Number.isFinite(i.precoUnitario) || i.precoUnitario <= 0);
    if (semPreco.length > 0) {
      setErro(`${semPreco.length} ${semPreco.length === 1 ? 'item' : 'itens'} sem preço cadastrado (R$ 0,00). Corrija o cadastro antes de vender.`);
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setErro('Venda sem valor (R$ 0,00). Não é possível finalizar.');
      return;
    }

    // Se pedido ja existe (re-tentativa), vai direto para pagamento
    if (pedidoId) {
      // Atualiza cliente se preenchido (opcional, discreto)
      if (clienteNome || clienteTelefone) {
        try {
          await fetch('/api/pedidos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pedidoId, clienteNome, clienteTelefone }),
          });
        } catch { /* dados do cliente sao opcionais */ }
      }
      setPagamentoOpen(true);
      return;
    }

    // FLUXO DIRETO: cria pedido → abre o modal de pagamento imediatamente.
    // Sem etapa intermediária de cliente (cliente é opcional e discreto).
    setLoading(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'VENDA',
          origem: 'PDV',
          itens: itens.map(i => ({
            pecaId: i.pecaId,
            quantidade: i.quantidade,
            precoOriginal: i.precoOriginal,
            descontoPercent: i.descontoPercent,
            descontoReais: i.descontoReais,
            precoUnitario: i.precoUnitario,
            observacao: i.observacao,
            reservado: i.reservado,
          })),
          clienteNome: clienteNome || undefined,
          clienteTelefone: clienteTelefone || undefined,
        }),
      });
      const pedido = await res.json();
      if (pedido.error) {
        setErro(pedido.error);
        setLoading(false);
        return;
      }
      setPedidoId(pedido.id);
    } catch {
      setErro('Erro ao criar pedido');
      setLoading(false);
      return;
    }
    setLoading(false);

    // Abre o modal de pagamento direto (mesmo fluxo que antes era "Ir para Pagamento")
    setPagamentoOpen(true);
  }, [itens, pedidoId, clienteTelefone, clienteNome, verificarCaixaAberto]);

  const handleConfirmarPagamento = useCallback(async (pagamentos: Pagamento[], trocoTotal: number) => {
    setPagamentoOpen(false);
    setLoading(true);
    setErro('');

    try {
      // Recalcular pagamentos com troco
      const pgsProcessados = pagamentos.map(p => ({
        ...p,
        troco: p.tipo === 'DINHEIRO' ? trocoTotal : 0,
      }));

      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId, pagamentos: pgsProcessados }),
      });
      const venda = await res.json();

      if (venda.error) {
        setErro(typeof venda.error === 'string' ? venda.error : 'Erro ao processar pagamento');
        setLoading(false);
        return;
      }

      setVendaFinalizada(venda);
      setItens([]);
      setPedidoId(null);
      setClienteTelefone('');
      setClienteNome('');
      setShowCliente(false);
      // BLOCO 5 — venda concluída com sucesso limpa o carrinho persistido.
      try { sessionStorage.removeItem(CARRINHO_KEY); } catch { /* ignore */ }
    } catch {
      setErro('Erro ao processar venda. Tente novamente.');
    }
    setLoading(false);
  }, [pedidoId]);

  const handleScannerDetect = useCallback(async (code: string, _origem: string) => {
    setScannerOpen(false);
    setErro('');
    setLoading(true);
    try {
      const res = await fetch(`/api/pecas/pesquisa?q=${encodeURIComponent(code)}&loja=true`);
      const data = await res.json();
      if (data.pecas && data.pecas.length > 0) {
        const peca = data.pecas[0];
        if (!Number.isFinite(Number(peca.precoVenda)) || Number(peca.precoVenda) <= 0) {
          setErro(`"${peca.nome}" não tem preço cadastrado (R$ 0,00). Corrija o cadastro antes de vender.`);
          return;
        }
        const novo: ItemCarrinho = {
          id: `${peca.id}-${Date.now()}`,
          pecaId: peca.id,
          nome: peca.nome,
          codigo: peca.codigo,
          imagemUrl: peca.imagemUrl,
          // precoVenda chega como texto (Decimal do Prisma) — mesma conversão do preload
          precoOriginal: Number(peca.precoVenda),
          precoUnitario: Number(peca.precoVenda),
          descontoPercent: 0,
          descontoReais: 0,
          quantidade: 1,
          subtotal: Number(peca.precoVenda),
          reservado: false,
        };
        adicionarItem(novo);
      } else {
        setErro(`Produto nao encontrado para: ${code}`);
      }
    } catch {
      setErro('Erro ao buscar produto escaneado');
    }
    setLoading(false);
  }, [adicionarItem]);

  const handleReservar = useCallback(async () => {
    if (!pedidoId) return;
    try {
      await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pedidoId, status: 'RESERVADO' }),
      });
      setItens(prev => prev.map(i => ({ ...i, reservado: true })));
    } catch { /* ignore */ }
  }, [pedidoId]);

  const handleLiberarReserva = useCallback(async () => {
    if (!pedidoId) return;
    try {
      await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pedidoId, status: 'ABERTO' }),
      });
      setItens(prev => prev.map(i => ({ ...i, reservado: false })));
    } catch { /* ignore */ }
  }, [pedidoId]);

  const novaVenda = useCallback(() => {
    setVendaFinalizada(null);
    setItens([]);
    setPedidoId(null);
    setErro('');
    // BLOCO 5 — "Nova venda" (após fechar o comprovante) também zera o persistido.
    try { sessionStorage.removeItem(CARRINHO_KEY); } catch { /* ignore */ }
  }, []);

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Indicador visual do caixa (somente leitura — a trava real continua em verificarCaixaAberto)
  const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null);
  useEffect(() => {
    let ativo = true;
    fetch('/api/caixa').then(r => r.json()).then(d => { if (ativo) setCaixaAberto(!!d?.sessaoAberta); }).catch(() => {});
    return () => { ativo = false; };
  }, [vendaFinalizada]);

  const iconeCliente = 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
  const atalhosCaixa = [
    { label: 'Estoque da loja', detalhe: 'Consultar saldo e vender', href: '/balcao/estoque', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', cor: 'bg-emerald-50 text-emerald-600' },
    { label: 'Receber O.S.', detalhe: 'Ordens de serviço', href: '/balcao/ordens', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', cor: 'bg-violet-50 text-violet-600' },
    { label: 'Caixa', detalhe: 'Abertura e fechamento', href: '/balcao/caixa', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', cor: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="h-full flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_480px] min-h-0">
      {/* Coluna esquerda: área de venda */}
      <section className="flex flex-col min-w-0 lg:min-h-0 lg:h-full">
        {/* Header PDV */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200/80 bg-white flex-shrink-0">
          <div className="min-w-0">
            <p className="eyebrow">Ponto de venda</p>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight mt-0.5">Caixa rápido</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            {caixaAberto !== null && (
              caixaAberto ? (
                <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-medium text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-600/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="hidden min-[420px]:inline">Caixa aberto</span>
                </span>
              ) : (
                <a href="/balcao/caixa" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-medium text-amber-800 bg-amber-50 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Caixa fechado · abrir
                </a>
              )
            )}
            <button
              onClick={() => { setShowCliente(!showCliente); }}
              aria-pressed={showCliente}
              className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px] font-medium transition-colors ${showCliente || clienteNome || clienteTelefone ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={iconeCliente}/></svg>
              <span className="hidden min-[420px]:inline max-w-[140px] truncate">{clienteNome || 'Cliente'}</span>
            </button>
            <button
              onClick={() => setScannerOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#0F1A2E] text-white text-[13px] font-medium hover:bg-[#1b2a45] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
              <span className="hidden min-[420px]:inline">Scanner</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 lg:px-8 py-4 lg:py-5 gap-3">
          {/* Erro */}
          {erro && (
            <div className="flex-shrink-0 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-medium" role="alert">
              {erro}
            </div>
          )}

          {/* Cliente rapido — OPCIONAL e discreto. Não bloqueia o pagamento:
              FINALIZAR VENDA já abre o modal de pagamento direto. */}
          {showCliente && (
            <div className="flex-shrink-0 p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[13px] font-semibold text-slate-800">Dados do cliente <span className="font-normal text-slate-400">(opcional)</span></p>
                <button onClick={() => setShowCliente(false)} className="text-[12px] text-slate-500 hover:text-slate-800">Ocultar</button>
              </div>
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500">Telefone</label>
                  <input
                    type="tel"
                    value={clienteTelefone}
                    onChange={e => setClienteTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="input-field mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500">Nome</label>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={e => setClienteNome(e.target.value)}
                    placeholder="Nome do cliente"
                    className="input-field mt-1 text-sm"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Os dados são opcionais. Ao finalizar a venda, o pagamento abre direto.
              </p>
            </div>
          )}

          {/* Busca + resultados — captura global de digitação desligada com modais abertos */}
          <div className="flex-1 min-h-0">
            <VendaRapida
              onAdicionar={adicionarItem}
              carrinhoItens={itens}
              capturaGlobal={!pagamentoOpen && !vendaFinalizada && !scannerOpen && !loading}
            >
              {/* Área ociosa (sem busca ativa) */}
              {loading ? (
                <div className="h-full min-h-[200px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-[3px] border-brand-600 border-t-transparent rounded-full animate-spin"/>
                    <p className="text-sm text-slate-500">Processando venda...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col gap-3">
                  <div className="hidden sm:flex flex-1 min-h-[180px] rounded-xl border border-dashed border-slate-300/80 bg-white/60 flex-col items-center justify-center text-center px-6 py-8">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <p className="text-[15px] font-semibold text-slate-800">Pronto para vender</p>
                    <p className="text-[13px] text-slate-500 mt-1 max-w-md">Digite o nome, SKU ou marca da peça, ou passe o leitor de código de barras. Os resultados aparecem aqui.</p>
                    <div className="hidden md:flex items-center gap-4 mt-5 text-[12px] text-slate-500">
                      <span className="inline-flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> escolher</span>
                      <span className="inline-flex items-center gap-1.5"><span className="kbd">Enter</span> adicionar</span>
                      <span className="inline-flex items-center gap-1.5"><span className="kbd">Esc</span> fechar</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-shrink-0">
                    {atalhosCaixa.map(a => (
                      <a key={a.href} href={a.href} title={a.label} className="flex items-center justify-center min-[480px]:justify-start gap-3 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all min-w-0">
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.cor}`}>
                          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={a.d}/></svg>
                        </span>
                        <span className="min-w-0 hidden min-[480px]:block">
                          <span className="block text-[13px] font-medium text-slate-800 truncate">{a.label}</span>
                          <span className="hidden lg:block text-[11.5px] text-slate-400 truncate">{a.detalhe}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </VendaRapida>
          </div>
        </div>
      </section>

      {/* Coluna direita: Carrinho */}
      <aside className="w-full border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col flex-1 min-h-[320px] lg:flex-none lg:h-full lg:min-h-0">
        <CarrinhoPDV
          itens={itens}
          onUpdateQuantidade={updateQuantidade}
          onUpdateObservacao={updateObservacao}
          onRemover={removerItem}
          onFinalizar={handleFinalizar}
          onCancelar={cancelarPedido}
          onReservar={pedidoId ? handleReservar : undefined}
          onLiberarReserva={pedidoId ? handleLiberarReserva : undefined}
        />
      </aside>

      {/* Modal de pagamento */}
      <PagamentoModal
        open={pagamentoOpen}
        total={total}
        onClose={() => setPagamentoOpen(false)}
        onConfirmar={handleConfirmarPagamento}
      />

      {/* Comprovante */}
      {vendaFinalizada && (
        <ComprovanteVenda venda={vendaFinalizada} onFechar={novaVenda} />
      )}

      {/* Scanner */}
      {scannerOpen && (
        <ScannerUniversal
          onDetected={handleScannerDetect}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
