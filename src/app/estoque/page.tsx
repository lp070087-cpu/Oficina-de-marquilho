'use client';

import { useState, useEffect } from 'react';

interface PecaSaida { peca: string; codigo: string; quantidade: number; preco: number; os: number; cliente: string; data: string; balcao: string; }
interface Relatorio { saidas: PecaSaida[]; totalPecas: number; valorTotal: number; }

function getPeriodoRange(periodo: string) {
  const hoje = new Date();
  hoje.setHours(23,59,59,999);
  let inicio = new Date(hoje);
  if (periodo === 'hoje') inicio.setHours(0,0,0,0);
  else if (periodo === 'semana') inicio.setDate(hoje.getDate() - 7);
  else if (periodo === 'mes') inicio.setMonth(hoje.getMonth() - 1);
  else if (periodo === 'ano') inicio.setFullYear(hoje.getFullYear() - 1);
  else inicio = new Date(2000,0,1);
  return { inicio: inicio.toISOString(), fim: hoje.toISOString() };
}

export default function EstoqueDashboard() {
  const [periodo, setPeriodo] = useState('hoje');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [saidas, setSaidas] = useState<PecaSaida[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    let range;
    if (periodo === 'personalizado' && dataInicio && dataFim) {
      range = { inicio: new Date(dataInicio+'T00:00:00').toISOString(), fim: new Date(dataFim+'T23:59:59').toISOString() };
    } else {
      range = getPeriodoRange(periodo);
    }
    const p = new URLSearchParams({ inicio: range.inicio, fim: range.fim });
    const res = await fetch(`/api/relatorios?${p}`);
    const data = await res.json();
    setSaidas(data.saidas || []);
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [periodo]);

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalPecas = saidas.reduce((s, i) => s + i.quantidade, 0);
  const valorTotal = saidas.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const hoje = new Date().toISOString().slice(0,10);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">RELATORIO DE SAIDAS</h1>
        <p className="text-sm text-slate-500 mt-0.5">Pecas que sairam do estoque via Ordens de Servico</p>
      </div>

      {/* Filtro periodo */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { k: 'hoje', l: 'Hoje' },
          { k: 'semana', l: '7 dias' },
          { k: 'mes', l: '30 dias' },
          { k: 'ano', l: '12 meses' },
          { k: 'tudo', l: 'Tudo' },
          { k: 'personalizado', l: 'Personalizado' },
        ].map(p => (
          <button key={p.k} onClick={() => setPeriodo(p.k)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${periodo===p.k?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {p.l}
          </button>
        ))}
      </div>

      {/* Datas personalizadas */}
      {periodo === 'personalizado' && (
        <div className="flex items-center gap-3 mb-6 bg-white border border-slate-200 rounded-xl p-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">De</label>
            <input type="date" value={dataInicio} max={hoje} onChange={e=>setDataInicio(e.target.value)} className="input-field mt-1 text-xs w-40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Até</label>
            <input type="date" value={dataFim} max={hoje} onChange={e=>setDataFim(e.target.value)} className="input-field mt-1 text-xs w-40" />
          </div>
          <button onClick={carregar} className="btn-primary text-xs mt-5">Filtrar</button>
        </div>
      )}

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Pecas saidas</p>
          <p className="text-2xl font-bold text-slate-800">{totalPecas}</p>
          <p className="text-[11px] text-slate-400 mt-1">{saidas.length} itens diferentes</p>
        </div>
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Valor total saido</p>
          <p className="text-2xl font-bold text-slate-800">{fm(valorTotal)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Preco de venda</p>
        </div>
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">OS relacionadas</p>
          <p className="text-2xl font-bold text-slate-800">{[...new Set(saidas.map(s=>s.os))].length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Ordens de servico no periodo</p>
        </div>
      </div>

      {/* Tabela */}
      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : saidas.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <p className="text-sm text-slate-400">Nenhuma saida no periodo selecionado.</p>
        </div>
      ) : (
        <div className="card-table">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">OS</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Data</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Peca</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Codigo</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Qtd</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Preco</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Balcao</th>
              </tr></thead>
              <tbody>
                {saidas.map((s, i) => (
                  <tr key={i} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                    <td className="py-2.5 px-4 font-semibold text-brand-600 text-xs">#{s.os}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{new Date(s.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-700 font-medium">{s.cliente}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-700">{s.peca}</td>
                    <td className="py-2.5 px-4 text-xs font-mono text-slate-400">{s.codigo}</td>
                    <td className="py-2.5 px-4 text-xs text-center font-bold text-slate-700">{s.quantidade}</td>
                    <td className="py-2.5 px-4 text-xs text-right text-slate-500">{fm(s.preco)}</td>
                    <td className="py-2.5 px-4 text-xs text-right font-bold text-slate-700">{fm(s.preco * s.quantidade)}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{s.balcao}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50 font-bold">
                  <td colSpan={5} className="py-3 px-4 text-right text-xs text-slate-500 border-t border-slate-200">Totais do periodo</td>
                  <td className="py-3 px-4 text-center text-sm text-slate-800 border-t border-slate-200">{totalPecas}</td>
                  <td className="py-3 px-4 border-t border-slate-200"></td>
                  <td className="py-3 px-4 text-right text-sm text-slate-800 border-t border-slate-200">{fm(valorTotal)}</td>
                  <td className="py-3 px-4 border-t border-slate-200"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
