'use client';

import { useState, useEffect } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LIST = [
  { key: '', label: 'Todos' },
  { key: 'PEDIDO_RECEBIDO', label: '📥 Recebidos', color: 'bg-sky-100 text-sky-700' },
  { key: 'EM_SEPARACAO', label: '📦 Separando', color: 'bg-amber-100 text-amber-700' },
  { key: 'PRONTO_PARA_RETIRADA', label: '✅ Prontos', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'RETIRADO', label: '🏁 Retirados', color: 'bg-slate-100 text-slate-600' },
  { key: 'CANCELADO', label: '❌ Cancelados', color: 'bg-red-100 text-red-700' },
];

const STATUS_COLORS: Record<string, string> = {
  PEDIDO_RECEBIDO: 'bg-sky-50 text-sky-700 border-sky-200',
  EM_SEPARACAO: 'bg-amber-50 text-amber-700 border-amber-200',
  PRONTO_PARA_RETIRADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RETIRADO: 'bg-slate-50 text-slate-600 border-slate-200',
  CANCELADO: 'bg-red-50 text-red-700 border-red-200',
};

const LABEL_STATUS: Record<string, string> = {
  PEDIDO_RECEBIDO: 'Recebido',
  EM_SEPARACAO: 'Separando',
  PRONTO_PARA_RETIRADA: 'Pronto p/ Retirada',
  RETIRADO: 'Retirado',
  CANCELADO: 'Cancelado',
};

interface Pedido {
  id: string;
  numero: number;
  status: string;
  total: number;
  formaPagamento: string;
  clienteNome: string;
  cliente?: { nome: string; telefone: string };
  retiradaNome?: string;
  retiradaTelefone?: string;
  qrCode?: string;
  createdAt: string;
  retiradaEm?: string;
  itens: { quantidade: number; precoVendido: number; subtotal: number; peca: { nome: string; codigo: string; imagemUrl?: string } }[];
  historico: { id: string; tipo: string; descricao: string; usuario: string; createdAt: string }[];
}

export default function PedidosLojaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [metricas, setMetricas] = useState<any>({});
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [alterando, setAlterando] = useState<string | null>(null);
  const [whatsappMsg, setWhatsappMsg] = useState('');

  useEffect(() => { fetchPedidos(); }, [filtro]);

  async function fetchPedidos() {
    setLoading(true);
    const url = filtro
      ? `/api/vitrine/pedidos?admin=1&status=${filtro}`
      : '/api/vitrine/pedidos?admin=1';
    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();
      setPedidos(data.pedidos || []);
      setMetricas(data.metricas || {});
    }
    setLoading(false);
  }

  async function alterarStatus(id: string, novoStatus: string) {
    setAlterando(id);
    try {
      const r = await fetch(`/api/vitrine/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (r.ok) {
        await fetchPedidos();
        // Sugerir WhatsApp se estiver pronto
        if (novoStatus === 'PRONTO_PARA_RETIRADA') {
          const pedido = pedidos.find(p => p.id === id);
          if (pedido) {
            const telefone = pedido.retiradaTelefone || pedido.cliente?.telefone || '';
            const nome = pedido.retiradaNome || pedido.clienteNome || 'Cliente';
            setWhatsappMsg(`Olá ${nome}! Seu pedido #${pedido.numero} está pronto para retirada. Estamos aguardando você! 🏍️`);
          }
        }
      }
    } catch (e) { console.error(e); }
    setAlterando(null);
  }

  function abrirWhatsApp(telefone: string, msg: string) {
    const tel = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function podeAvancar(status: string): string[] {
    switch (status) {
      case 'PEDIDO_RECEBIDO': return ['EM_SEPARACAO', 'CANCELADO'];
      case 'EM_SEPARACAO': return ['PRONTO_PARA_RETIRADA', 'CANCELADO'];
      case 'PRONTO_PARA_RETIRADA': return ['RETIRADO', 'CANCELADO'];
      case 'RETIRADO': return [];
      case 'CANCELADO': return [];
      default: return [];
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Pedidos da Loja</h1>
          <p className="text-xs text-slate-400 mt-1">Pedidos recebidos pela Vitrine — retirada na loja</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Aguardando', valor: metricas.aguardando || 0, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
          { label: 'Separando', valor: metricas.separando || 0, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Prontos', valor: metricas.prontos || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Retirados Hoje', valor: metricas.retiradosHoje || 0, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Cancelados', valor: metricas.cancelados || 0, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map(m => (
          <div key={m.label} className={`${m.bg} rounded-xl border p-4`}>
            <p className="text-[11px] text-slate-500 font-medium mb-1">{m.label}</p>
            <p className={`text-2xl font-extrabold ${m.color}`}>{m.valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_LIST.map(s => (
          <button key={s.key} onClick={() => setFiltro(s.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filtro === s.key ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}>
            {s.label}
          </button>
        ))}
        <button onClick={fetchPedidos} className="ml-auto px-3 py-1.5 text-xs text-brand-600 font-bold hover:underline">🔄 Atualizar</button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
          </div>
          <p className="text-sm text-slate-400">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map(p => (
            <div key={p.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${expanded === p.id ? 'border-brand-300' : 'border-slate-200'}`}>
              {/* Header */}
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-extrabold text-brand-600">#{p.numero}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[p.status]}`}>
                    {LABEL_STATUS[p.status] || p.status}
                  </span>
                  {p.qrCode && (
                    <span className="text-[10px] text-slate-400 font-mono">{p.qrCode}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{fm(Number(p.total))}</p>
                    <p className="text-[10px] text-slate-400">{p.formaPagamento?.replace('_', ' ') || '—'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                  <svg className={`w-4 h-4 text-slate-300 transition-transform ${expanded === p.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === p.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                  {/* Cliente / Retirada */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cliente</p>
                      <p className="text-xs font-medium text-slate-700">{p.clienteNome || p.cliente?.nome || '—'}</p>
                      {p.cliente?.telefone && <p className="text-[11px] text-slate-400">{p.cliente.telefone}</p>}
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Quem irá retirar</p>
                      <p className="text-xs font-medium text-slate-700">{p.retiradaNome || p.clienteNome || '—'}</p>
                      {p.retiradaTelefone && <p className="text-[11px] text-slate-400">{p.retiradaTelefone}</p>}
                    </div>
                  </div>

                  {/* Itens */}
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Itens do Pedido</p>
                    <div className="space-y-1">
                      {p.itens.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.peca.imagemUrl && <img src={item.peca.imagemUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-700 truncate">{item.peca.nome}</p>
                              <p className="text-[10px] text-slate-400">{item.peca.codigo}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-xs text-slate-500">{item.quantidade}x {fm(Number(item.precoVendido))}</p>
                            <p className="font-bold text-slate-700">{fm(Number(item.subtotal))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Histórico */}
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Linha do Tempo</p>
                    <div className="space-y-1.5">
                      {p.historico.map(h => (
                        <div key={h.id} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-slate-600">{h.descricao}</p>
                            <p className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  {podeAvancar(p.status).length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold mr-1">Alterar:</span>
                      {podeAvancar(p.status).map(st => (
                        <button key={st} onClick={() => alterarStatus(p.id, st)} disabled={alterando === p.id}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                            st === 'CANCELADO'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                              : 'bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-200'
                          }`}>
                          {alterando === p.id ? '...' : LABEL_STATUS[st] || st}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* WhatsApp */}
                  {p.status === 'PRONTO_PARA_RETIRADA' && (p.retiradaTelefone || p.cliente?.telefone) && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-[10px] text-emerald-700 font-bold mb-2">Notificar cliente via WhatsApp</p>
                      <textarea value={whatsappMsg || `Olá ${p.retiradaNome || p.clienteNome}! Seu pedido #${p.numero} está pronto para retirada. Estamos aguardando você! 🏍️`}
                        onChange={e => setWhatsappMsg(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-emerald-200 bg-white resize-none mb-2"
                        rows={2} />
                      <button onClick={() => abrirWhatsApp(p.retiradaTelefone || p.cliente?.telefone || '', whatsappMsg || `Olá! Seu pedido #${p.numero} está pronto para retirada.`)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">
                        📱 Enviar WhatsApp
                      </button>
                    </div>
                  )}

                  {/* QR Code para retirada */}
                  {p.status === 'PRONTO_PARA_RETIRADA' && p.qrCode && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-slate-500 font-bold mb-2">QR Code para retirada</p>
                      <div className="bg-white inline-block p-3 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-600 font-mono font-bold">{p.qrCode}</div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Apresente este código no balcão</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
