import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/comissoes
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') || '';
  const periodo = req.nextUrl.searchParams.get('periodo') || '';

  const where: any = {};
  if (status) where.status = status;
  if (periodo) where.periodo = periodo;

  const comissoes = await prisma.comissao.findMany({
    where, orderBy: { createdAt: 'desc' }, take: 200,
  });
  return NextResponse.json(comissoes);
}

// POST — Pagar comissão
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

    const data: any = { status: body.status || 'PAGA', dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : new Date(), pagoPor: session.name };
    if (body.observacoes) data.observacoes = body.observacoes;

    const comissao = await prisma.comissao.update({ where: { id: body.id }, data });

    await prisma.auditoriaFinanceira.create({
      data: { entidade: 'Comissao', entidadeId: comissao.id, acao: 'PAGO',
        descricao: `Comissão paga a ${comissao.usuario} — R$ ${Number(comissao.valor).toFixed(2)}`,
        usuario: session.name, usuarioId: session.id },
    });

    return NextResponse.json(comissao);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
