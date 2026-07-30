import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH — marcar todas como lidas
export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  await prisma.notificacao.updateMany({
    where: { usuarioId: session.id, lida: false },
    data: { lida: true, lidaEm: new Date() },
  });

  return NextResponse.json({ ok: true });
}
