import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!status) return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 });
    await prisma.orcamento.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
