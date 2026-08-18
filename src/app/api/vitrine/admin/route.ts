import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — dados agregados para o painel admin da vitrine
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  try {
    const [
      totalProdutos, produtosVitrine, produtosDestaque, produtosOferta,
      totalMarcas, totalPromocoes, totalDepoimentos, totalNewsletter,
      orcamentosPendentes, pedidosPendentes, secoes,
    ] = await Promise.all([
      prisma.peca.count({ where: { ativo: true } }),
      // Correção 1: produtos visíveis = regra oficial (ativo && quantidadeLoja>0 && precoVenda>0).
      prisma.peca.count({ where: { ativo: true, quantidadeLoja: { gt: 0 }, precoVenda: { gt: 0 } } }),
      prisma.peca.count({ where: { ativo: true, destaque: true } }),
      prisma.peca.count({ where: { ativo: true, oferta: true } }),
      prisma.marca.count({ where: { ativo: true } }),
      prisma.promocao.count({ where: { ativo: true } }),
      prisma.depoimento.count({ where: { ativo: true } }),
      prisma.newsletter.count(),
      prisma.orcamento.count({ where: { status: 'PENDENTE' } }),
      prisma.pedidoVitrine.count({ where: { status: 'PENDENTE' } }),
      prisma.secaoVitrine.findMany({ orderBy: { ordem: 'asc' } }),
    ]);

    return NextResponse.json({
      totalProdutos, produtosVitrine, produtosDestaque, produtosOferta,
      totalMarcas, totalPromocoes, totalDepoimentos, totalNewsletter,
      orcamentosPendentes, pedidosPendentes, secoes,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
