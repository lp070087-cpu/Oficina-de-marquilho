'use client';

import { useState, useEffect } from 'react';

interface OS {
  id: string; numero: number; nomeCliente: string; telefoneCliente: string;
  modeloMoto: string; placaMoto?: string; valorTotal: number; status: string;
  statusPagamento?: string; formaPagamento?: string; createdAt: string;
  mecanico?: { name: string };
}

export default function NotasPage() {
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const res = await fetch('/api/ordens').catch(() => null);
    if (res) {
      const data = await res.json();
      // Mostrar todas as OS que estao em AGUARDANDO_PAGAMENTO ou PAGO
      setOrdens(
        data.filter((o: OS) =>
          o.statusPagamento === 'AGUARDANDO_PAGAMENTO' ||
          o.statusPagamento === 'PAGO' ||
          (o.status === 'CONCLUIDA' && !o.statusPagamento)
        )
      );
    }
    setLoading(false);
  }
  useEffect(() => { fetchData(); }, []);

  async function marcarPago(osId: string) {
    if (!confirm('Confirmar pagamento desta OS?')) return;
    const res = await fetch(`/api/ordens/${osId}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusPagamento: 'PAGO' }),
    });
    if (res.ok) fetchData();
    else alert('Erro ao marcar como pago.');
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">COBRANCAS</h1>
      <p className="text-sm text-slate-500 mb-6">Ordens de servico finalizadas — gerencie os pagamentos</p>
      {loading ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : ordens.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-sm text-slate-400">Nenhuma cobranca pendente.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">OS</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Moto</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Placa</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Pagamento</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {ordens.map(os => {
                const isAguardando = os.statusPagamento === 'AGUARDANDO_PAGAMENTO';
                const isPago = os.statusPagamento === 'PAGO';
                const statusLabel = isPago ? '🟢 Pago' : isAguardando ? '🔴 Pendente' : '🔴 Pendente';
                const statusColor = isPago ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700';
                return (
                  <tr key={os.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-medium text-brand-600">#{os.numero}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{os.nomeCliente}</td>
                    <td className="py-2 px-3 text-slate-500 text-xs">{os.modeloMoto}</td>
                    <td className="py-2 px-3 text-slate-500 text-xs">{os.placaMoto || '-'}</td>
                    <td className="py-2 px-3 text-slate-500 text-xs">{os.formaPagamento || 'PIX'}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-700">{fm(Number(os.valorTotal) || 0)}</td>
                    <td className="py-2 px-3 text-xs text-slate-500">
                      {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {!isPago && (
                        <button
                          onClick={() => marcarPago(os.id)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-bold"
                        >
                          Marcar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
