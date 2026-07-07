import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'MECANICO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: { emAlmoco: { set: true } },
  });

  return NextResponse.json({ emAlmoco: true, name: user.name });
}

export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== 'MECANICO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: { emAlmoco: { set: false } },
  });

  return NextResponse.json({ emAlmoco: false, name: user.name });
}
