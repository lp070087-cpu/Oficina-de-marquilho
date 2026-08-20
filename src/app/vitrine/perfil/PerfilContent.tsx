'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getClienteVitrine, clearClienteVitrine } from '@/lib/vitrine-session';
import LogoOficina from '@/components/LogoOficina';
import { DADOS_OFICINA } from '@/lib/empresa';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const LABEL_STATUS: Record<string, string> = {
  PEDIDO_RECEBIDO: 'Recebido',
  EM_SEPARACAO: 'Separando',
  PRONTO_PARA_RETIRADA: 'Pronto p/ Retirada',
  RETIRADO: 'Retirado',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PEDIDO_RECEBIDO: 'bg-sky-50 text-sky-700',
  EM_SEPARACAO: 'bg-amber-50 text-amber-700',
  PRONTO_PARA_RETIRADA: 'bg-emerald-50 text-emerald-700',
  RETIRADO: 'bg-slate-100 text-slate-600',
  CANCELADO: 'bg-red-50 text-red-700',
};

const STATUS_STEPS = ['PEDIDO_RECEBIDO', 'EM_SEPARACAO', 'PRONTO_PARA_RETIRADA', 'RETIRADO'];

export default function PerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoDestaque = searchParams.get('pedido');

  const [cliente, setCliente] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [tab, setTab] = useState<'pedidos'|'orcamentos'|'favoritos'|'dados'>(pedidoDestaque ? 'pedidos' : 'pedidos');
  const [loading, setLoading] = useState(true);
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);

  useEffect(() => {
    const d = getClienteVitrine();
    if (!d) { router.push('/vitrine/login?redirect=/vitrine/perfil'); return; }
    setCliente(d);

    // Buscar pedidos da vitrine
    fetch('/api/vitrine/pedidos', { headers: { Authorization: `Bearer ${d.token}` } })
      .then(r => r.json())
      .then(data => {
        setPedidos(data.pedidos || []);
        setLoading(false);
        // Expandir pedido destacado
        if (pedidoDestaque) {
          const destaque = (data.pedidos || []).find((p: any) => String(p.numero) === pedidoDestaque);
          if (destaque) setPedidoExpandido(destaque.id);
        }
      })
      .catch(() => setLoading(false));

    // Buscar orçamentos do cliente (estavam órfãos na página /vitrine/conta)
    fetch('/api/vitrine/orcamentos', { headers: { Authorization: `Bearer ${d.token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setOrcamentos(data); })
      .catch(() => {});
  }, [router, pedidoDestaque]);

  if (!cliente) return null;

  function sair() { clearClienteVitrine(); router.push('/vitrine'); }

  const TABS = [
    { key: 'pedidos' as const, label: '📋 Meus Pedidos' },
    { key: 'orcamentos' as const, label: '📝 Orçamentos' },
    { key: 'favoritos' as const, label: '❤️ Favoritos' },
    { key: 'dados' as const, label: '👤 Meus Dados' },
  ];

  function getStatusStep(status: string) {
    if (status === 'CANCELADO') return -1;
    return STATUS_STEPS.indexOf(status);
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#0D1117] text-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/vitrine" className="flex items-center gap-2.5">
            <LogoOficina className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center overflow-hidden" textClassName="font-extrabold text-white text-xs" />
            <span className="font-extrabold text-sm">Meu Perfil</span>
          </a>
          <span className="text-xs text-slate-400">{cliente.nome}</span>
          <button onClick={sair} className="text-xs text-slate-400 hover:text-white">Sair</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab === t.key ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Pedidos da Vitrine */}
        {tab === 'pedidos' && (
          loading ? <div className="text-center py-8"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"/></div> :
          pedidos.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
              </div>
              <p className="text-sm text-slate-400">Nenhum pedido encontrado</p>
              <a href="/vitrine" className="text-brand-600 text-xs font-bold mt-2 inline-block">Ver produtos →</a>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidos.map(p => (
                <div key={p.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${pedidoExpandido === p.id ? 'border-brand-300' : 'border-slate-200'}`}>
                  {/* Header */}
                  <div className="p-4 cursor-pointer" onClick={() => setPedidoExpandido(pedidoExpandido === p.id ? null : p.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-brand-600">#{p.numero}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-500'}`}>
                          {LABEL_STATUS[p.status] || p.status}
                        </span>
                        {p.formaPagamento && (
                          <span className="text-[10px] text-slate-400">{p.formaPagamento.replace('_', ' ')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                        <svg className={`w-4 h-4 text-slate-300 transition-transform ${pedidoExpandido === p.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                    </div>

                    {/* Status bar (se não cancelado) */}
                    {p.status !== 'CANCELADO' && (
                      <div className="flex items-center gap-0 mt-2">
                        {['Recebido', 'Separando', 'Pronto', 'Retirado'].map((step, i) => {
                          const done = getStatusStep(p.status) >= i;
                          return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                              <span className={`text-[9px] ml-1 ${done ? 'text-emerald-600 font-medium' : 'text-slate-300'}`}>{step}</span>
                              {i < 3 && <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-emerald-300' : 'bg-slate-100'}`} />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-2">
                      <p className="text-xs text-slate-500">
                        {p.itens?.length || 0} {p.itens?.length === 1 ? 'item' : 'itens'}
                      </p>
                      <p className="text-base font-extrabold text-slate-800">{fm(Number(p.total))}</p>
                    </div>
                  </div>

                  {/* Expanded */}
                  {pedidoExpandido === p.id && (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                      {/* Itens */}
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Produtos</p>
                        <div className="space-y-1.5">
                          {(p.itens || []).map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                              <div>
                                <p className="font-medium text-slate-700">{item.peca.nome}</p>
                                <p className="text-[10px] text-slate-400">{item.quantidade}x {fm(Number(item.precoVendido))}</p>
                              </div>
                              <span className="font-bold text-slate-700">{fm(Number(item.subtotal))}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Retirada */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Retirada na Loja</p>
                        <p className="text-xs text-slate-600">{DADOS_OFICINA.endereco} — {DADOS_OFICINA.cidade}</p>
                        <p className="text-xs text-slate-400">Seg-Sex: 8h às 18h · Sáb: 8h às 13h</p>
                        {p.retiradaNome && <p className="text-xs text-slate-500 mt-1">Retirada por: {p.retiradaNome}</p>}
                      </div>

                      {/* QR Code — para pedidos prontos */}
                      {p.status === 'PRONTO_PARA_RETIRADA' && p.qrCode && (
                        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
                          <p className="text-[10px] text-brand-600 uppercase font-bold mb-3">Código de Retirada</p>
                          <div className="bg-white inline-block px-6 py-3 rounded-lg border border-brand-200">
                            <span className="text-sm font-extrabold text-brand-700 font-mono tracking-wider">{p.qrCode}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2">Apresente este código no balcão para retirar seu pedido</p>
                        </div>
                      )}

                      {/* Timeline */}
                      {p.historico && p.historico.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Linha do Tempo</p>
                          <div className="space-y-1.5">
                            {p.historico.map((h: any) => (
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
                      )}

                      {/* Resumo financeiro */}
                      <div className="border-t border-slate-100 pt-2 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span>{fm(Number(p.subtotal))}</span></div>
                        {Number(p.descontoTotal) > 0 && (
                          <div className="flex justify-between"><span className="text-emerald-600">Desconto</span><span className="text-emerald-600">-{fm(Number(p.descontoTotal))}</span></div>
                        )}
                        <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                          <span>Total</span><span>{fm(Number(p.total))}</span>
                        </div>
                        {p.formaPagamento && (
                          <div className="flex justify-between text-[11px]"><span className="text-slate-400">Pagamento</span><span>{p.formaPagamento.replace('_', ' ')}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Orçamentos */}
        {tab === 'orcamentos' && (
          orcamentos.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <p className="text-sm text-slate-400">Nenhum orçamento encontrado</p>
              <a href="/vitrine" className="text-brand-600 text-xs font-bold mt-2 inline-block">Ver produtos →</a>
            </div>
          ) : (
            <div className="space-y-4">
              {orcamentos.map(o => (
                <div key={o.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-brand-600">#{o.numero}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        o.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-700'
                        : o.status === 'RECUSADO' ? 'bg-red-50 text-red-700'
                        : o.status === 'CONCLUIDO' ? 'bg-slate-50 text-slate-600'
                        : 'bg-amber-50 text-amber-700'
                      }`}>
                        {o.status === 'PENDENTE' ? 'Pendente' : o.status === 'APROVADO' ? 'Aprovado' : o.status === 'RECUSADO' ? 'Recusado' : 'Concluído'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {o.modeloMoto && <p className="text-xs text-slate-500 mb-2">Moto: {o.modeloMoto}</p>}
                  <div className="space-y-1 mb-3">
                    {(o.itens || []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{item.peca.nome}</span>
                        <span className="text-slate-500">{item.quantidade}x {fm(Number(item.precoUnitario))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Total: <strong className="text-slate-800 text-sm">{fm(Number(o.total))}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Favoritos */}
        {tab === 'favoritos' && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-sm text-slate-400 mb-3">Gerencie seus produtos favoritos</p>
            <a href="/vitrine/favoritos" className="text-brand-600 text-sm font-bold">Ver favoritos →</a>
          </div>
        )}

        {/* Dados */}
        {tab === 'dados' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Meus Dados</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">Nome</label>
                <p className="text-sm font-medium text-slate-700">{cliente.nome}</p>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">Telefone</label>
                <p className="text-sm font-medium text-slate-700">{cliente.telefone}</p>
              </div>
              {cliente.modeloMoto && (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Moto</label>
                  <p className="text-sm font-medium text-slate-700">{cliente.modeloMoto}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
