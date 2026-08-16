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

  // Consome itens pre-carregados via sessionStorage (Estoque → VENDER / Adicionar ao Carrinho)
  useEffect(() => {
    if (preloadRef.current) return;
    preloadRef.current = true;
    (async () => {
      let preloadData: any[] = [];
      try {
        const raw = sessionStorage.getItem('pdv_preload');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) preloadData = parsed;
        }
      } catch { /* ignore parse errors */ }
      try { sessionStorage.removeItem('pdv_preload'); } catch { /* cleanup */ }

      if (preloadData.length === 0) return;

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

      if (novosItems.length === 0) return;

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
    })();
  }, []);

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
  }, [pedidoId]);

  const handleFinalizar = useCallback(async () => {
    if (itens.length === 0) return;
    setErro('');
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
  }, [itens, pedidoId, clienteTelefone, clienteNome]);

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
          precoOriginal: peca.precoVenda,
          precoUnitario: peca.precoVenda,
          descontoPercent: 0,
          descontoReais: 0,
          quantidade: 1,
          subtotal: peca.precoVenda,
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
  }, []);

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Coluna esquerda: Busca + area livre */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header PDV */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-800">PDV / Balcao</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ponto de Venda</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
              Scanner
            </button>
          </div>
        </div>

        {/* Area de busca e resultados */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex-shrink-0">
          <VendaRapida onAdicionar={adicionarItem} carrinhoItens={itens} />
        </div>

        {/* Erro */}
        {erro && (
          <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-medium">
            {erro}
          </div>
        )}

        {/* Cliente rapido — OPCIONAL e discreto. Não bloqueia o pagamento:
            FINALIZAR VENDA já abre o modal de pagamento direto. */}
        {showCliente && (
          <div className="mx-6 mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-3">Dados do Cliente (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Telefone</label>
                <input
                  type="tel"
                  value={clienteTelefone}
                  onChange={e => setClienteTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="input-field mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Nome</label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={e => setClienteNome(e.target.value)}
                  placeholder="Nome do cliente"
                  className="input-field mt-1 text-sm"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Os dados são opcionais. Ao finalizar a venda, o pagamento abre direto.
            </p>
          </div>
        )}

        {/* Placeholder area - pode conter vitrine de produtos, ultimos vendidos, etc */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* Card de acoes rapidas */}
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <button
                onClick={() => { setShowCliente(!showCliente); }}
                className={`p-4 rounded-xl border text-left transition-all ${showCliente ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-200 hover:border-brand-200 hover:bg-brand-50/50'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <p className="text-xs font-bold text-slate-700">Cliente</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Identificar cliente</p>
              </button>
              <button
                onClick={() => window.location.href = '/balcao/estoque'}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                </div>
                <p className="text-xs font-bold text-slate-700">Estoque</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Consultar e vender</p>
              </button>
              <button
                onClick={() => window.location.href = '/balcao/ordens'}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                </div>
                <p className="text-xs font-bold text-slate-700">O.S.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Receber OS</p>
              </button>
            </div>

            {/* Loading overlay */}
            {loading && (
              <div className="col-span-2 flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/>
                  <p className="text-sm text-slate-500">Processando venda...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coluna direita: Carrinho */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex-shrink-0 flex flex-col max-h-[50vh] sm:max-h-[60vh] lg:max-h-none">
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
      </div>

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
