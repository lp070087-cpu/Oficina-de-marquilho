import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — listar favoritos do cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const favoritos = await prisma.favorito.findMany({
    where: { clienteId: session.clienteId },
    include: {
      peca: {
        select: {
          id: true, nome: true, codigo: true, imagemUrl: true, precoVenda: true,
          precoOferta: true, marca: true, quantidade: true, quantidadeLoja: true,
          categoria: { select: { nome: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(favoritos);
}

// POST — adicionar favorito
export async function POST(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { pecaId } = await req.json();
  if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatório' }, { status: 400 });

  try {
    const fav = await prisma.favorito.create({
      data: { clienteId: session.clienteId, pecaId },
    });
    return NextResponse.json(fav, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Produto já está nos favoritos.' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remover favorito (?pecaId=...)
export async function DELETE(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const pecaId = req.nextUrl.searchParams.get('pecaId');
  if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatório' }, { status: 400 });

  await prisma.favorito.deleteMany({ where: { clienteId: session.clienteId, pecaId } });
  return NextResponse.json({ ok: true });
}
