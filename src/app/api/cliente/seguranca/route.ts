import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — sessões ativas do cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — encerrar sessão específica (?id=...)
export async function DELETE(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  try {
    await prisma.sessaoCliente.updateMany({
      where: { id, clienteId: session.clienteId },
      data: { ativo: false },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
