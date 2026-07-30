import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — listar pedidos do cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: session.clienteId, tipo: 'VITRINE' },
    include: {
      itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, marca: true, categoria: { select: { nome: true } } } } } },
      historico: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(pedidos);
}
