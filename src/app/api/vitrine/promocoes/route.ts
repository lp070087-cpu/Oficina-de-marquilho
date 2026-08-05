import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const agora = new Date();
    const promocoes = await prisma.promocao.findMany({
      where: { ativo: true, dataInicio: { lte: agora }, dataFim: { gte: agora } },
      include: { produtos: { include: { peca: { include: { categoria: { select: { nome: true, slug: true } } } } } } },
      orderBy: { dataFim: 'asc' },
      take: 20,
    });
    return NextResponse.json(promocoes);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { titulo, subtitulo, percentual, dataInicio, dataFim, tipo, categoriaId, destaque, pecaIds } = body;
    const promocao = await prisma.promocao.create({
      data: {
        titulo, subtitulo, percentual: percentual || null,
        dataInicio: new Date(dataInicio), dataFim: new Date(dataFim),
        tipo: tipo || 'GERAL', categoriaId: categoriaId || null, destaque: destaque || false,
        produtos: pecaIds?.length ? {
          create: pecaIds.map((pecaId: string) => ({ pecaId })),
        } : undefined,
      },
      include: { produtos: true },
    });
    return NextResponse.json(promocao, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
