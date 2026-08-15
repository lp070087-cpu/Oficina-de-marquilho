import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/estoque/stats — Contadores reais do estoque (agregados no banco)
// Fonte definitiva para os cards das telas. NÃO usar pecas.length/reduce do listing.
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    const [
      totalProdutos,
      unidadesAgg,
      estoqueBaixo,
      semEstoque,
    ] = await Promise.all([
      prisma.peca.count({ where: { ativo: true } }),
      prisma.peca.aggregate({
        _sum: { quantidade: true, quantidadeLoja: true },
        where: { ativo: true },
      }),
      prisma.peca.count({
        where: { ativo: true, estoqueMinimo: { gt: 0 }, quantidade: { gt: 0, lt: prisma.peca.fields.estoqueMinimo } },
      }),
      prisma.peca.count({ where: { ativo: true, quantidade: { lte: 0 } } }),
    ]);

    const unidadesCentral = Number(unidadesAgg._sum.quantidade) || 0;
    const unidadesLoja = Number(unidadesAgg._sum.quantidadeLoja) || 0;

    return NextResponse.json({
      totalProdutos,
      unidadesCentral,
      unidadesLoja,
      unidadesTotal: unidadesCentral + unidadesLoja,
      estoqueBaixo,
      semEstoque,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
