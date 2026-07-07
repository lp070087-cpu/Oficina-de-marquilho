import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const status = req.nextUrl.searchParams.get('status') || '';
  const where: any = {};
  if (session.role === 'MECANICO') where.mecanicoId = session.id;
  if (status) where.status = status;
  const ordens = await prisma.ordemServico.findMany({
    where,
    include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(ordens);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const os = await prisma.ordemServico.create({
    data: {
      nomeCliente: body.nomeCliente,
      telefoneCliente: body.telefoneCliente,
      modeloMoto: body.modeloMoto,
      placaMoto: body.placaMoto || null,
      anoMoto: body.anoMoto || null,
      descricaoProblema: body.descricaoProblema,
      status: 'ABERTA',
      tipoServico: body.tipoServico || null,
      mecanicoId: body.mecanicoId || null,
      balcaoId: session.role === 'BALCAO' ? session.id : null,
    },
    include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: true },
  });
  return NextResponse.json(os, { status: 201 });
}
