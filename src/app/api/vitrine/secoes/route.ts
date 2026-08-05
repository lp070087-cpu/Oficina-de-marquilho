import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const secoes = await prisma.secaoVitrine.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    });
    return NextResponse.json(secoes);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { secoes } = body; // array de { id, ordem, ativo }
    for (const s of secoes) {
      await prisma.secaoVitrine.update({ where: { id: s.id }, data: { ordem: s.ordem, ativo: s.ativo } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
