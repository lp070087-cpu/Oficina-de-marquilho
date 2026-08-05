import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — detalhes de um pedido
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { id } = await params;

    const pedido = await prisma.pedido.findFirst({
      where: { id, clienteId: session.clienteId },
      include: {
        itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, marca: true, precoVenda: true, categoria: { select: { nome: true } } } } } },
        historico: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    return NextResponse.json(pedido);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
