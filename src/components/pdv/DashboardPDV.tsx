'use client';

import { useState, useEffect, useCallback } from 'react';

interface VendaHoje {
  id: string;
  numero: number;
  total: number;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  createdAt: string;
  pagamentos: { tipo: string; valor: number }[];
  itens?: { pecaId: string; peca?: { nome: string; codigo: string }; nome?: string; codigo?: string; quantidade: number; subtotal?: number; precoVendido: number }[];
}

interface ResumoPDV {
  totalVendas: number;
  qtdVendas: number;
  porForma: Record<string, number>;
  ticketMedio: number;
  ultimasVendas: VendaHoje[];
  produtosMaisVendidos: { nome: string; codigo: string; qtd: number; valor: number }[];
}

export default function DashboardPDV() {
  const [resumo, setResumo] = useState<ResumoPDV | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/vendas?data=${hoje}&limit=50`);
      const data = await res.json();

      const vendas: VendaHoje[] = data.vendas || [];
      const porForma: Record<string, number> = {};
      let totalVendas = 0;
      const produtosMap = new Map<string, { nome: string; codigo: string; qtd: number; valor: number }>();

      for (const v of vendas) {
        totalVendas += Number(v.total);
        if (v.pagamentos) {
          for (const pg of v.pagamentos) {
            porForma[pg.tipo] = (porForma[pg.tipo] || 0) + Number(pg.valor);
          }
        }
        if (v.itens) {
          for (const item of v.itens) {
            const chave = item.pecaId || item.peca?.codigo || item.nome || '';
            const existente = produtosMap.get(chave);
            if (existente) {
              existente.qtd += item.quantidade || 1;
              existente.valor += Number(item.subtotal || item.precoVendido * item.quantidade);
            } else {
              produtosMap.set(chave, {
                nome: item.peca?.nome || item.nome || chave,
                codigo: item.peca?.codigo || item.codigo || chave,
                qtd: item.quantidade || 1,
                valor: Number(item.subtotal || item.precoVendido * (item.quantidade || 1)),
              });
            }
          }
        }
      }

      const produtosMaisVendidos = Array.from(produtosMap.values())
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 5);

      setResumo({
        totalVendas,
        qtdVendas: vendas.length,
        porForma,
        ticketMedio: vendas.length > 0 ? totalVendas / vendas.length : 0,
        ultimasVendas: vendas.slice(0, 8),
        produtosMaisVendidos,
      });
    } catch {
      setErro('Erro ao carregar dados do PDV');
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtHora = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const tipoLabel: Record<string, string> = {
    DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_DEBITO: 'Debito', CARTAO_CREDITO: 'Credito',
  };

  if (loading) {
    return <div className="flex items-center gap-3 p-6"><div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/><p className="text-xs text-slate-400">Carregando...</p></div>;
  }

  if (erro) return <div className="text-xs text-red-500 p-4">{erro}</div>;
  if (!resumo) return null;

  return (
    <div className="space-y-4">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Vendas Hoje</p>
          <p className="text-2xl font-bold text-slate-800">{resumo.qtdVendas}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Hoje</p>
          <p className="text-2xl font-bold text-emerald-600">{fm(resumo.totalVendas)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Ticket Medio</p>
          <p className="text-2xl font-bold text-brand-600">{fm(resumo.ticketMedio)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">F. Pagamento</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {Object.entries(resumo.porForma).map(([t, v]) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {tipoLabel[t] || t}: {fm(v)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Ultimas vendas */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Ultimas Vendas</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {resumo.ultimasVendas.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">Nenhuma venda hoje</p>
            ) : (
              resumo.ultimasVendas.map((v, i) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-0 text-xs">
                  <div>
                    <span className="font-bold text-brand-600">#{v.numero}</span>
                    {v.clienteNome && <span className="text-slate-500 ml-2">{v.clienteNome}</span>}
                    {v.clienteTelefone && !v.clienteNome && <span className="text-slate-500 ml-2">{v.clienteTelefone}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{fmtHora(v.createdAt)}</span>
                    <span className="font-bold text-slate-700">{fm(Number(v.total))}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Produtos mais vendidos */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Mais Vendidos Hoje</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {resumo.produtosMaisVendidos.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">Nenhum produto vendido hoje</p>
            ) : (
              resumo.produtosMaisVendidos.map((p, i) => (
                <div key={p.codigo} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-0 text-xs">
                  <div>
                    <span className="font-medium text-slate-800">{p.nome}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">{p.codigo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{p.qtd}x</span>
                    <span className="font-bold text-slate-700">{fm(p.valor)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
