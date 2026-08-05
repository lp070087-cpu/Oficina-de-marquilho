'use client';

import { useState, useCallback, useEffect } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type RelatorioTipo = 'receitas-por-categoria' | 'despesas-por-categoria' | 'contas-vencer' | 'contas-vencidas' | 'comissoes-periodo' | 'fluxo-periodo' | 'top-clientes' | 'top-servicos';

export default function RelatoriosFinanceiros() {
  const [tipo, setTipo] = useState<RelatorioTipo>('receitas-por-categoria');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRelatorio = useCallback(async () => {
    setLoading(true);
    try {
      // Usa a API de dashboard como base e filtra
      const r = await fetch('/api/financeiro/dashboard');
      if (!r.ok) throw new Error('Erro');
      const base = await r.json();

      // Formata dados conforme tipo de relatório
      let resultado: any = { titulo: '', linhas: [], total: 0 };

      switch (tipo) {
        case 'receitas-por-categoria':
          resultado = {
            titulo: 'Receitas por Categoria',
            linhas: (base.receitasCategoria || []).map((l: any) => ({ descricao: l.categoria, valor: l.valor })),
            total: base.receitaMes || 0,
          };
          break;
        case 'despesas-por-categoria':
          resultado = {
            titulo: 'Despesas por Categoria',
            linhas: (base.despesasCategoria || []).map((l: any) => ({ descricao: l.categoria, valor: l.valor })),
            total: base.despesasTotal || 0,
          };
          break;
        case 'contas-vencer': {
          const r2 = await fetch('/api/financeiro/contas-receber?status=EM_ABERTO');
          const contas = r2.ok ? await r2.json() : [];
          const vencem = contas.filter((c: any) => c.dataVencimento && new Date(c.dataVencimento) > new Date());
          resultado = {
            titulo: 'Contas a Vencer',
            linhas: vencem.map((c: any) => ({
              descricao: `${c.cliente || 'Cliente'} — Venc. ${new Date(c.dataVencimento).toLocaleDateString('pt-BR')}`,
              valor: c.valor - (c.valorRecebido || 0),
            })),
            total: vencem.reduce((s: number, c: any) => s + (c.valor - (c.valorRecebido || 0)), 0),
          };
          break;
        }
        case 'contas-vencidas': {
          const r2 = await fetch('/api/financeiro/contas-receber?status=ATRASADO');
          const atrasadas = r2.ok ? await r2.json() : [];
          resultado = {
            titulo: 'Contas Vencidas',
            linhas: atrasadas.map((c: any) => ({
              descricao: `${c.cliente || 'Cliente'} — Venceu ${new Date(c.dataVencimento).toLocaleDateString('pt-BR')}`,
              valor: c.valor - (c.valorRecebido || 0),
            })),
            total: atrasadas.reduce((s: number, c: any) => s + (c.valor - (c.valorRecebido || 0)), 0),
          };
          break;
        }
        case 'comissoes-periodo': {
          const r2 = await fetch('/api/financeiro/comissoes');
          const comissoes = r2.ok ? await r2.json() : [];
          resultado = {
            titulo: 'Comissões do Período',
            linhas: comissoes.map((c: any) => ({
              descricao: `${c.usuario} (${c.tipoFuncionario}) — ${c.status}`,
              valor: c.valor,
              detalhe: `${c.percentual}%`,
            })),
            total: comissoes.reduce((s: number, c: any) => s + Number(c.valor), 0),
          };
          break;
        }
        case 'fluxo-periodo': {
          const r2 = await fetch(`/api/financeiro/fluxo-caixa?mes=${new Date().toISOString().slice(0, 7)}`);
          if (r2.ok) {
            const fluxo = await r2.json();
            resultado = {
              titulo: 'Fluxo de Caixa Diário',
              linhas: (fluxo.saldoDiario || []).map((d: any) => ({
                descricao: d.data,
                valor: d.saldo || 0,
                detalhe: `Entradas: ${fm(d.entradas || 0)} / Saídas: ${fm(d.saidas || 0)}`,
              })),
              total: fluxo.entradas - fluxo.saidas,
            };
          }
          break;
        }
        case 'top-clientes':
          resultado = {
            titulo: 'Top Clientes por Faturamento',
            linhas: (base.topClientes || []).map((c: any) => ({
              descricao: c.nome,
              valor: c.total,
              detalhe: `${c.qtd} compras`,
            })),
            total: (base.topClientes || []).reduce((s: number, c: any) => s + (c.total || 0), 0),
          };
          break;
        case 'top-servicos':
          resultado = {
            titulo: 'Top Serviços da Oficina',
            linhas: (base.topServicos || []).map((s: any) => ({
              descricao: s.nome,
              valor: s.total,
              detalhe: `${s.qtd} OS`,
            })),
            total: (base.topServicos || []).reduce((s: number, c: any) => s + (c.total || 0), 0),
          };
          break;
        default:
          resultado = { titulo: 'Selecione um relatório', linhas: [], total: 0 };
      }

      setDados(resultado);
    } catch {
      setDados(null);
    }
    setLoading(false);
  }, [tipo, periodoInicio, periodoFim]);

  useEffect(() => { fetchRelatorio(); }, [fetchRelatorio]);

  const TIPOS: { value: RelatorioTipo; label: string }[] = [
    { value: 'receitas-por-categoria', label: 'Receitas por Categoria' },
    { value: 'despesas-por-categoria', label: 'Despesas por Categoria' },
    { value: 'contas-vencer', label: 'Contas a Vencer' },
    { value: 'contas-vencidas', label: 'Contas Vencidas' },
    { value: 'comissoes-periodo', label: 'Comissões' },
    { value: 'fluxo-periodo', label: 'Fluxo de Caixa' },
    { value: 'top-clientes', label: 'Top Clientes' },
    { value: 'top-servicos', label: 'Top Serviços' },
  ];

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={tipo} onChange={e => setTipo(e.target.value as RelatorioTipo)}
          className="input-field text-xs py-2 min-w-[150px] sm:min-w-[200px]">
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="input-field text-xs py-1.5 w-36" />
        <span className="text-[11px] text-slate-400">até</span>
        <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="input-field text-xs py-1.5 w-36" />
        <button onClick={fetchRelatorio} className="btn-primary text-xs px-4 py-2" disabled={loading}>
          {loading ? '...' : 'Atualizar'}
        </button>
      </div>

      {/* Resultado */}
      {dados && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">{dados.titulo}</h3>
            <span className="text-sm font-extrabold">{fm(dados.total)}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {dados.linhas?.length > 0 ? dados.linhas.map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">{l.descricao}</p>
                  {l.detalhe && <p className="text-[10px] text-slate-400 mt-0.5">{l.detalhe}</p>}
                </div>
                <span className="text-xs font-bold text-slate-800">{fm(l.valor || 0)}</span>
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-xs text-slate-400">Nenhum dado encontrado para este período</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
