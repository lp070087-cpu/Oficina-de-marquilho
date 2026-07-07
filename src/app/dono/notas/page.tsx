'use client';

import { useState, useEffect } from 'react';

interface Nota { id: string; numero: string; chaveAcesso?: string; emitidaEm: string; ordemServico: { numero: number; nomeCliente: string; telefoneCliente: string; valorTotal: number }; }

export default function NotasPage() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/notas').then(r => r.json()).then(data => { setNotas(data); setLoading(false); }); }, []);

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function linkWhatsApp(nf: Nota) {
    const texto = encodeURIComponent(`NF ${nf.numero} - OS #${nf.ordemServico.numero}. Valor: ${formatMoney(Number(nf.ordemServico.valorTotal))}`);
    window.open(`https://wa.me/55${nf.ordemServico.telefoneCliente.replace(/\D/g, '')}?text=${texto}`, '_blank');
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-6">NOTAS FISCAIS</h1>
      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : notas.length === 0 ? (
        <div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhuma nota fiscal emitida.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">NF</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">OS</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Cliente</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Valor</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Data</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 uppercase"></th>
            </tr></thead>
            <tbody>
              {notas.map(nf => (
                <tr key={nf.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-medium text-slate-700">{nf.numero}</td>
                  <td className="py-2 px-3 text-brand-600 font-medium">#{nf.ordemServico.numero}</td>
                  <td className="py-2 px-3 text-slate-600">{nf.ordemServico.nomeCliente}</td>
                  <td className="py-2 px-3 text-right font-medium text-slate-700">{formatMoney(Number(nf.ordemServico.valorTotal))}</td>
                  <td className="py-2 px-3 text-slate-500 text-xs">{new Date(nf.emitidaEm).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2 px-3 text-right">
                    <button onClick={() => linkWhatsApp(nf)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">WhatsApp</button>
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
