import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    // Fetch all pecas with categoria
    const pecas = await prisma.peca.findMany({
      where: { ativo: true },
      include: { categoria: { select: { nome: true, id: true, slug: true } } },
    });

    // Fetch movimentacoes recentes (ultimos 30 dias)
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const movs = await prisma.movimentacaoEstoque.findMany({
      where: { createdAt: { gte: trintaDiasAtras } },
      include: { peca: { select: { nome: true, codigo: true } } },
    });

    // Top categorias por valor
    const byCategoria: Record<string, { nome: string; valor: number; qtd: number }> = {};
    for (const p of pecas) {
      const catName = p.categoria?.nome || 'Sem categoria';
      if (!byCategoria[catName]) byCategoria[catName] = { nome: catName, valor: 0, qtd: 0 };
      byCategoria[catName].valor += Number(p.precoVenda) * p.quantidade;
      byCategoria[catName].qtd += p.quantidade;
    }

    // Top fornecedores
    const byForn: Record<string, { fornecedor: string; totalProdutos: number; totalValor: number }> = {};
    for (const p of pecas) {
      if (!p.marca) continue;
      if (!byForn[p.marca]) byForn[p.marca] = { fornecedor: p.marca, totalProdutos: 0, totalValor: 0 };
      byForn[p.marca].totalProdutos++;
      byForn[p.marca].totalValor += Number(p.precoVenda) * p.quantidade;
    }

    // Maior lucro
    const maiorLucro = pecas
      .filter(p => Number(p.precoVenda) > 0 && Number(p.precoCusto) > 0)
      .map(p => {
        const lucro = (Number(p.precoVenda) - Number(p.precoCusto)) * p.quantidade;
        const margem = Number(p.precoCusto) > 0
          ? Math.round(((Number(p.precoVenda) - Number(p.precoCusto)) / Number(p.precoCusto)) * 100)
          : 0;
        return { nome: p.nome, codigo: p.codigo, lucro, margem };
      })
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 10);

    // Maior custo unitario
    const maiorCusto = pecas
      .filter(p => Number(p.precoCusto) > 0)
      .map(p => ({ nome: p.nome, codigo: p.codigo, custoUn: Number(p.precoCusto), qtd: p.quantidade }))
      .sort((a, b) => b.custoUn - a.custoUn)
      .slice(0, 10);

    // Mais movimentados
    const byMov: Record<string, { nome: string; codigo: string; entradas: number; saidas: number }> = {};
    for (const m of movs) {
      const nome = m.peca?.nome || 'Desconhecido';
      if (!byMov[nome]) byMov[nome] = { nome, codigo: m.peca?.codigo || '', entradas: 0, saidas: 0 };
      if (m.tipo === 'ENTRADA') byMov[nome].entradas += m.quantidade;
      else byMov[nome].saidas += m.quantidade;
    }

    // Sem giro (parados > 15 unidades sem movimentacao)
    const movedIds = new Set(movs.map(m => m.pecaId));
    const semGiro = pecas
      .filter(p => p.quantidade > 15 && !movedIds.has(p.id))
      .map(p => ({ nome: p.nome, codigo: p.codigo, quantidade: p.quantidade, diasParado: 30 }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    // Criticos (below minimum)
    const criticos = pecas
      .filter(p => p.quantidade <= p.estoqueMinimo && p.quantidade > 0)
      .map(p => ({ nome: p.nome, codigo: p.codigo, quantidade: p.quantidade, estoqueMinimo: p.estoqueMinimo }))
      .sort((a, b) => a.quantidade - b.quantidade)
      .slice(0, 10);

    // Totals
    const valorCentral = pecas.reduce((s, p) => s + Number(p.precoVenda) * p.quantidade, 0);
    const valorLoja = pecas.reduce((s, p) => s + Number(p.precoVenda) * p.quantidadeLoja, 0);
    const unidadesCentral = pecas.reduce((s, p) => s + p.quantidade, 0);
    const unidadesLoja = pecas.reduce((s, p) => s + p.quantidadeLoja, 0);

    // Compras no mes
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const entradas = movs.filter(m => m.tipo === 'ENTRADA' && m.createdAt >= inicioMes);
    const comprasMes = {
      total: 0,
      count: entradas.length,
    };

    // Vendas via OS
    const itensOS = await prisma.itemOS.findMany({
      where: { ordemServico: { createdAt: { gte: inicioMes } } },
    });
    const vendasOS = {
      total: itensOS.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0),
      count: itensOS.length,
      pecasCount: itensOS.reduce((s, i) => s + i.quantidade, 0),
    };

    // Transferencias pendentes
    const transferencias = await prisma.transferenciaEstoque.findMany({
      where: { createdAt: { gte: inicioMes } },
      include: { peca: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      topCategoriasValor: Object.values(byCategoria).sort((a, b) => b.valor - a.valor).slice(0, 5),
      topCategoriasMov: Object.values(byCategoria).sort((a, b) => b.qtd - a.qtd).slice(0, 5),
      topFornecedores: Object.values(byForn).sort((a, b) => b.totalValor - a.totalValor).slice(0, 10),
      maiorLucro,
      maiorCusto,
      maisMovimentados: Object.values(byMov).sort((a, b) => (b.entradas + b.saidas) - (a.entradas + a.saidas)).slice(0, 10),
      transferenciasPendentes: transferencias.map(t => ({
        pecaNome: t.peca?.nome || '-',
        quantidade: t.quantidade,
        de: t.de,
        para: t.para,
        data: t.createdAt.toISOString(),
      })),
      comprasMes,
      vendasOS,
      semGiro,
      criticos,
      valorCentral,
      valorLoja,
      unidadesCentral,
      unidadesLoja,
    });
  } catch (error) {
    console.error('Dashboard premium error:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 });
  }
}
