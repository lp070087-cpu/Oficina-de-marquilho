import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VITRINE_VISIBILITY, publicarPeca } from '@/lib/vitrine-utils';

// GET — "quem viu este produto também viu" / "quem comprou também comprou"
export async function GET(req: NextRequest) {
  try {
    const pecaId = req.nextUrl.searchParams.get('pecaId');
    if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatório' }, { status: 400 });

    // Encontrar clientes que viram este produto
    const visualizacoes = await prisma.produtoVisualizacao.findMany({
      where: { pecaId },
      select: { sessao: true, clienteId: true },
      distinct: ['sessao'],
      take: 50,
    });

    const sessoes = visualizacoes.filter(v => v.sessao).map(v => v.sessao) as string[];
    const clienteIds = visualizacoes.filter(v => v.clienteId).map(v => v.clienteId) as string[];

    if (sessoes.length === 0 && clienteIds.length === 0) {
      // Fallback: mesma categoria
      const peca = await prisma.peca.findUnique({ where: { id: pecaId }, select: { categoriaId: true } });
      if (!peca) return NextResponse.json({ produtos: [] });
      const relacionados = await prisma.peca.findMany({
        where: { ...VITRINE_VISIBILITY, categoriaId: peca.categoriaId, id: { not: pecaId } },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 8,
      });
      return NextResponse.json({ produtos: relacionados.map(publicarPeca) });
    }

    // Produtos vistos pelas mesmas sessões/clientes
    const outrasVisualizacoes = await prisma.produtoVisualizacao.findMany({
      where: {
        pecaId: { not: pecaId },
        OR: [
          { sessao: { in: sessoes } },
          { clienteId: { in: clienteIds } },
        ],
      },
      select: { pecaId: true },
    });

    const pecaIds = [...new Set(outrasVisualizacoes.map(v => v.pecaId))].slice(0, 8);
    const produtos = await prisma.peca.findMany({
      where: { id: { in: pecaIds }, ...VITRINE_VISIBILITY },
      include: { categoria: { select: { nome: true, slug: true } } },
    });

    return NextResponse.json({ produtos: produtos.map(publicarPeca) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
