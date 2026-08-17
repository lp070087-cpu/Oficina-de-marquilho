'use client';

import { useState, useEffect, useRef } from 'react';
import PagamentoModal from '@/components/pdv/PagamentoModal';
import ComprovanteVenda from '@/components/pdv/ComprovanteVenda';

interface Peca { id: string; nome: string; codigo: string; codigoBarras?: string; precoVenda: number; quantidadeLoja: number; quantidade: number; marca?: string; categoria?: { nome: string }; }

interface ItemCarrinhoAvulsa {
  id: string;
  pecaId: string;
  nome: string;
  codigo: string;
  imagemUrl?: string;
  precoOriginal: number;
  precoUnitario: number;
  descontoPercent: number;
  descontoReais: number;
  quantidade: number;
  subtotal: number;
  reservado: boolean;
  observacao?: string;
}

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

export default function VendaAvulsaPage() {
  const [busca, setBusca] = useState('');
  const [barcode, setBarcode] = useState('');
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');
  const [itens, setItens] = useState<ItemCarrinhoAvulsa[]>([]);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [showCliente, setShowCliente] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [vendaFinalizada, setVendaFinalizada] = useState<VendaCompleta | null>(null);
  const [processando, setProcessando] = useState(false);
  const preloadRef = useRef(false);

  const total = itens.reduce((s, i) => s + i.subtotal, 0);

  // Consome itens pré-carregados via sessionStorage (Estoque → VENDER) — mesma ponte do PDV
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
      } catch { /* ignore */ }
      try { sessionStorage.removeItem('pdv_preload'); } catch { /* ignore */ }

      if (preloadData.length === 0) return;

      const novosItems: ItemCarrinhoAvulsa[] = [];
      for (const pre of preloadData) {
        try {
          const res = await fetch(`/api/pecas/${pre.pecaId}`);
          if (!res.ok) { console.warn('[VENDA] Peça não encontrada:', pre.pecaId, res.status); continue; }
          const peca = await res.json();
          if (!peca || !peca.id || !peca.ativo) { console.warn('[VENDA] Peça inativa ou inválida:', pre.pecaId); continue; }
          const preco = Number(peca.precoVenda);
          if (!Number.isFinite(preco) || preco <= 0) {
            setMsg(`"${peca.nome}" está sem preço de venda cadastrado. Cadastre o preço antes de finalizar a venda.`);
            continue;
          }
          novosItems.push({
            id: `${peca.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            pecaId: peca.id,
            nome: peca.nome,
            codigo: peca.codigo,
            imagemUrl: peca.imagemUrl,
            precoOriginal: preco,
            precoUnitario: preco,
            descontoPercent: 0,
            descontoReais: 0,
            quantidade: pre.quantidade || 1,
            subtotal: preco * (pre.quantidade || 1),
            reservado: false,
          });
        } catch (err) { console.error('[VENDA] Erro ao buscar peça:', pre.pecaId, err); }
      }

      if (novosItems.length > 0) setItens(prev => {
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

  async function buscar() {
    setLoading(true); setMsg(''); setMsgOk('');
    const term = (barcode ? barcode : busca).trim();
    if (!term) { setPecas([]); setLoading(false); return; }
    const q = barcode ? `barcode=${encodeURIComponent(term)}` : `q=${encodeURIComponent(term)}`;
    try {
      const res = await fetch(`/api/pecas?${q}`);
      const data = await res.json();
      setPecas(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 1) adicionarPeca(data[0]);
    } catch {
      setMsg('Erro ao buscar produto.');
    }
    setLoading(false);
  }

  function adicionarPeca(peca: Peca) {
    const preco = Number(peca.precoVenda);
    // Regra definitiva (Seção 4): não vender produto sem preço — não inventar preço
    if (!Number.isFinite(preco) || preco <= 0) {
      setMsg(`"${peca.nome}" está sem preço de venda cadastrado (R$ 0,00). Cadastre o preço antes de finalizar a venda.`);
      return;
    }
    setMsg('');
    setPecas([]);
    setBusca('');
    setBarcode('');
    setItens(prev => {
      const existente = prev.find(i => i.pecaId === peca.id);
      if (existente) {
        return prev.map(i => {
          if (i.pecaId !== peca.id) return i;
          const q = i.quantidade + 1;
          return { ...i, quantidade: q, subtotal: i.precoUnitario * q };
        });
      }
      const item: ItemCarrinhoAvulsa = {
        id: `${peca.id}-${Date.now()}`,
        pecaId: peca.id,
        nome: peca.nome,
        codigo: peca.codigo,
        imagemUrl: (peca as any).imagemUrl,
        precoOriginal: preco,
        precoUnitario: preco,
        descontoPercent: 0,
        descontoReais: 0,
        quantidade: 1,
        subtotal: preco,
        reservado: false,
      };
      return [...prev, item];
    });
  }

  function removerItem(id: string) {
    setItens(prev => prev.filter(i => i.id !== id));
  }
  function atualizarQtd(id: string, qtd: number) {
    setItens(prev => prev.map(i => {
      if (i.id !== id) return i;
      const q = Math.max(1, qtd);
      return { ...i, quantidade: q, subtotal: i.precoUnitario * q };
    }));
  }

  async function criarPedido() {
    if (itens.length === 0) return;
    setMsg('');

    // Guarda de preço zero na finalização
    const semPreco = itens.filter(i => !Number.isFinite(i.precoUnitario) || i.precoUnitario <= 0);
    if (semPreco.length > 0) {
      setMsg(`${semPreco.length} ${semPreco.length === 1 ? 'item' : 'itens'} sem preço de venda cadastrado. Cadastre o preço antes de finalizar a venda.`);
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setMsg('Venda sem valor (R$ 0,00). Não é possível finalizar.');
      return;
    }

    setProcessando(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'VENDA',
          origem: 'VENDA_AVULSA',
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
        setMsg(pedido.error);
        setProcessando(false);
        return;
      }
      setPedidoId(pedido.id);
      setShowCliente(true);
    } catch {
      setMsg('Erro ao criar pedido.');
    }
    setProcessando(false);
  }

  async function irParaPagamento() {
    if (!pedidoId) { setMsg('Crie o pedido antes de pagar.'); return; }
    if (clienteNome || clienteTelefone) {
      try {
        await fetch('/api/pedidos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: pedidoId, clienteNome, clienteTelefone }),
        });
      } catch { /* dados do cliente são opcionais */ }
    }
    setPagamentoOpen(true);
  }

  async function confirmarPagamento(pagamentos: Pagamento[], trocoTotal: number) {
    setPagamentoOpen(false);
    setProcessando(true);
    setMsg('');
    try {
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
        setMsg(typeof venda.error === 'string' ? venda.error : 'Erro ao processar pagamento');
        setProcessando(false);
        return;
      }
      // Venda concluída — nota V-XXXX emitida automaticamente no POST /api/vendas
      setVendaFinalizada(venda);
      setItens([]);
      setPedidoId(null);
      setClienteNome('');
      setClienteTelefone('');
      setShowCliente(false);
      setMsgOk(`Venda #${venda.numero} registrada com sucesso — Nota do Cliente emitida automaticamente.`);
    } catch {
      setMsg('Erro ao processar venda. Tente novamente.');
    }
    setProcessando(false);
  }

  function cancelarVenda() {
    if (pedidoId) {
      fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pedidoId, status: 'CANCELADO' }),
      }).catch(() => {});
    }
    setItens([]);
    setPedidoId(null);
    setClienteNome('');
    setClienteTelefone('');
    setShowCliente(false);
    setMsg('');
    setMsgOk('');
  }

  function novaVenda() {
    setVendaFinalizada(null);
    setItens([]);
    setPedidoId(null);
    setMsg('');
    setMsgOk('');
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">VENDA AVULSA</h1>
        <div className="flex items-center gap-2">
          <button onClick={cancelarVenda} disabled={itens.length === 0 && !pedidoId} className="btn-secondary text-xs px-3 py-2 disabled:opacity-40">
            Cancelar
          </button>
          <button onClick={() => { setShowCliente(!showCliente); }} className="btn-secondary text-xs px-3 py-2">
            {showCliente ? 'Ocultar cliente' : 'Identificar cliente'}
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-6">Busque o produto e registre a venda — fluxo unificado (venda → caixa → Nota do Cliente)</p>

      {msgOk && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-bold">{msgOk}</div>}
      {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

      {/* Busca */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={busca} onChange={e => setBusca(e.target.value)} className="input-field flex-1 min-w-[180px]" placeholder="Nome, codigo (SKU) ou codigo de barras..." onKeyDown={e => { if (e.key === 'Enter') buscar(); }} />
        <input value={barcode} onChange={e => setBarcode(e.target.value)} className="input-field w-40" placeholder="Cod. barras..." onKeyDown={e => { if (e.key === 'Enter') buscar(); }} />
        <button onClick={buscar} disabled={loading} className="btn-primary text-xs">Buscar</button>
      </div>

      {loading && <p className="text-xs text-slate-400 mb-4">Buscando...</p>}

      {/* Resultados da busca */}
      {pecas.length > 0 && (
        <div className="card overflow-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="text-left py-2 px-3 font-semibold uppercase">Produto</th>
                <th className="text-left py-2 px-3 font-semibold uppercase">SKU</th>
                <th className="text-left py-2 px-3 font-semibold uppercase">Estoque</th>
                <th className="text-right py-2 px-3 font-semibold uppercase">Preço</th>
                <th className="text-right py-2 px-3 font-semibold uppercase">Ação</th>
              </tr>
            </thead>
            <tbody>
              {pecas.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-medium text-slate-700">{p.nome}</td>
                  <td className="py-2 px-3 text-slate-400 font-mono">{p.codigo}</td>
                  <td className="py-2 px-3 text-slate-500">{(p.quantidadeLoja ?? p.quantidade) || 0} un.</td>
                  <td className={`py-2 px-3 text-right font-bold ${Number(p.precoVenda) > 0 ? 'text-slate-700' : 'text-red-500'}`}>{fm(Number(p.precoVenda) || 0)}</td>
                  <td className="py-2 px-3 text-right">
                    <button onClick={() => adicionarPeca(p)} className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50">
                      + Adicionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dados do cliente (opcional) */}
      {showCliente && (
        <div className="card p-4 mb-4 space-y-3">
          <p className="text-xs font-bold text-slate-700">Dados do Cliente (opcional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Telefone</label>
              <input type="tel" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} placeholder="(81) 99999-9999" className="input-field mt-1 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Nome</label>
              <input type="text" value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Nome do cliente" className="input-field mt-1 text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Carrinho */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Itens da venda ({itens.length})</h3>
          <span className="text-xs text-slate-400">Total: <span className="font-bold text-slate-700">{fm(total)}</span></span>
        </div>
        {itens.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">Nenhum item no carrinho. Busque um produto acima.</p>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-slate-50">
              {itens.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.nome}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.codigo}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => atualizarQtd(item.id, item.quantidade - 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 text-xs bg-slate-100 rounded-lg">−</button>
                    <span className="w-8 text-center text-xs font-bold text-slate-700">{item.quantidade}</span>
                    <button onClick={() => atualizarQtd(item.id, item.quantidade + 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 text-xs bg-slate-100 rounded-lg">+</button>
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-24 text-right">{fm(item.subtotal)}</span>
                  <button onClick={() => removerItem(item.id)} className="text-slate-300 hover:text-red-500 ml-1">×</button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100">
              {!pedidoId ? (
                <button onClick={criarPedido} disabled={processando} className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-50">
                  {processando ? 'Criando pedido...' : `FINALIZAR VENDA · ${fm(total)}`}
                </button>
              ) : (
                <button onClick={irParaPagamento} className="btn-primary w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700">
                  Ir para Pagamento
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <PagamentoModal open={pagamentoOpen} total={total} onClose={() => setPagamentoOpen(false)} onConfirmar={confirmarPagamento} />

      {vendaFinalizada && <ComprovanteVenda venda={vendaFinalizada} onFechar={novaVenda} />}
    </div>
  );
}
