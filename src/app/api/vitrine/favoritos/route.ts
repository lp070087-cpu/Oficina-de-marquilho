import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';
import { VITRINE_VISIBILITY, publicarPeca } from '@/lib/vitrine-utils';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  const session = await getVitrineSession(authHeader);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const favoritos = await prisma.favorito.findMany({
      where: { clienteId: session.clienteId, peca: { ...VITRINE_VISIBILITY } },
      include: {
        peca: {
          include: { categoria: { select: { nome: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(favoritos.map(f => ({ ...f, peca: publicarPeca(f.peca) })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  const session = await getVitrineSession(authHeader);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
