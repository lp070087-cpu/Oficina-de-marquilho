import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    const loja = req.nextUrl.searchParams.get('loja') === 'true';
    if (!q || q.length < 2) return NextResponse.json({ pecas: [] });

    const termo = q.toLowerCase();

    // Busca em múltiplos campos
    const pecas = await prisma.peca.findMany({
      where: {
        ativo: true,
        ...(loja ? { quantidadeLoja: { gt: 0 } } : {}),
        OR: [
          { nome: { contains: termo, mode: 'insensitive' } },
          { codigo: { contains: termo, mode: 'insensitive' } },
          { codigoBarras: { contains: termo, mode: 'insensitive' } },
          { marca: { contains: termo, mode: 'insensitive' } },
          { compatibilidade: { contains: termo, mode: 'insensitive' } },
          { descricao: { contains: termo, mode: 'insensitive' } },
          { subcategoria: { contains: termo, mode: 'insensitive' } },
          { localizacao: { contains: termo, mode: 'insensitive' } },
          { descricaoCurta: { contains: termo, mode: 'insensitive' } },
        ],
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
