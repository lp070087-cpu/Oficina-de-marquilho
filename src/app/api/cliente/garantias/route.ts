import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — listar garantias do cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status');

  const where: any = { clienteId: session.clienteId };
  if (status) where.status = status;

  const garantias = await prisma.garantiaCliente.findMany({
    where,
    include: {
      peca: { select: { nome: true, codigo: true, imagemUrl: true, marca: true } },
      pedido: { select: { numero: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(garantias);
}
