'use client';
// VERSÃO PAINEL 2026 — DASHBOARD INTELIGENTE DO ESTOQUE CENTRAL (FASE 15-D)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEstoqueRefresh } from '@/lib/estoque-events';
import DashboardPremium from '@/components/estoque/DashboardPremium';

interface PecaRaw {
  id: string; nome: string; codigo: string; quantidade: number;
  quantidadeLoja: number; estoqueMinimo: number;
  precoVenda: number; precoCusto: number; custoMedio: number;
  categoria: { nome: string; id: string };
  marca?: string; localizacao?: string; fornecedor?: string;
}

interface DashboardData {
  totalProdutos: number;
  totalUnidades: number;
  totalUnidadesLoja: number;
  valorTotalEstoque: number;
  valorTotalCusto: number;
  margemLucro: number;
  margemPercentual: number;
  estoqueBaixo: number;
  semEstoque: number;
  produtosParados: number;
  giroEstimado: number;
  entradasHoje: number;
  transferenciasHoje: number;
  saidasHoje: number;
  ultimasMovimentacoes: any[];
  produtosAtencao: PecaRaw[];
  categoriasCount: number;
}

export default function EstoqueDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { refreshKey } = useEstoqueRefresh();

  useEffect(() => {
    async function load() {
      setError('');
      try {
        const [pecasRes, movsRes, statsRes] = await Promise.all([
          fetch('/api/pecas').then((r) => r.json()),
          fetch('/api/relatorios/movimentacao?tipo=').then((r) => r.json()),
          fetch('/api/estoque/stats').then((r) => r.json()),
        ]);
      const pecas: PecaRaw[] = Array.isArray(pecasRes) ? pecasRes : [];
      const movs: any[] = Array.isArray(movsRes) ? movsRes : [];
      // Contadores reais (agregados no banco, ativo: true) — NÃO reduzir a listagem limitada
      const stats = statsRes && !statsRes.error ? statsRes : null;
      const hoje = new Date().toISOString().slice(0, 10);

      const totalUnidades = stats ? Number(stats.unidadesCentral) || 0 : pecas.reduce((s, p) => s + (p.quantidade || 0), 0);
      const totalUnidadesLoja = stats ? Number(stats.unidadesLoja) || 0 : pecas.reduce((s, p) => s + (p.quantidadeLoja || 0), 0);
      const valorTotalEstoque = pecas.reduce((s, p) => s + (Number(p.precoVenda) || 0) * (p.quantidade || 0), 0);
      const valorTotalCusto = pecas.reduce((s, p) => s + (Number(p.precoCusto) || 0) * (p.quantidade || 0), 0);
      const margemLucro = valorTotalEstoque - valorTotalCusto;
      const margemPercentual = valorTotalEstoque > 0 ? Math.round((margemLucro / valorTotalEstoque) * 100) : 0;

      const estoqueBaixo = stats ? Number(stats.estoqueBaixo) || 0 : pecas.filter((p) => p.estoqueMinimo > 0 && p.quantidade < p.estoqueMinimo && p.quantidade > 0).length;
      const semEstoque = stats ? Number(stats.semEstoque) || 0 : pecas.filter((p) => p.quantidade <= 0).length;
      const produtosParados = pecas.filter((p) => p.quantidade > 15).length;
      const giroEstimado = pecas.filter((p) => p.quantidade > 0 && p.estoqueMinimo > 0 && p.quantidade < p.estoqueMinimo * 2).length;

      // Produtos que precisam de atencao (abaixo do minimo ou zerados)
      const produtosAtencao = pecas
        .filter((p) => p.quantidade <= 0 || (p.estoqueMinimo > 0 && p.quantidade < p.estoqueMinimo))
        .sort((a, b) => a.quantidade - b.quantidade)
        .slice(0, 8);

      const categoriasSet = new Set(pecas.map((p) => p.categoria?.id).filter(Boolean));

      setData({
        totalProdutos: stats ? Number(stats.totalProdutos) || 0 : pecas.length,
        totalUnidades,
        totalUnidadesLoja,
        valorTotalEstoque,
        valorTotalCusto,
        margemLucro,
        margemPercentual,
        estoqueBaixo,
        semEstoque,
        produtosParados,
        giroEstimado,
        entradasHoje: movs.filter((m) => m.tipo === 'ENTRADA' && m.createdAt?.startsWith(hoje)).length,
        transferenciasHoje: movs.filter((m) => m.tipo === 'TRANSFERENCIA' && m.createdAt?.startsWith(hoje)).length,
        saidasHoje: movs.filter((m) => (m.tipo === 'SAIDA' || m.tipo === 'VENDA' || m.tipo === 'USO_OS') && m.createdAt?.startsWith(hoje)).length,
        ultimasMovimentacoes: movs.slice(0, 10),
        produtosAtencao,
        categoriasCount: categoriasSet.size,
      });
      setLoading(false);
      } catch {
        setError('Falha ao carregar dados do painel. Verifique sua conexao.');
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const fm = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const tipoLabel: Record<string, string> = {
    ENTRADA: 'text-emerald-700 bg-emerald-50',
    SAIDA: 'text-red-700 bg-red-50',
    TRANSFERENCIA: 'text-brand-700 bg-brand-50',
    VENDA: 'text-amber-700 bg-amber-50',
    USO_OS: 'text-orange-700 bg-orange-50',
    AJUSTE: 'text-slate-600 bg-slate-100',
    DEVOLUCAO: 'text-violet-700 bg-violet-50',
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-100 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">PAINEL DO ESTOQUE</h1>
        <div className="card-table text-center py-12">
          <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
          <button onClick={() => { setLoading(true); setError(''); window.location.reload(); }} className="btn-primary text-xs">Tentar novamente</button>
        </div>
      </div>
    );
  }

  // FASE 5 — Fallback seguro: evitar tela branca se dados ainda nao carregaram (edge case)
  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">PAINEL DO ESTOQUE</h1>
        <div className="card-table text-center py-12">
          <p className="text-sm text-slate-500 font-medium mb-3">Carregando dados do painel...</p>
          <button onClick={() => { setLoading(true); setError(''); window.location.reload(); }} className="btn-primary text-xs">Recarregar</button>
        </div>
      </div>
    );
  }

  // Score de saude do estoque (0-100)
  const score =
    data.totalProdutos > 0
      ? Math.max(
          0,
          Math.min(
            100,
            50 +
              (data.totalProdutos > 0 ? Math.min(data.totalProdutos, 50) * 0.3 : 0) -
              data.semEstoque * 3 -
              data.estoqueBaixo * 1.5 +
              (data.margemPercentual > 20 ? 10 : data.margemPercentual > 10 ? 5 : 0) +
              (data.produtosParados < 10 ? 5 : -3) +
              (data.giroEstimado > 0 ? Math.min(data.giroEstimado, 10) : 0)
          )
        )
      : 0;

  const scoreColor =
    score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  const scoreBg =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const scoreLabel =
    score >= 80 ? 'Saudavel' : score >= 60 ? 'Atencao' : score >= 40 ? 'Critico' : 'Risco';

  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">PAINEL DO ESTOQUE</h1>
          <p className="text-xs text-slate-400 mt-0.5">Visao geral e indicadores de desempenho</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Score de saude */}
          <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center relative">
              <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke={score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="4"
                  strokeDasharray={`${score} ${100 - score}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Saude</p>
              <p className={`text-sm font-bold ${scoreColor}`}>{scoreLabel} ({score}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs PRINCIPAIS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Unidades total', value: data.totalUnidades.toLocaleString('pt-BR'), sub: `${data.totalUnidadesLoja.toLocaleString('pt-BR')} na loja`, icon: '📦', color: 'text-blue-600 bg-blue-50' },
          { label: 'Estoque baixo', value: data.estoqueBaixo.toString(), sub: `${data.semEstoque} zerados`, icon: '⚠️', color: data.estoqueBaixo > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50', urgent: data.estoqueBaixo > 0 },
          { label: 'Giro estimado', value: data.giroEstimado.toString(), sub: `${data.produtosParados} parados`, icon: '🔄', color: data.giroEstimado > 0 ? 'text-violet-600 bg-violet-50' : 'text-slate-500 bg-slate-50' },
          { label: 'Categorias', value: data.categoriasCount.toString(), sub: `${data.totalUnidades} unidades`, icon: '📂', color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Mov. hoje', value: (data.entradasHoje + data.saidasHoje + data.transferenciasHoje).toString(), sub: `${data.entradasHoje} ent / ${data.saidasHoje} saidas`, icon: '📋', color: 'text-cyan-600 bg-cyan-50' },
        ].map((k, i) => (
          <div
            key={i}
            className={`card-stat flex items-center gap-3 p-4 ${k.urgent ? 'ring-1 ring-amber-200' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${k.color}`}>
              <span className="text-lg">{k.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">{k.label}</p>
              <p className="text-base font-bold text-slate-800 truncate">{k.value}</p>
              <p className="text-[10px] text-slate-400 truncate">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AÇÕES RÁPIDAS + PRODUTOS ATENÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Ações rápidas */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Acoes Rapidas</h3>
          <div className="space-y-2">
            {[
              { label: 'Entrada Scanner', href: '/estoque/scanner', icon: '📷', desc: 'Escanear codigo de barras', cor: 'hover:bg-sky-50 hover:border-sky-200' },
              { label: 'Cadastro Inteligente', href: '/estoque/central', icon: '🧠', desc: 'Cadastrar novo produto', cor: 'hover:bg-brand-50 hover:border-brand-200' },
              { label: 'Transferir p/ Loja', href: '/estoque/transferencia', icon: '🚚', desc: 'Enviar produtos para loja', cor: 'hover:bg-violet-50 hover:border-violet-200' },
              { label: 'Estoque Central', href: '/estoque/central', icon: '📋', desc: 'Gerenciar inventario', cor: 'hover:bg-amber-50 hover:border-amber-200' },
              { label: 'Relatorios', href: '/estoque/relatorios', icon: '📊', desc: 'Ver saidas e metricas', cor: 'hover:bg-indigo-50 hover:border-indigo-200' },
            ].map((a, i) => (
              <button
                key={i}
                onClick={() => router.push(a.href)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 transition-all text-left ${a.cor}`}
              >
                <span className="text-lg flex-shrink-0">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700">{a.label}</p>
                  <p className="text-[10px] text-slate-400">{a.desc}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Produtos que precisam de atencao */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              {data.produtosAtencao.length > 0
                ? `Produtos que precisam de atencao (${data.produtosAtencao.length})`
                : 'Produtos que precisam de atencao'}
            </h3>
            <button
              onClick={() => router.push('/estoque/central')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Ver todos
            </button>
          </div>
          {data.produtosAtencao.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-700">Estoque saudavel!</p>
              <p className="text-xs text-slate-400 mt-1">Todos os produtos estao com niveis adequados.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.produtosAtencao.map((p) => {
                const isZerado = p.quantidade <= 0;
                const isCritico = p.quantidade <= p.estoqueMinimo && p.quantidade > 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isZerado
                        ? 'bg-red-50/50 border-red-100'
                        : 'bg-amber-50/50 border-amber-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{p.nome}</p>
                      <p className="text-[10px] text-slate-400">
                        SKU: {p.codigo} {p.marca ? `· ${p.marca}` : ''} · Min: {p.estoqueMinimo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        isZerado
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isZerado ? 'ZERADO' : `${p.quantidade} un.`}
                    </span>
                      <button
                        onClick={() => router.push(`/estoque/central`)}
                        className="text-[10px] font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-1 rounded-md hover:bg-brand-100 transition-colors"
                      >
                        Repor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ULTIMAS MOVIMENTACOES */}
      <div className="card-table">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Ultimas movimentacoes</h3>
          <span className="text-[11px] text-slate-400">{data.ultimasMovimentacoes.length} registros</span>
        </div>
        <div className="overflow-auto max-h-72">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-2.5 px-4 font-semibold text-slate-500">Data</th>
                <th className="text-left py-2.5 px-4 font-semibold text-slate-500">Tipo</th>
                <th className="text-left py-2.5 px-4 font-semibold text-slate-500">Produto</th>
                <th className="text-center py-2.5 px-4 font-semibold text-slate-500">Qtd</th>
                <th className="text-left py-2.5 px-4 font-semibold text-slate-500">Origem/Destino</th>
                <th className="text-left py-2.5 px-4 font-semibold text-slate-500">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {data.ultimasMovimentacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Nenhuma movimentacao registrada.
                  </td>
                </tr>
              ) : (
                data.ultimasMovimentacoes.map((m: any, i: number) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                    }`}
                  >
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString('pt-BR')}{' '}
                      <span className="text-slate-300">
                        {new Date(m.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tipoLabel[m.tipo] || 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-medium">{m.peca?.nome || '-'}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-700">{m.quantidade}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[10px]">
                      {m.origem && m.destino ? `${m.origem} → ${m.destino}` : m.origem || m.destino || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{m.usuario || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FASE 15-D.1: INDICADORES PREMIUM */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-purple-500 to-brand-500" />
          <h2 className="text-base font-bold text-slate-800">Indicadores Premium</h2>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">NOVO</span>
        </div>
        <DashboardPremium />
      </div>
    </div>
  );
}
