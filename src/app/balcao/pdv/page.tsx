'use client';

import { useState, useCallback } from 'react';
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

  // Atualizacoes do carrinho
  const updateQuantidade = useCallback((id: string, qtd: number) => {
    setItens(prev => prev.map(item => {
      if (item.id !== id) return item;
      const novoSub = item.precoUnitario * qtd;
      return { ...item, quantidade: qtd, subtotal: novoSub };
    }));
  }, []);

  const updateDescontoPercent = useCallback((id: string, pct: number) => {
    setItens(prev => prev.map(item => {
      if (item.id !== id) return item;
      const descontoReais = item.descontoReais || 0;
      const descPctValor = item.precoOriginal * pct / 100;
      const precoVend = item.precoOriginal - descPctValor - descontoReais;
      const novoSub = Math.max(0, precoVend * item.quantidade);
      return { ...item, descontoPercent: pct, precoUnitario: Math.max(0, precoVend), subtotal: novoSub };
    }));
  }, []);

  const updateDescontoReais = useCallback((id: string, reais: number) => {
    setItens(prev => prev.map(item => {
      if (item.id !== id) return item;
      const descPctValor = item.precoOriginal * item.descontoPercent / 100;
      const precoVend = item.precoOriginal - descPctValor - reais;
      const novoSub = Math.max(0, precoVend * item.quantidade);
      return { ...item, descontoReais: reais, precoUnitario: Math.max(0, precoVend), subtotal: novoSub };
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

    // Cliente rapido: telefone obrigatorio para pedido
    if (showCliente && !clienteTelefone.trim()) {
      setErro('Telefone do cliente e obrigatorio para identificar a venda.');
      return;
    }

    // Criar pedido primeiro
    setShowCliente(true);
    if (!pedidoId) {
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
    }

    // Abrir modal de pagamento
    setPagamentoOpen(true);
  }, [itens, pedidoId, clienteTelefone, clienteNome, showCliente]);

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
    <div className="flex h-full">
      {/* Coluna esquerda: Busca + area livre */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header PDV */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
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

        {/* Cliente rapido */}
        {showCliente && (
          <div className="mx-6 mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-3">Dados do Cliente</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Telefone *</label>
                <input
                  type="tel"
                  value={clienteTelefone}
                  onChange={e => setClienteTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="input-field mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Nome (opcional)</label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={e => setClienteNome(e.target.value)}
                  placeholder="Nome do cliente"
                  className="input-field mt-1 text-sm"
                />
              </div>
            </div>
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
                <p className="text-[10px] text-slate-400 mt-0.5">Venda com telefone</p>
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
      <div className="w-96 border-l border-slate-200 bg-white flex-shrink-0 flex flex-col">
        <CarrinhoPDV
          itens={itens}
          onUpdateQuantidade={updateQuantidade}
          onUpdateDescontoPercent={updateDescontoPercent}
          onUpdateDescontoReais={updateDescontoReais}
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
