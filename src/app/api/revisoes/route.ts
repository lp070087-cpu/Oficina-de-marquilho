import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - DONO e BALCAO podem consultar
export async function GET() {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const revisoes = await prisma.revisao.findMany({
    where: { ativa: true },
    orderBy: { ordem: 'asc' },
  });
  return NextResponse.json(revisoes);
}

// POST - Somente DONO pode cadastrar
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const revisao = await prisma.revisao.create({
    data: {
      nome: body.nome,
      valor: body.valor || 0,
      ativa: body.ativa !== undefined ? body.ativa : true,
      ordem: body.ordem || 0,
    },
  });
  return NextResponse.json(revisao, { status: 201 });
}
