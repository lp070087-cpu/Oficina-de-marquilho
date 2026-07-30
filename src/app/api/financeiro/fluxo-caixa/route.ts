import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/fluxo-caixa?mes=2026-07
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }

  const mesParam = req.nextUrl.searchParams.get('mes') || '';
  const agora = new Date();
  let inicio: Date, fim: Date;

  if (mesParam) {
    const [ano, mes] = mesParam.split('-').map(Number);
    inicio = new Date(ano, mes - 1, 1);
    fim = new Date(ano, mes, 0, 23, 59, 59, 999);
  } else {
    inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  try {
    // Movimentações do período
    const movimentacoes = await prisma.lancamentoFinanceiro.findMany({
      where: { data: { gte: inicio, lte: fim }, status: { not: 'CANCELADO' } },
      include: { centroCusto: { select: { nome: true } } },
      orderBy: { data: 'asc' },
    });

    // Agrupar por dia
    const fluxoDiario: Record<string, { entradas: number; saidas: number }> = {};
    let saldoInicial = 0;

    // Buscar saldo do período anterior
    const saldoAnterior = await prisma.lancamentoFinanceiro.aggregate({
      where: { data: { lt: inicio }, status: 'EFETIVADO' },
      _sum: { valor: true },
    });

    // Entradas e saídas por dia
    const entradasTotal = movimentacoes.filter(m => m.tipo === 'RECEITA').reduce((s, m) => s + Number(m.valor), 0);
    const saidasTotal = movimentacoes.filter(m => m.tipo === 'DESPESA').reduce((s, m) => s + Number(m.valor), 0);

    movimentacoes.forEach(m => {
      const dia = new Date(m.data).toISOString().split('T')[0];
      if (!fluxoDiario[dia]) fluxoDiario[dia] = { entradas: 0, saidas: 0 };
      if (m.tipo === 'RECEITA') fluxoDiario[dia].entradas += Number(m.valor);
      else fluxoDiario[dia].saidas += Number(m.valor);
    });

    // Saldo diário acumulado
    let acumulado = 0;
    const saldoDiario = Object.entries(fluxoDiario).sort(([a], [b]) => a.localeCompare(b)).map(([dia, v]) => {
      acumulado += v.entradas - v.saidas;
      return { dia, entradas: v.entradas, saidas: v.saidas, saldo: acumulado };
    });

    // Previsões: contas a receber e pagar futuras
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const [previstasReceber, previstasPagar] = await Promise.all([
      prisma.contaReceber.aggregate({
        where: { status: { in: ['EM_ABERTO', 'ATRASADO'] }, dataVencimento: { gte: hoje } },
        _sum: { valor: true },
      }),
      prisma.contaPagar.aggregate({
        where: { status: { in: ['EM_ABERTO', 'AGENDADO'] }, dataVencimento: { gte: hoje } },
        _sum: { valor: true },
      }),
    ]);

    return NextResponse.json({
      periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
      entradasTotal,
      saidasTotal,
      saldo: entradasTotal - saidasTotal,
      saldoPrevisto: entradasTotal - saidasTotal + Number(previstasReceber._sum.valor || 0) - Number(previstasPagar._sum.valor || 0),
      entradasPrevistas: Number(previstasReceber._sum.valor || 0),
      saidasPrevistas: Number(previstasPagar._sum.valor || 0),
      saldoDiario,
      movimentacoes: movimentacoes.slice(0, 300),
    });
  } catch (error) {
    console.error('Erro fluxo de caixa:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
