import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT - Somente DONO
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const revisao = await prisma.revisao.update({
    where: { id },
    data: {
      nome: body.nome,
      valor: body.valor,
      ativa: body.ativa,
      ordem: body.ordem,
    },
  });
  return NextResponse.json(revisao);
}

// DELETE - Somente DONO
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const { id } = await params;
  await prisma.revisao.update({ where: { id }, data: { ativa: false } });
  return NextResponse.json({ ok: true });
}
