'use client';

import { useState, useEffect } from 'react';

interface OS { id: string; numero: number; nomeCliente: string; modeloMoto: string; placaMoto?: string; descricaoProblema: string; diagnostico?: string; status: string; valorTotal: number; valorMaoDeObra: number; itens: { id: string; peca: { nome: string }; quantidade: number; precoUnitario: number }[]; balcao?: { name: string }; notaFiscal?: { numero: string }; }
export default function MecanicoOrdens() {
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<OS | null>(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [novoStatus, setNovoStatus] = useState('');
  const [msg, setMsg] = useState('');

  const fetchOrdens = async () => {
    const res = await fetch('/api/ordens');
    setOrdens(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetchOrdens(); }, []);

  async function atualizarStatus(id: string) {
    const res = await fetch(`/api/ordens/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novoStatus, diagnostico: diagnostico || null }) });
    if (res.ok) { await fetchOrdens(); setSelecionada(null); setMsg(''); }
    else { const e = await res.json(); setMsg(e.error || 'Erro.'); }
  }

  function abrirOS(os: OS) { setSelecionada(os); setNovoStatus(os.status); setDiagnostico(os.diagnostico || ''); setMsg(''); }
  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const statusColor: Record<string, string> = { ABERTA: 'bg-sky-50 text-sky-700 border-sky-200', EM_ANDAMENTO: 'bg-amber-50 text-amber-700 border-amber-200', AGUARDANDO_PECAS: 'bg-orange-50 text-orange-700 border-orange-200', CONCLUIDA: 'bg-emerald-50 text-emerald-700 border-emerald-200', ENTREGUE: 'bg-slate-50 text-slate-600 border-slate-200', CANCELADA: 'bg-red-50 text-red-700 border-red-200' };
  const statusLabel: Record<string, string> = { ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_PECAS: 'Aguard. pecas', CONCLUIDA: 'Concluida', ENTREGUE: 'Entregue', CANCELADA: 'Cancelada' };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-6">MINHAS ORDENS DE SERVICO</h1>
      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : ordens.length === 0 ? (
        <div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhuma OS atribuida a voce.</p></div>
      ) : (
        <div className="space-y-2">
          {ordens.map(os => (
            <div key={os.id} onClick={() => abrirOS(os)} className="card cursor-pointer hover:border-brand-200 transition-colors p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800">OS #{os.numero}</span>
                  <span className="text-slate-300 text-xs">|</span>
                  <span className="text-sm text-slate-600">{os.nomeCliente}</span>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${statusColor[os.status]}`}>{statusLabel[os.status]}</span>
              </div>
              <p className="text-xs text-slate-500 mb-1.5">{os.modeloMoto}{os.placaMoto ? ` - ${os.placaMoto}` : ''}</p>
              {os.itens.length > 0 && <p className="text-xs text-slate-400 truncate">Pecas: {os.itens.map(i => `${i.peca.nome} (x${i.quantidade})`).join(', ')}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-slate-400">Balcao: {os.balcao?.name || '-'}</span>
                <span className="text-sm font-semibold text-slate-800">{formatMoney(Number(os.valorTotal))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selecionada && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">OS #{selecionada.numero}</h2>
              <button onClick={() => setSelecionada(null)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>
            <p className="text-sm text-slate-600 mb-3">{selecionada.nomeCliente} - {selecionada.modeloMoto}</p>
            {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">{msg}</div>}
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-slate-600">Status</label>
                <select value={novoStatus} onChange={e => setNovoStatus(e.target.value)} className="input-field mt-1 text-xs">
                  {['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECAS', 'CONCLUIDA'].map(s => (<option key={s} value={s}>{statusLabel[s]}</option>))}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-600">Diagnostico</label>
                <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className="input-field mt-1 text-xs" rows={3} placeholder="Descreva o que foi encontrado..." />
              </div>
              <div className="text-xs text-slate-500">Pecas utilizadas: {selecionada.itens.length > 0 ? selecionada.itens.map(i => `${i.peca.nome} (x${i.quantidade})`).join(', ') : 'Nenhuma'}</div>
              <button onClick={() => atualizarStatus(selecionada.id)} className="btn-primary text-xs w-full">Atualizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
