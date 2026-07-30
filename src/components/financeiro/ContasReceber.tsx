'use client';

import { useState, useEffect, useCallback } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ContasReceber() {
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cliente: '', valor: '', dataVencimento: '', descricao: '', formaPagamento: '' });

  const fetchContas = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/financeiro/contas-receber${filtro ? `?status=${filtro}` : ''}`);
      if (r.ok) setContas(await r.json());
    } catch { setContas([]); }
    setLoading(false);
  }, [filtro]);

  useEffect(() => { fetchContas(); }, [fetchContas]);

  async function criarConta() {
    if (!form.cliente || !form.valor || !form.dataVencimento) return;
    await fetch('/api/financeiro/contas-receber', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ cliente: '', valor: '', dataVencimento: '', descricao: '', formaPagamento: '' });
    fetchContas();
  }

  async function receberConta(id: string, valor: number) {
    await fetch('/api/financeiro/contas-receber', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'RECEBIDO', valor }),
    });
    fetchContas();
  }

  const STATUS_BADGE: Record<string, string> = {
    EM_ABERTO: 'bg-amber-100 text-amber-700', PARCIAL: 'bg-blue-100 text-blue-700',
    RECEBIDO: 'bg-emerald-100 text-emerald-700', ATRASADO: 'bg-red-100 text-red-700', CANCELADO: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {['', 'EM_ABERTO', 'ATRASADO', 'RECEBIDO', 'CANCELADO'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${filtro === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {f || 'Todas'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs px-4 py-2">+ Nova Conta</button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-slate-500">Cliente</label><input value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} className="input-field text-xs w-full mt-0.5" /></div>
            <div><label className="text-[10px] text-slate-500">Valor R$</label><input type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} className="input-field text-xs w-full mt-0.5" /></div>
            <div><label className="text-[10px] text-slate-500">Vencimento</label><input type="date" value={form.dataVencimento} onChange={e => setForm({...form, dataVencimento: e.target.value})} className="input-field text-xs w-full mt-0.5" /></div>
            <div><label className="text-[10px] text-slate-500">Forma Pagto</label><select value={form.formaPagamento} onChange={e => setForm({...form, formaPagamento: e.target.value})} className="input-field text-xs w-full mt-0.5"><option value="">Selecionar</option><option>PIX</option><option>DINHEIRO</option><option>CARTAO</option><option>BOLETO</option></select></div>
          </div>
          <div><label className="text-[10px] text-slate-500">Descrição</label><input value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="input-field text-xs w-full mt-0.5" /></div>
          <button onClick={criarConta} className="btn-primary text-xs px-4 py-2">Criar Conta</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        <div className="space-y-2">
          {contas.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
              <div>
                <p className="text-sm font-bold text-slate-700">{c.cliente}</p>
                <p className="text-[10px] text-slate-400">{c.descricao || '—'} • Vence: {new Date(c.dataVencimento).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">{fm(Number(c.valor))}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[c.status] || 'bg-slate-100'}`}>{c.status}</span>
                {(c.status === 'EM_ABERTO' || c.status === 'ATRASADO' || c.status === 'PARCIAL') && (
                  <button onClick={() => receberConta(c.id, c.valor)} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200">
                    Receber
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
