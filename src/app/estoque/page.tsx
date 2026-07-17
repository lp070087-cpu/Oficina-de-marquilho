'use client';
// VERSÃO PAINEL 2026
import { useState, useEffect } from 'react';

interface Stats { totalProdutos:number; totalUnidades:number; estoqueMinimo:number; semEstoque:number; entradasHoje:number; transferenciasHoje:number; ultimasMovimentacoes:any[]; }

export default function EstoqueDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalProdutos:0, totalUnidades:0, estoqueMinimo:0, semEstoque:0, entradasHoje:0, transferenciasHoje:0, ultimasMovimentacoes:[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [pecasRes, movsRes] = await Promise.all([
        fetch('/api/pecas').then(r => r.json()),
        fetch('/api/relatorios/movimentacao?tipo=').then(r => r.json()),
      ]);
      const pecas = Array.isArray(pecasRes) ? pecasRes : [];
      const movs = Array.isArray(movsRes) ? movsRes : [];
      const hoje = new Date().toISOString().slice(0,10);

      setStats({
        totalProdutos: pecas.length,
        totalUnidades: pecas.reduce((s:number,p:any)=>s+(p.quantidade||0),0),
        estoqueMinimo: pecas.filter((p:any)=>p.quantidade<=p.estoqueMinimo&&p.quantidade>0).length,
        semEstoque: pecas.filter((p:any)=>p.quantidade<=0).length,
        entradasHoje: movs.filter((m:any)=>m.tipo==='ENTRADA'&&m.createdAt?.startsWith(hoje)).length,
        transferenciasHoje: movs.filter((m:any)=>m.tipo==='TRANSFERENCIA'&&m.createdAt?.startsWith(hoje)).length,
        ultimasMovimentacoes: movs.slice(0,10),
      });
      setLoading(false);
    }
    load();
  }, []);

  const tipoLabel: Record<string,string> = { ENTRADA:'text-emerald-700 bg-emerald-50', SAIDA:'text-red-700 bg-red-50', TRANSFERENCIA:'text-brand-700 bg-brand-50', VENDA:'text-amber-700 bg-amber-50', USO_OS:'text-orange-700 bg-orange-50', AJUSTE:'text-slate-700 bg-slate-50' };

  if (loading) return <div className="p-6"><p className="text-sm text-slate-400">Carregando...</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-6">PAINEL DO ESTOQUE</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Produtos cadastrados', value:stats.totalProdutos, sub:null },
          { label:'Quantidade total', value:stats.totalUnidades, sub:'unidades' },
          { label:'Estoque minimo', value:stats.estoqueMinimo, sub:'precisa repor' },
          { label:'Sem estoque', value:stats.semEstoque, sub:'zerados' },
          { label:'Entradas hoje', value:stats.entradasHoje, sub:null },
          { label:'Transferencias hoje', value:stats.transferenciasHoje, sub:null },
        ].map((c,i)=>(
          <div key={i} className="card-stat">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-2xl font-bold ${i===2?'text-amber-600':i===3?'text-red-600':'text-slate-800'}`}>{c.value.toLocaleString('pt-BR')}</p>
            {c.sub&&<p className="text-[11px] text-slate-400 mt-1">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="card-table">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Ultimas movimentacoes</h3></div>
        <div className="overflow-auto max-h-80">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-left py-2 px-3 font-semibold text-slate-500">Data</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500">Tipo</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500">Produto</th>
              <th className="text-center py-2 px-3 font-semibold text-slate-500">Qtd</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500">Usuario</th>
            </tr></thead>
            <tbody>{stats.ultimasMovimentacoes.length===0?(
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Nenhuma movimentacao registrada.</td></tr>
            ):stats.ultimasMovimentacoes.map((m:any,i:number)=>(
              <tr key={i} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                <td className="py-2 px-3 text-slate-500">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="py-2 px-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${tipoLabel[m.tipo]||'bg-slate-50 text-slate-500'}`}>{m.tipo}</span></td>
                <td className="py-2 px-3 text-slate-700 font-medium">{m.peca?.nome||'-'}</td>
                <td className="py-2 px-3 text-center font-bold">{m.quantidade}</td>
                <td className="py-2 px-3 text-slate-400">{m.usuario||'-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
