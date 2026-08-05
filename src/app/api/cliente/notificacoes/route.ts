import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — listar notificações do cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const naoLidas = req.nextUrl.searchParams.get('naoLidas');

    const where: any = { clienteId: session.clienteId };
    if (naoLidas === '1') where.lida = false;

    const notificacoes = await prisma.notificacaoCliente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalNaoLidas = await prisma.notificacaoCliente.count({
      where: { clienteId: session.clienteId, lida: false },
    });

    return NextResponse.json({ notificacoes, totalNaoLidas });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — marcar como lida
export async function PUT(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) {
      // Marcar todas como lidas
      await prisma.notificacaoCliente.updateMany({
        where: { clienteId: session.clienteId, lida: false },
        data: { lida: true },
      });
      return NextResponse.json({ ok: true });
    }

    await prisma.notificacaoCliente.update({
      where: { id },
      data: { lida: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
