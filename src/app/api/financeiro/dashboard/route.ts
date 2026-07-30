import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/dashboard — KPIs Financeiro Premium
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }

  const periodo = req.nextUrl.searchParams.get('periodo') || 'mes'; // hoje, semana, mes, ano, personalizado
  const dataInicio = req.nextUrl.searchParams.get('dataInicio');
  const dataFim = req.nextUrl.searchParams.get('dataFim');

  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioHoje = new Date(hoje);
  const fimHoje = new Date(hoje); fimHoje.setHours(23, 59, 59, 999);

  let inicio: Date, fim: Date;
  if (dataInicio && dataFim) {
    inicio = new Date(dataInicio);
    fim = new Date(dataFim); fim.setHours(23, 59, 59, 999);
  } else {
    switch (periodo) {
      case 'hoje': inicio = inicioHoje; fim = fimHoje; break;
      case 'semana': {
        inicio = new Date(hoje); inicio.setDate(hoje.getDate() - hoje.getDay());
        fim = fimHoje; break;
      }
      case 'ano': inicio = new Date(hoje.getFullYear(), 0, 1); fim = fimHoje; break;
      case 'mes':
      default: inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1); fim = fimHoje; break;
    }
  }

  // Ontem
  const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
  const fimOntem = new Date(ontem); fimOntem.setHours(23, 59, 59, 999);

  try {
    // Receita do período (vendas + OS pagas)
    const [vendasPeriodo, vendasOntem, osPagasPeriodo, osPagasOntem] = await Promise.all([
      prisma.venda.aggregate({ where: { createdAt: { gte: inicio, lte: fim }, status: 'PAGA' }, _sum: { total: true } }),
      prisma.venda.aggregate({ where: { createdAt: { gte: ontem, lte: fimOntem }, status: 'PAGA' }, _sum: { total: true } }),
      prisma.ordemServico.aggregate({ where: { dataPagamento: { gte: inicio, lte: fim }, statusPagamento: 'PAGO' }, _sum: { valorPago: true } }),
      prisma.ordemServico.aggregate({ where: { dataPagamento: { gte: ontem, lte: fimOntem }, statusPagamento: 'PAGO' }, _sum: { valorPago: true } }),
    ]);

    const receitaHoje = Number(vendasPeriodo._sum.total || 0) + Number(osPagasPeriodo._sum.valorPago || 0);
    const receitaOntem = Number(vendasOntem._sum.total || 0) + Number(osPagasOntem._sum.valorPago || 0);

    // Vendas do período e semanal
    const [vendasSemana, osSemana, vendasMes, osMes, vendasAno, osAno] = await Promise.all([
      prisma.venda.aggregate({ where: { createdAt: { gte: inicio, lte: fim }, status: 'PAGA' }, _sum: { total: true } }),
      prisma.ordemServico.aggregate({ where: { dataPagamento: { gte: inicio, lte: fim }, statusPagamento: 'PAGO' }, _sum: { valorPago: true } }),
      prisma.venda.aggregate({ where: { createdAt: { gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1), lte: fim }, status: 'PAGA' }, _sum: { total: true } }),
      prisma.ordemServico.aggregate({ where: { dataPagamento: { gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1), lte: fim }, statusPagamento: 'PAGO' }, _sum: { valorPago: true } }),
      prisma.venda.aggregate({ where: { createdAt: { gte: new Date(hoje.getFullYear(), 0, 1), lte: fim }, status: 'PAGA' }, _sum: { total: true } }),
      prisma.ordemServico.aggregate({ where: { dataPagamento: { gte: new Date(hoje.getFullYear(), 0, 1), lte: fim }, statusPagamento: 'PAGO' }, _sum: { valorPago: true } }),
    ]);

    const receitaSemana = Number(vendasSemana._sum.total || 0) + Number(osSemana._sum.valorPago || 0);
    const receitaMes = Number(vendasMes._sum.total || 0) + Number(osMes._sum.valorPago || 0);
    const receitaAno = Number(vendasAno._sum.total || 0) + Number(osAno._sum.valorPago || 0);

    // Quantidade de vendas e OS
    const [qtdVendasMes, qtdOsMes, qtdComprasMes] = await Promise.all([
      prisma.venda.count({ where: { createdAt: { gte: inicio, lte: fim }, status: 'PAGA' } }),
      prisma.ordemServico.count({ where: { createdAt: { gte: inicio, lte: fim } } }),
      prisma.lancamentoFinanceiro.count({ where: { data: { gte: inicio, lte: fim }, categoria: 'COMPRA', status: 'EFETIVADO' } }),
    ]);

    // Lucro — total vendas menos custo
    const vendasLucro = await prisma.vendaItem.findMany({
      where: { venda: { createdAt: { gte: inicio, lte: fim }, status: 'PAGA' } },
      select: { precoVendido: true, precoCusto: true, quantidade: true },
    });
    const lucroBrutoVendas = vendasLucro.reduce((s, i) => s + (Number(i.precoVendido) - Number(i.precoCusto)) * i.quantidade, 0);

    // Despesas do período
    const despesasPeriodo = await prisma.lancamentoFinanceiro.aggregate({
      where: { data: { gte: inicio, lte: fim }, tipo: 'DESPESA', status: 'EFETIVADO' },
      _sum: { valor: true },
    });
    const despesasTotal = Number(despesasPeriodo._sum.valor || 0);

    const receitaTotal = receitaMes;
    const lucroBruto = lucroBrutoVendas;
    const lucroLiquido = lucroBruto - despesasTotal;
    const margem = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;
    const ticketMedio = qtdVendasMes > 0 ? receitaTotal / qtdVendasMes : 0;

    // Contas a receber e a pagar
    const [contasReceber, contasPagar] = await Promise.all([
      prisma.contaReceber.aggregate({ where: { status: { in: ['EM_ABERTO', 'PARCIAL', 'ATRASADO'] } }, _sum: { valor: true }, _count: true }),
      prisma.contaPagar.aggregate({ where: { status: { in: ['EM_ABERTO', 'VENCIDO', 'PARCELADO', 'AGENDADO'] } }, _sum: { valor: true }, _count: true }),
    ]);

    // Saldo atual (entradas - saídas do período)
    const entradas = Number((await prisma.lancamentoFinanceiro.aggregate({
      where: { data: { gte: inicio, lte: fim }, tipo: 'RECEITA', status: 'EFETIVADO' }, _sum: { valor: true }
    }))._sum.valor || 0);
    const saidas = Number((await prisma.lancamentoFinanceiro.aggregate({
      where: { data: { gte: inicio, lte: fim }, tipo: 'DESPESA', status: 'EFETIVADO' }, _sum: { valor: true }
    }))._sum.valor || 0);

    // Valor em estoque (custo)
    const estoqueValor = await prisma.peca.aggregate({ _sum: { precoCusto: true } });

    // Gráfico: receita diária (últimos 30 dias)
    const ultimos30dias = new Date(hoje); ultimos30dias.setDate(ultimos30dias.getDate() - 30);
    const vendasDiarias = await prisma.venda.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: ultimos30dias, lte: fimHoje }, status: 'PAGA' },
      _sum: { total: true },
    });

    const receitaDiaria: Record<string, number> = {};
    vendasDiarias.forEach(v => {
      const d = new Date(v.createdAt).toISOString().split('T')[0];
      receitaDiaria[d] = (receitaDiaria[d] || 0) + Number(v._sum.total || 0);
    });

    // Gráfico: receita mensal (últimos 12 meses)
    const ultimos12 = new Date(hoje); ultimos12.setMonth(ultimos12.getMonth() - 11);
    ultimos12.setDate(1);
    const vendasMensais = await prisma.venda.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: ultimos12, lte: fimHoje }, status: 'PAGA' },
      _sum: { total: true },
    });
    const receitaMensal: Record<string, number> = {};
    vendasMensais.forEach(v => {
      const mes = `${new Date(v.createdAt).getFullYear()}-${String(new Date(v.createdAt).getMonth() + 1).padStart(2, '0')}`;
      receitaMensal[mes] = (receitaMensal[mes] || 0) + Number(v._sum.total || 0);
    });

    return NextResponse.json({
      receitaHoje, receitaOntem, receitaSemana, receitaMes, receitaAno,
      lucroBruto, lucroLiquido, margem: Math.round(margem * 100) / 100,
      ticketMedio,
      qtdVendas: qtdVendasMes, qtdOs: qtdOsMes, qtdCompras: qtdComprasMes,
      contasReceber: Number(contasReceber._sum.valor || 0),
      contasReceberQtd: contasReceber._count,
      contasPagar: Number(contasPagar._sum.valor || 0),
      contasPagarQtd: contasPagar._count,
      saldoAtual: entradas - saidas,
      saldoPrevisto: entradas - saidas + Number(contasReceber._sum.valor || 0) - Number(contasPagar._sum.valor || 0),
      valorEstoque: Number(estoqueValor._sum.precoCusto || 0) * 0.6, // valor médio estimado
      receitaDiaria: Object.entries(receitaDiaria).map(([data, valor]) => ({ data, valor })),
      receitaMensal: Object.entries(receitaMensal).map(([mes, valor]) => ({ mes, valor })),
      periodo: { inicio: inicio.toISOString(), fim: fim.toISOString(), tipo: periodo },
    });
  } catch (error) {
    console.error('Erro dashboard financeiro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
