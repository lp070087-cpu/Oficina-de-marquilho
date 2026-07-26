import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const status = req.nextUrl.searchParams.get('status') || '';
  const where: any = {};
  if (status) where.status = status;
  const ordens = await prisma.ordemServico.findMany({
    where,
    include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json(ordens);
}

export async function POST(req: NextRequest) {
  try {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  if (!body.nomeCliente || !body.modeloMoto || !body.descricaoProblema) {
    return NextResponse.json({ error: 'Cliente, modelo e descrição do problema são obrigatórios' }, { status: 400 });
  }
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
  } catch (error) {
    console.error('Erro ao criar OS:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
