'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LABELS: Record<string, string> = {
  PEDIDO_RECEBIDO: 'Recebido', EM_SEPARACAO: 'Separando',
  PRONTO_PARA_RETIRADA: 'Pronto p/ Retirada', RETIRADO: 'Retirado', CANCELADO: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  PEDIDO_RECEBIDO: 'bg-sky-50 text-sky-700', EM_SEPARACAO: 'bg-amber-50 text-amber-700',
  PRONTO_PARA_RETIRADA: 'bg-emerald-50 text-emerald-700', RETIRADO: 'bg-slate-100 text-slate-600',
  CANCELADO: 'bg-red-50 text-red-700',
};
const STEPS = ['PEDIDO_RECEBIDO', 'EM_SEPARACAO', 'PRONTO_PARA_RETIRADA', 'RETIRADO'];

export default function ClientePedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    fetch('/api/cliente/pedidos', { headers: { Authorization: `Bearer ${JSON.parse(c).token}` } })
      .then(r => r.json()).then(setPedidos).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  function getStep(status: string) { return status === 'CANCELADO' ? -1 : STEPS.indexOf(status); }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">Meus Pedidos</h1>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
          </div>
          <p className="text-sm text-slate-400">Nenhum pedido encontrado</p>
        </div>
      ) : pedidos.map(p => (
        <div key={p.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${expanded === p.id ? 'border-brand-300' : 'border-slate-200'}`}>
          <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-brand-600">#{p.numero}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[p.status] || 'bg-slate-100'}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>
                {p.formaPagamento && <span className="text-[10px] text-slate-400">{p.formaPagamento.replace('_', ' ')}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                <svg className={`w-4 h-4 text-slate-300 transition-transform ${expanded === p.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            {p.status !== 'CANCELADO' && (
              <div className="flex items-center gap-0 mt-2">
                {['Recebido', 'Separando', 'Pronto', 'Retirado'].map((step, i) => {
                  const done = getStep(p.status) >= i;
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
              <p className="text-xs text-slate-500">{p.itens?.length || 0} {p.itens?.length === 1 ? 'item' : 'itens'}</p>
              <p className="text-base font-extrabold text-slate-800">{fm(Number(p.total))}</p>
            </div>
          </div>

          {expanded === p.id && (
            <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Produtos</p>
                {p.itens?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-medium text-slate-700">{item.peca.nome}</p>
                      <p className="text-[10px] text-slate-400">{item.peca.codigo} · {item.quantidade}x {fm(Number(item.precoVendido))}</p>
                    </div>
                    <span className="font-bold">{fm(Number(item.subtotal))}</span>
                  </div>
                ))}
              </div>

              {p.retiradaNome && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Retirada</p>
                  <p className="text-xs text-slate-600">Por: {p.retiradaNome}</p>
                </div>
              )}

              {p.status === 'PRONTO_PARA_RETIRADA' && p.qrCode && (
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-brand-600 uppercase font-bold mb-2">Código de Retirada</p>
                  <div className="bg-white inline-block px-4 py-2 rounded-lg border border-brand-200">
                    <span className="text-sm font-extrabold text-brand-700 font-mono">{p.qrCode}</span>
                  </div>
                </div>
              )}

              {p.historico?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Linha do Tempo</p>
                  {p.historico.map((h: any) => (
                    <div key={h.id} className="flex items-start gap-2 text-xs py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-600">{h.descricao}</p>
                        <p className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 pt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span>{fm(Number(p.subtotal))}</span></div>
                {Number(p.descontoTotal) > 0 && <div className="flex justify-between"><span className="text-emerald-600">Desconto</span><span className="text-emerald-600">-{fm(Number(p.descontoTotal))}</span></div>}
                <div className="flex justify-between font-bold pt-1 border-t border-slate-100"><span>Total</span><span>{fm(Number(p.total))}</span></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
