import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — histórico de produtos vistos pelo cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const historico = await prisma.historicoNavegacao.findMany({
    where: { clienteId: session.clienteId },
    include: {
      peca: {
        select: {
          id: true, nome: true, codigo: true, imagemUrl: true, precoVenda: true,
          precoOferta: true, marca: true, categoria: { select: { nome: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    distinct: ['pecaId'],
  });

  return NextResponse.json(historico);
}
