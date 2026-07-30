import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — sessões ativas do cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const sessoes = await prisma.sessaoCliente.findMany({
    where: { clienteId: session.clienteId, ativo: true },
    select: { id: true, ip: true, userAgent: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const cliente = await prisma.cliente.findUnique({
    where: { id: session.clienteId },
    select: { ultimoLogin: true },
  });

  return NextResponse.json({ sessoes, ultimoLogin: cliente?.ultimoLogin });
}

// DELETE — encerrar sessão específica (?id=...)
export async function DELETE(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  await prisma.sessaoCliente.updateMany({
    where: { id, clienteId: session.clienteId },
    data: { ativo: false },
  });

  return NextResponse.json({ ok: true });
}
