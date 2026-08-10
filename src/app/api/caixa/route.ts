import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: status do caixa + sessoes + resumo diario
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    // Caixa atual
    const caixa = await prisma.caixa.findFirst({
      where: { status: 'ABERTO' },
      orderBy: { createdAt: 'desc' },
    });

    // Sessao atual
    let sessao = null;
    if (caixa) {
      sessao = await prisma.sessaoCaixa.findFirst({
        where: { caixaId: caixa.id, status: 'ABERTA' },
        orderBy: { abertoEm: 'desc' },
        include: {
          movimentacoes: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      });
    }

    // Resumo diario
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const vendasHoje = await prisma.venda.aggregate({
      where: { status: 'PAGA', createdAt: { gte: hoje, lt: amanha } },
      _sum: { total: true },
      _count: true,
    });

    const pagamentosHoje = await prisma.pagamentoVenda.findMany({
      where: { venda: { status: 'PAGA', createdAt: { gte: hoje, lt: amanha } } },
      select: { tipo: true, valor: true },
    });

    const resumoPagamentos: Record<string, number> = {};
    for (const p of pagamentosHoje) {
      resumoPagamentos[p.tipo] = (resumoPagamentos[p.tipo] || 0) + Number(p.valor);
    }

    return NextResponse.json({
      caixaAberto: !!caixa,
      sessaoAberta: !!sessao,
      caixa,
      sessao,
      resumoHoje: {
        totalVendas: Number(vendasHoje._sum.total) || 0,
        qtdVendas: vendasHoje._count,
        porTipo: resumoPagamentos,
      },
    });
  } catch (e: any) {
    console.error('Erro ao consultar caixa:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST: operacoes de caixa (com sessoes)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { acao, valor, descricao } = body;
    const operador = session.name || session.id;

    if (acao === 'ABRIR_CAIXA') {
      // Atômico: evita race condition com duas requisições simultâneas
      const caixa = await prisma.$transaction(async (tx) => {
        const aberto = await tx.caixa.findFirst({ where: { status: 'ABERTO' } });
        if (aberto) throw new Error('CAIXA_JA_ABERTO');
        return tx.caixa.create({ data: { status: 'ABERTO' } });
      });
      return NextResponse.json({ ok: true, caixa });
    }

    if (acao === 'ABRIR_SESSAO') {
      // Atômico: evita race condition com duas requisições simultâneas
      const result = await prisma.$transaction(async (tx) => {
        const caixa = await tx.caixa.findFirst({ where: { status: 'ABERTO' } });
        if (!caixa) throw new Error('CAIXA_NAO_ABERTO');

        const existente = await tx.sessaoCaixa.findFirst({
          where: { caixaId: caixa.id, status: 'ABERTA' },
          orderBy: { abertoEm: 'desc' },
        });
        if (existente) throw new Error('SESSAO_JA_ABERTA');

        const saldoIni = parseFloat(valor) || 0;
        const sessao = await tx.sessaoCaixa.create({
          data: {
            caixaId: caixa.id,
            status: 'ABERTA',
            operador,
            saldoInicial: saldoIni,
            saldoDinheiro: saldoIni,
            abertoEm: new Date(),
          },
        });

        await tx.movimentacaoCaixa.create({
          data: { sessaoId: sessao.id, tipo: 'ABERTURA', valor: saldoIni, descricao: `Sessao aberta por ${operador}`, usuario: operador },
        });

        return { sessao };
      });

      return NextResponse.json({ ok: true, sessao: result.sessao });
    }

    if (acao === 'FECHAR_SESSAO') {
      const caixa = await prisma.caixa.findFirst({ where: { status: 'ABERTO' } });
      if (!caixa) return NextResponse.json({ error: 'Nenhum caixa aberto' }, { status: 400 });

      const sessao = await prisma.sessaoCaixa.findFirst({
        where: { caixaId: caixa.id, status: 'ABERTA' },
        orderBy: { abertoEm: 'desc' },
      });
      if (!sessao) return NextResponse.json({ error: 'Nenhuma sessao aberta' }, { status: 400 });

      const atualizada = await prisma.sessaoCaixa.update({
        where: { id: sessao.id },
        data: {
          status: 'FECHADA',
          saldoFinal: Number(sessao.saldoInicial) + Number(sessao.totalVendas) + Number(sessao.totalSuprimentos) - Number(sessao.totalSangrias),
          fechadoEm: new Date(),
          observacoes: descricao || null,
        },
      });

      await prisma.movimentacaoCaixa.create({
        data: { sessaoId: sessao.id, tipo: 'FECHAMENTO', valor: Number(atualizada.saldoFinal), descricao: `Sessao fechada por ${operador}`, usuario: operador },
      });

      return NextResponse.json({ ok: true, sessao: atualizada });
    }

    if (acao === 'FECHAR_CAIXA') {
      const caixa = await prisma.caixa.findFirst({ where: { status: 'ABERTO' } });
      if (!caixa) return NextResponse.json({ error: 'Nenhum caixa aberto' }, { status: 400 });

      // Fechar sessao pendente se existir
      const sessaoAberta = await prisma.sessaoCaixa.findFirst({
        where: { caixaId: caixa.id, status: 'ABERTA' },
        orderBy: { abertoEm: 'desc' },
      });

      if (sessaoAberta) {
        await prisma.sessaoCaixa.update({
          where: { id: sessaoAberta.id },
          data: { status: 'FECHADA', saldoFinal: Number(sessaoAberta.saldoDinheiro), fechadoEm: new Date() },
        });
      }

      await prisma.caixa.update({
        where: { id: caixa.id },
        data: { status: 'FECHADO' },
      });

      return NextResponse.json({ ok: true });
    }

    // SANGRIA ou SUPRIMENTO (na sessao atual)
    const caixa = await prisma.caixa.findFirst({ where: { status: 'ABERTO' } });
    if (!caixa) return NextResponse.json({ error: 'Nenhum caixa aberto' }, { status: 400 });

    const sessao = await prisma.sessaoCaixa.findFirst({
      where: { caixaId: caixa.id, status: 'ABERTA' },
      orderBy: { abertoEm: 'desc' },
    });
    if (!sessao) return NextResponse.json({ error: 'Nenhuma sessao aberta' }, { status: 400 });

    const v = parseFloat(valor) || 0;
    if (v <= 0) return NextResponse.json({ error: 'Valor invalido' }, { status: 400 });

    if (acao === 'SANGRIA') {
      await prisma.sessaoCaixa.update({
        where: { id: sessao.id },
        data: { saldoDinheiro: { decrement: v }, totalSaidas: { increment: v }, totalSangrias: { increment: v } },
      });
      await prisma.movimentacaoCaixa.create({
        data: { sessaoId: sessao.id, tipo: 'SANGRIA', valor: v, descricao: descricao || 'Sangria', usuario: operador },
      });
      return NextResponse.json({ ok: true });
    }

    if (acao === 'SUPRIMENTO') {
      await prisma.sessaoCaixa.update({
        where: { id: sessao.id },
        data: { saldoDinheiro: { increment: v }, totalEntradas: { increment: v }, totalSuprimentos: { increment: v } },
      });
      await prisma.movimentacaoCaixa.create({
        data: { sessaoId: sessao.id, tipo: 'SUPRIMENTO', valor: v, descricao: descricao || 'Suprimento', usuario: operador },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acao invalida. Use: ABRIR_CAIXA, ABRIR_SESSAO, FECHAR_SESSAO, FECHAR_CAIXA, SANGRIA, SUPRIMENTO' }, { status: 400 });
  } catch (e: any) {
    console.error('Erro na operacao de caixa:', e);
    if (e?.message === 'CAIXA_JA_ABERTO') {
      return NextResponse.json({ error: 'Ja existe um caixa aberto' }, { status: 400 });
    }
    if (e?.message === 'CAIXA_NAO_ABERTO') {
      return NextResponse.json({ error: 'Abra o caixa primeiro' }, { status: 400 });
    }
    if (e?.message === 'SESSAO_JA_ABERTA') {
      return NextResponse.json({ error: 'Ja existe uma sessao aberta neste caixa' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
