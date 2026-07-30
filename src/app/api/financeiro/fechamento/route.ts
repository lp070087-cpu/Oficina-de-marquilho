import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/fechamento
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }

  const fechamentos = await prisma.fechamentoPeriodo.findMany({ orderBy: { periodo: 'desc' }, take: 24 });
  return NextResponse.json(fechamentos);
}

// POST — Fechar período
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.periodo) return NextResponse.json({ error: 'periodo obrigatorio' }, { status: 400 });

    const [ano, mes] = body.periodo.split('-').map(Number);
    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0, 23, 59, 59, 999);

    // Calcular DRE
    const [vendas, osPagas] = await Promise.all([
      prisma.venda.aggregate({ where: { createdAt: { gte: inicio, lte: fim }, status: 'PAGA' }, _sum: { total: true, descontoTotal: true } }),
      prisma.ordemServico.aggregate({ where: { dataPagamento: { gte: inicio, lte: fim }, statusPagamento: 'PAGO' }, _sum: { valorPago: true, desconto: true } }),
    ]);
    const receitaBruta = Number(vendas._sum.total || 0) + Number(osPagas._sum.valorPago || 0);
    const descontos = Number(vendas._sum.descontoTotal || 0) + Number(osPagas._sum.desconto || 0);
    const receitaLiquida = receitaBruta - descontos;

    const itensVendidos = await prisma.vendaItem.findMany({
      where: { venda: { createdAt: { gte: inicio, lte: fim }, status: 'PAGA' } },
      select: { precoCusto: true, quantidade: true },
    });
    const custos = itensVendidos.reduce((s, i) => s + Number(i.precoCusto) * i.quantidade, 0);
    const lucroBruto = receitaLiquida - custos;

    const despesas = await prisma.lancamentoFinanceiro.aggregate({
      where: { data: { gte: inicio, lte: fim }, tipo: 'DESPESA', status: 'EFETIVADO' }, _sum: { valor: true },
    });
    const despesasTotal = Number(despesas._sum.valor || 0);
    const lucroOperacional = lucroBruto - despesasTotal;
    const margem = receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;

    const fechamento = await prisma.fechamentoPeriodo.upsert({
      where: { periodo: body.periodo },
      create: {
        periodo: body.periodo, dataInicio: inicio, dataFim: fim, status: 'FECHADO',
        receitaBruta, descontos, receitaLiquida, custos, lucroBruto,
        despesas: despesasTotal, lucroOperacional, lucroLiquido: lucroOperacional,
        margem, fechadoPor: session.name, fechadoEm: new Date(), observacoes: body.observacoes,
      },
      update: {
        status: 'FECHADO', receitaBruta, descontos, receitaLiquida, custos, lucroBruto,
        despesas: despesasTotal, lucroOperacional, lucroLiquido: lucroOperacional,
        margem, fechadoPor: session.name, fechadoEm: new Date(), observacoes: body.observacoes,
      },
    });

    await prisma.auditoriaFinanceira.create({
      data: { entidade: 'FechamentoPeriodo', entidadeId: fechamento.id, acao: 'FECHADO',
        descricao: `Período ${body.periodo} fechado — Lucro: R$ ${lucroBruto.toFixed(2)}`,
        usuario: session.name, usuarioId: session.id },
    });

    return NextResponse.json(fechamento, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
