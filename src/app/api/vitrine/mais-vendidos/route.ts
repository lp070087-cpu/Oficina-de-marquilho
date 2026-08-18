import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VITRINE_VISIBILITY, publicarPeca } from '@/lib/vitrine-utils';

// GET — produtos mais vendidos (por visualização + vendas)
export async function GET() {
  try {
    // Agregar por contagem de visualizações (proxy de popularidade)
    const populares = await prisma.produtoVisualizacao.groupBy({
      by: ['pecaId'],
      _count: { pecaId: true },
      orderBy: { _count: { pecaId: 'desc' } },
      take: 12,
    });

    if (populares.length === 0) {
      // Fallback: produtos em vitrine visíveis
      const fallback = await prisma.peca.findMany({
        where: { ...VITRINE_VISIBILITY },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 12,
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json({ produtos: fallback.map(publicarPeca) });
    }

    const pecaIds = populares.map(p => p.pecaId);
    const produtos = await prisma.peca.findMany({
      where: { id: { in: pecaIds }, ...VITRINE_VISIBILITY },
      include: { categoria: { select: { nome: true, slug: true } } },
    });

    // Ordenar pela mesma ordem do groupBy
    const map = new Map(populares.map(p => [p.pecaId, p._count.pecaId]));
    produtos.sort((a, b) => (map.get(b.id) || 0) - (map.get(a.id) || 0));

    return NextResponse.json({ produtos: produtos.slice(0, 12).map(publicarPeca) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
