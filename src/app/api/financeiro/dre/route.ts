import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/dre?periodo=2026-07
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }

  const periodoParam = req.nextUrl.searchParams.get('periodo') || '';
  let inicio: Date, fim: Date;

  if (periodoParam) {
    const [ano, mes] = periodoParam.split('-').map(Number);
    inicio = new Date(ano, mes - 1, 1);
    fim = new Date(ano, mes, 0, 23, 59, 59, 999);
  } else {
    const agora = new Date();
    inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  try {
    // DRE já fechada?
    const periodoStr = periodoParam || `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`;
    const fechamento = await prisma.fechamentoPeriodo.findUnique({ where: { periodo: periodoStr } });

    if (fechamento && fechamento.status === 'FECHADO') {
      return NextResponse.json({ fechado: true, ...fechamento });
    }

    // Calcular DRE em tempo real
    // Receita bruta
    const [vendas, osPagas] = await Promise.all([
      prisma.venda.aggregate({ where: { createdAt: { gte: inicio, lte: fim }, status: 'PAGA' }, _sum: { total: true, descontoTotal: true } }),
      prisma.ordemServico.aggregate({ where: { dataPagamento: { gte: inicio, lte: fim }, statusPagamento: 'PAGO' }, _sum: { valorPago: true, desconto: true } }),
    ]);

    const receitaBruta = Number(vendas._sum.total || 0) + Number(osPagas._sum.valorPago || 0);
    const descontos = Number(vendas._sum.descontoTotal || 0) + Number(osPagas._sum.desconto || 0);
    const receitaLiquida = receitaBruta - descontos;

    // Custos (CMV das vendas)
    const itensVendidos = await prisma.vendaItem.findMany({
      where: { venda: { createdAt: { gte: inicio, lte: fim }, status: 'PAGA' } },
      select: { precoCusto: true, quantidade: true },
    });
    const custos = itensVendidos.reduce((s, i) => s + Number(i.precoCusto) * i.quantidade, 0);

    const lucroBruto = receitaLiquida - custos;

    // Despesas
    const despesas = await prisma.lancamentoFinanceiro.aggregate({
      where: { data: { gte: inicio, lte: fim }, tipo: 'DESPESA', status: 'EFETIVADO' },
      _sum: { valor: true },
    });
    const despesasTotal = Number(despesas._sum.valor || 0);

    const lucroOperacional = lucroBruto - despesasTotal;
    const lucroLiquido = lucroOperacional; // sem impostos simplificado
    const margem = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

    // Despesas por centro de custo
    const despesasPorCentro = await prisma.lancamentoFinanceiro.groupBy({
      by: ['centroCustoId'],
      where: { data: { gte: inicio, lte: fim }, tipo: 'DESPESA', status: 'EFETIVADO' },
      _sum: { valor: true },
    });
    const centros = await prisma.centroCusto.findMany({ where: { ativo: true }, select: { id: true, nome: true } });
    const despesasCentro = despesasPorCentro.map(d => ({
      centro: centros.find(c => c.id === d.centroCustoId)?.nome || d.centroCustoId,
      valor: Number(d._sum.valor || 0),
    }));

    // Comparativo mês anterior
    const mesAnterior = new Date(inicio);
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    const fimAnterior = new Date(inicio.getFullYear(), inicio.getMonth(), 0, 23, 59, 59, 999);
    const [vendasAnt, osAnt] = await Promise.all([
      prisma.venda.aggregate({ where: { createdAt: { gte: mesAnterior, lte: fimAnterior }, status: 'PAGA' }, _sum: { total: true } }),
      prisma.ordemServico.aggregate({ where: { dataPagamento: { gte: mesAnterior, lte: fimAnterior }, statusPagamento: 'PAGO' }, _sum: { valorPago: true } }),
    ]);
    const receitaAnterior = Number(vendasAnt._sum.total || 0) + Number(osAnt._sum.valorPago || 0);
    const variacao = receitaAnterior > 0 ? ((receitaBruta - receitaAnterior) / receitaAnterior) * 100 : 0;

    return NextResponse.json({
      fechado: false, periodo: periodoStr,
      receitaBruta, descontos, receitaLiquida, custos,
      lucroBruto, despesas: despesasTotal, lucroOperacional, lucroLiquido,
      margem: Math.round(margem * 100) / 100,
      despesasCentro,
      comparativo: { receitaAnterior, variacao: Math.round(variacao * 100) / 100 },
    });
  } catch (error) {
    console.error('Erro DRE:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
