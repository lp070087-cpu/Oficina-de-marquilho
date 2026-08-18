import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { buildBuscaPorPalavras } from '@/lib/peca-utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    const loja = req.nextUrl.searchParams.get('loja') === 'true';
    if (!q || q.length < 2) return NextResponse.json({ pecas: [] });

    const palavras = buildBuscaPorPalavras(q, ['nome', 'codigo', 'codigoBarras', 'marca', 'compatibilidade', 'descricao', 'subcategoria', 'localizacao', 'descricaoCurta']);

    // Busca em múltiplos campos (tokenizada: TODAS as palavras em qualquer campo)
    const pecas = await prisma.peca.findMany({
      where: {
        ativo: true,
        ...(loja ? { quantidadeLoja: { gt: 0 } } : {}),
        AND: palavras,
      },
      include: {
        categoria: { select: { nome: true, id: true, slug: true } },
      },
      orderBy: [
        { quantidade: 'asc' }, // prioriza estoque baixo
        { nome: 'asc' },
      ],
      take: 50,
    });

    return NextResponse.json({ pecas });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
