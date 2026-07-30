import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pecaId = searchParams.get('pecaId');
  if (!pecaId) return NextResponse.json({ error: 'pecaId é obrigatório' }, { status: 400 });

  const [avaliacoes, agregado] = await Promise.all([
    prisma.avaliacao.findMany({
      where: { pecaId, aprovada: true },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.avaliacao.aggregate({
      where: { pecaId, aprovada: true },
      _avg: { nota: true },
      _count: { id: true },
    }),
    prisma.avaliacao.groupBy({
      by: ['nota'],
      where: { pecaId, aprovada: true },
      _count: { id: true },
    }),
  ]);

  const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  // groupBy returns the 3rd element
  // Actually groupBy doesn't return from aggregate, let's compute separately
  const distResult = await prisma.avaliacao.groupBy({
    by: ['nota'],
    where: { pecaId, aprovada: true },
    _count: { id: true },
  });
  for (const d of distResult) {
    distribuicao[d.nota] = d._count.id;
  }

  return NextResponse.json({
    avaliacoes,
    media: agregado._avg.nota || 0,
    total: agregado._count.id,
    distribuicao,
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  const session = await getVitrineSession(authHeader);
  if (!session) {
    return NextResponse.json({ error: 'Faça login para avaliar' }, { status: 401 });
  }
  const body = await req.json();
  const { pecaId, nota, titulo, comentario, fotos } = body;
  if (!pecaId || !nota || nota < 1 || nota > 5) {
    return NextResponse.json({ error: 'pecaId e nota (1-5) são obrigatórios' }, { status: 400 });
  }
  try {
    const avaliacao = await prisma.avaliacao.upsert({
      where: { pecaId_clienteId: { pecaId, clienteId: session.clienteId } },
      update: { nota, titulo, comentario, fotos: fotos ? JSON.stringify(fotos) : null },
      create: { pecaId, clienteId: session.clienteId, nota, titulo, comentario, fotos: fotos ? JSON.stringify(fotos) : null, verificada: false },
    });
    return NextResponse.json(avaliacao, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar avaliação' }, { status: 500 });
  }
}
