import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  const session = await getVitrineSession(authHeader);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const favoritos = await prisma.favorito.findMany({
    where: { clienteId: session.clienteId },
    include: {
      peca: {
        include: { categoria: { select: { nome: true, slug: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(favoritos);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  const session = await getVitrineSession(authHeader);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { pecaId } = body;
  if (!pecaId) return NextResponse.json({ error: 'pecaId é obrigatório' }, { status: 400 });

  const existente = await prisma.favorito.findUnique({
    where: { clienteId_pecaId: { clienteId: session.clienteId, pecaId } },
  });
  if (existente) {
    await prisma.favorito.delete({ where: { id: existente.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorito.create({
    data: { clienteId: session.clienteId, pecaId },
  });
  return NextResponse.json({ favorited: true }, { status: 201 });
}
