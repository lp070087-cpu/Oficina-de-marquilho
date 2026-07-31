'use client';
// FASE 15-D.1: INDICADORES PREMIUM DO DASHBOARD

import { useState, useEffect } from 'react';

interface IndPremium {
  // Top Categorias
  topCategoriasValor: { nome: string; valor: number; qtd: number }[];
  topCategoriasMov: { nome: string; movs: number }[];

  // Top Fornecedores
  topFornecedores: { fornecedor: string; totalProdutos: number; totalValor: number }[];

  // Maior Lucro
  maiorLucro: { nome: string; codigo: string; lucro: number; margem: number }[];

  // Maior Custo
  maiorCusto: { nome: string; codigo: string; custoUn: number; qtd: number }[];

  // Mais Movimentados
  maisMovimentados: { nome: string; codigo: string; entradas: number; saidas: number }[];

  // Transferencias Pendentes (da loja que ainda nao chegaram)
  transferenciasPendentes: { pecaNome: string; quantidade: number; de: string; para: string; data: string }[];

  // Compras no Mes
  comprasMes: { total: number; count: number };

  // Vendas via OS
  vendasOS: { total: number; count: number; pecasCount: number };

  // Sem Giro (produtos parados)
  semGiro: { nome: string; codigo: string; quantidade: number; diasParado: number }[];

  // Criticos (below minimum and urgent)
  criticos: { nome: string; codigo: string; quantidade: number; estoqueMinimo: number }[];

  // Total value and units by central vs loja
  valorCentral: number;
  valorLoja: number;
  unidadesCentral: number;
  unidadesLoja: number;
}

export default function DashboardPremium() {
  const [data, setData] = useState<IndPremium | null>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'categorias' | 'fornecedores' | 'lucro' | 'movimentados' | 'pendencias' | 'criticos'>('categorias');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/premium');
        const d = await res.json();
        setData(d);
      } catch {
        // Fallback: compute what we can from existing endpoints
        const [pecasRes, movsRes] = await Promise.all([
          fetch('/api/pecas').then(r => r.json()),
          fetch('/api/relatorios/movimentacao?tipo=').then(r => r.json()),
        ]);
        const peças: any[] = Array.isArray(pecasRes) ? pecasRes : [];
        const movs: any[] = Array.isArray(movsRes) ? movsRes : [];

        // Compute premium indicators client-side
        const byCategoria: Record<string, { valor: number; qtd: number }> = {};
        const byFornecedor: Record<string, { totalProdutos: number; totalValor: number }> = {};
        const byMov: Record<string, { entradas: number; saidas: number }> = {};

        for (const p of peças) {
          const catName = p.categoria?.nome || 'Sem categoria';
          if (!byCategoria[catName]) byCategoria[catName] = { valor: 0, qtd: 0 };
          byCategoria[catName].valor += (Number(p.precoVenda) || 0) * (p.quantidade || 0);
          byCategoria[catName].qtd += p.quantidade || 0;

          if (p.fornecedor) {
            const f = p.fornecedor;
            if (!byFornecedor[f]) byFornecedor[f] = { totalProdutos: 0, totalValor: 0 };
            byFornecedor[f].totalProdutos++;
            byFornecedor[f].totalValor += (Number(p.precoVenda) || 0) * (p.quantidade || 0);
          }
        }

        for (const m of movs) {
          const nome = m.peca?.nome || 'Desconhecido';
          if (!byMov[nome]) byMov[nome] = { entradas: 0, saidas: 0 };
          if (m.tipo === 'ENTRADA') byMov[nome].entradas += m.quantidade || 0;
          else byMov[nome].saidas += m.quantidade || 0;
        }

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        setData({
          topCategoriasValor: Object.entries(byCategoria)
            .sort((a, b) => b[1].valor - a[1].valor).slice(0, 5)
            .map(([nome, v]) => ({ nome, valor: v.valor, qtd: v.qtd })),
          topCategoriasMov: Object.entries(byCategoria)
            .sort((a, b) => b[1].qtd - a[1].qtd).slice(0, 5)
            .map(([nome, v]) => ({ nome, movs: v.qtd })),
          topFornecedores: Object.entries(byFornecedor)
            .sort((a, b) => b[1].totalValor - a[1].totalValor).slice(0, 10)
            .map(([fornecedor, v]) => ({ fornecedor, ...v })),
          maiorLucro: peças
            .filter((p: any) => (Number(p.precoVenda) || 0) > 0 && (Number(p.precoCusto) || 0) > 0)
            .map((p: any) => ({
              nome: p.nome, codigo: p.codigo,
              lucro: (Number(p.precoVenda) - Number(p.precoCusto)) * (p.quantidade || 0),
              margem: Number(p.precoCusto) > 0 ? Math.round(((Number(p.precoVenda) - Number(p.precoCusto)) / Number(p.precoCusto)) * 100) : 0,
            }))
            .sort((a, b) => b.lucro - a.lucro).slice(0, 10),
          maiorCusto: peças
            .filter((p: any) => (Number(p.precoCusto) || 0) > 0)
            .map((p: any) => ({ nome: p.nome, codigo: p.codigo, custoUn: Number(p.precoCusto), qtd: p.quantidade || 0 }))
            .sort((a, b) => b.custoUn - a.custoUn).slice(0, 10),
          maisMovimentados: Object.entries(byMov)
            .map(([nome, v]) => ({ nome, codigo: '', entradas: v.entradas, saidas: v.saidas }))
            .sort((a, b) => (b.entradas + b.saidas) - (a.entradas + a.saidas)).slice(0, 10),
          transferenciasPendentes: [],
          comprasMes: { total: 0, count: 0 },
          vendasOS: { total: 0, count: 0, pecasCount: 0 },
          semGiro: peças
            .filter((p: any) => p.quantidade > 15)
            .map((p: any) => ({ nome: p.nome, codigo: p.codigo, quantidade: p.quantidade, diasParado: 0 }))
            .sort((a, b) => b.quantidade - a.quantidade).slice(0, 10),
          criticos: peças
            .filter((p: any) => p.estoqueMinimo > 0 && p.quantidade < p.estoqueMinimo && p.quantidade > 0)
            .map((p: any) => ({ nome: p.nome, codigo: p.codigo, quantidade: p.quantidade, estoqueMinimo: p.estoqueMinimo }))
            .sort((a, b) => a.quantidade - b.quantidade).slice(0, 10),
          valorCentral: peças.reduce((s: number, p: any) => s + (Number(p.precoVenda) || 0) * (p.quantidade || 0), 0),
          valorLoja: peças.reduce((s: number, p: any) => s + (Number(p.precoVenda) || 0) * (p.quantidadeLoja || 0), 0),
          unidadesCentral: peças.reduce((s: number, p: any) => s + (p.quantidade || 0), 0),
          unidadesLoja: peças.reduce((s: number, p: any) => s + (p.quantidadeLoja || 0), 0),
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const abas = [
    { key: 'categorias' as const, label: 'Categorias', icon: '📂' },
    { key: 'fornecedores' as const, label: 'Fornecedores', icon: '🏭' },
    { key: 'lucro' as const, label: 'Maior Lucro', icon: '💎' },
    { key: 'movimentados' as const, label: 'Mais Mov.', icon: '🔄' },
    { key: 'pendencias' as const, label: 'Pendencias', icon: '⏳' },
    { key: 'criticos' as const, label: 'Criticos', icon: '🚨' },
  ];

  return (
    <div className="space-y-4">
      {/* RESUMO CENTRAL vs LOJA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Valor Central', value: fm(data.valorCentral), icon: '🏢', color: 'text-blue-600 bg-blue-50' },
          { label: 'Valor Loja', value: fm(data.valorLoja), icon: '🏪', color: 'text-violet-600 bg-violet-50' },
          { label: 'Unid. Central', value: data.unidadesCentral.toLocaleString('pt-BR'), icon: '📦', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Unid. Loja', value: data.unidadesLoja.toLocaleString('pt-BR'), icon: '🛒', color: 'text-amber-600 bg-amber-50' },
        ].map((k, i) => (
          <div key={i} className="card p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${k.color}`}>
              <span className="text-sm">{k.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase">{k.label}</p>
              <p className="text-sm font-bold text-slate-800">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEM GIRO + CRITICOS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sem Giro */}
        <div className="card p-4">
          <h4 className="text-xs font-bold text-slate-700 mb-3">📦 Produtos Sem Giro ({data.semGiro.length})</h4>
          <p className="text-[10px] text-slate-400 mb-2">Estoque parado — produtos com mais de 15 unidades sem movimentacao</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {data.semGiro.length === 0 ? (
              <p className="text-xs text-emerald-600">Nenhum produto parado! ✅</p>
            ) : (
              data.semGiro.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                  <span className="text-slate-700 truncate flex-1">{p.nome}</span>
                  <span className="font-bold text-amber-600 ml-2 flex-shrink-0">{p.quantidade} un.</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Criticos */}
        <div className="card p-4">
          <h4 className="text-xs font-bold text-slate-700 mb-3">🚨 Criticos & Abaixo do Minimo ({data.criticos.length})</h4>
          <p className="text-[10px] text-slate-400 mb-2">Produtos que precisam de reposicao</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {data.criticos.length === 0 ? (
              <p className="text-xs text-emerald-600">Estoque dentro dos niveis! ✅</p>
            ) : (
              data.criticos.map((p, i) => {
                const pct = p.estoqueMinimo > 0 ? Math.round((p.quantidade / p.estoqueMinimo) * 100) : 0;
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 truncate">{p.nome}</p>
                      <p className="text-[10px] text-slate-400">Min: {p.estoqueMinimo} ({pct}%)</p>
                    </div>
                    <span className={`font-bold ml-2 flex-shrink-0 ${p.quantidade <= 2 ? 'text-red-600' : 'text-amber-600'}`}>
                      {p.quantidade} un.
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* TABS: Categorias, Fornecedores, Lucro, Movimentados, Pendencias */}
      <div className="card">
        {/* Sub-tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-slate-50 overflow-x-auto">
          {abas.map(a => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                aba === a.key ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {/* CATEGORIAS */}
          {aba === 'categorias' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Por Valor</h5>
                <div className="space-y-1.5">
                  {data.topCategoriasValor.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-4">{i + 1}</span>
                        <span className="text-slate-700">{c.nome}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{c.qtd} un.</span>
                        <span className="font-semibold text-brand-600">{fm(c.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Por Quantidade</h5>
                <div className="space-y-1.5">
                  {data.topCategoriasMov.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-4">{i + 1}</span>
                        <span className="text-slate-700">{c.nome}</span>
                      </div>
                      <span className="font-semibold text-slate-600">{c.movs} un.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FORNECEDORES */}
          {aba === 'fornecedores' && (
            <div className="space-y-1.5">
              {data.topFornecedores.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhum fornecedor cadastrado</p>
              ) : (
                data.topFornecedores.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-4">{i + 1}</span>
                      <span className="text-slate-700 font-medium">{f.fornecedor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{f.totalProdutos} produtos</span>
                      <span className="font-semibold text-brand-600">{fm(f.totalValor)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MAIOR LUCRO */}
          {aba === 'lucro' && (
            <div className="space-y-1.5">
              {data.maiorLucro.length === 0 ? (
                <p className="text-xs text-slate-400">Sem dados de lucro disponiveis</p>
              ) : (
                data.maiorLucro.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 w-4">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-slate-700 truncate">{p.nome}</p>
                        <p className="text-[10px] text-slate-400">{p.codigo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.margem > 30 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {p.margem}%
                      </span>
                      <span className="font-semibold text-emerald-600">{fm(p.lucro)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MAIOR CUSTO */}
          {aba === 'movimentados' && (
            <div className="space-y-1.5">
              {data.maisMovimentados.length === 0 ? (
                <p className="text-xs text-slate-400">Sem dados de movimentacao</p>
              ) : (
                data.maisMovimentados.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 w-4">{i + 1}</span>
                      <span className="text-slate-700 truncate">{p.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {p.entradas > 0 && <span className="text-emerald-600 font-semibold">↑{p.entradas}</span>}
                      {p.saidas > 0 && <span className="text-red-600 font-semibold">↓{p.saidas}</span>}
                      <span className="text-slate-400">total: {p.entradas + p.saidas}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PENDENCIAS */}
          {aba === 'pendencias' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-lg bg-slate-50 text-center">
                  <p className="text-2xl mb-1">📥</p>
                  <p className="text-xs font-semibold text-slate-700">Compras no Mes</p>
                  <p className="text-lg font-bold text-brand-600">{data.comprasMes.count}</p>
                  <p className="text-[10px] text-slate-400">{fm(data.comprasMes.total)}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 text-center">
                  <p className="text-2xl mb-1">🔧</p>
                  <p className="text-xs font-semibold text-slate-700">Vendas via OS</p>
                  <p className="text-lg font-bold text-purple-600">{data.vendasOS.count}</p>
                  <p className="text-[10px] text-slate-400">{data.vendasOS.pecasCount} pecas · {fm(data.vendasOS.total)}</p>
                </div>
              </div>

              <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                Transferencias Pendentes ({data.transferenciasPendentes.length})
              </h5>
              {data.transferenciasPendentes.length === 0 ? (
                <p className="text-xs text-emerald-600">Nenhuma transferencia pendente ✅</p>
              ) : (
                <div className="space-y-1.5">
                  {data.transferenciasPendentes.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 truncate">{t.pecaNome}</p>
                        <p className="text-[10px] text-slate-400">{t.de} → {t.para}</p>
                      </div>
                      <span className="font-bold text-amber-600 ml-2">{t.quantidade} un.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CRITICOS (já mostrado acima mas com detalhes extra) */}
          {aba === 'criticos' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Maior Custo unitario */}
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Maior Custo Unitario</h5>
                  <div className="space-y-1.5">
                    {data.maiorCusto.slice(0, 5).map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 truncate">{p.nome}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-slate-400">{p.qtd} un.</span>
                          <span className="font-semibold text-slate-600">{fm(p.custoUn)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Criticos detalhados */}
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Abaixo do Minimo</h5>
                  <div className="space-y-1.5">
                    {data.criticos.length === 0 ? (
                      <p className="text-xs text-emerald-600">Tudo em ordem ✅</p>
                    ) : (
                      data.criticos.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-700 truncate">{p.nome}</p>
                            <p className="text-[10px] text-slate-400">Min: {p.estoqueMinimo}</p>
                          </div>
                          <span className="font-bold text-red-600 ml-2">{p.quantidade} un.</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
