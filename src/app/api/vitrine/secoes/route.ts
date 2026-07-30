import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const secoes = await prisma.secaoVitrine.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
  });
  return NextResponse.json(secoes);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const { secoes } = body; // array de { id, ordem, ativo }
  for (const s of secoes) {
    await prisma.secaoVitrine.update({ where: { id: s.id }, data: { ordem: s.ordem, ativo: s.ativo } });
  }
  return NextResponse.json({ ok: true });
}
