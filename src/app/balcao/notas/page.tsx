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

  useEffect(() => {
    fetch('/api/ordens')
      .then(r => r.json())
      .then((data: OS[]) => {
        // Mostrar apenas OS com statusPagamento relevante
        const filtradas = data.filter(
          o =>
            o.statusPagamento === 'AGUARDANDO_PAGAMENTO' ||
            o.statusPagamento === 'PAGO' ||
            o.statusPagamento === 'ENTREGUE' ||
            (o.status === 'CONCLUIDA' && !o.statusPagamento)
        );
        setOrdens(filtradas);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fm = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function getStatusLabel(os: OS) {
    if (os.statusPagamento === 'PAGO') return '🟢 Pago';
    if (os.statusPagamento === 'ENTREGUE') return '✅ Entregue';
    return '🔴 Pendente';
  }

  function getStatusColor(os: OS) {
    if (os.statusPagamento === 'PAGO') return 'bg-emerald-50 text-emerald-700';
    if (os.statusPagamento === 'ENTREGUE') return 'bg-blue-50 text-blue-700';
    return 'bg-red-50 text-red-700';
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">COBRANCAS</h1>
      <p className="text-sm text-slate-500 mb-6">Ordens de servico finalizadas aguardando pagamento</p>
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
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map(os => (
                <tr key={os.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-medium text-brand-600">#{os.numero}</td>
                  <td className="py-2 px-3 text-slate-700 font-medium">{os.nomeCliente}</td>
                  <td className="py-2 px-3 text-slate-500 text-xs">{os.modeloMoto}</td>
                  <td className="py-2 px-3 text-slate-500 text-xs">{os.placaMoto || '-'}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-700">
                    {fm(Number(os.valorTotal) || 0)}
                  </td>
                  <td className="py-2 px-3 text-xs text-slate-500">
                    {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusColor(os)}`}
                    >
                      {getStatusLabel(os)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
