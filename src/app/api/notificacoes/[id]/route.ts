import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH — marcar uma como lida
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  await prisma.notificacao.updateMany({
    where: { id, usuarioId: session.id },
    data: { lida: true, lidaEm: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — remover/arquivar
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  await prisma.notificacao.deleteMany({
    where: { id, usuarioId: session.id },
  });

  return NextResponse.json({ ok: true });
}
