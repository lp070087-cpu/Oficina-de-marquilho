import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VITRINE_VISIBILITY, publicarPeca } from '@/lib/vitrine-utils';

export async function GET() {
  try {
    const [destaques, ofertas, lancamentos] = await Promise.all([
      prisma.peca.findMany({
        where: { ...VITRINE_VISIBILITY, destaque: true },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 12,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.peca.findMany({
        where: { ...VITRINE_VISIBILITY, oferta: true, precoOferta: { not: null } },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 12,
        orderBy: { precoOferta: 'asc' },
      }),
      prisma.peca.findMany({
        where: { ...VITRINE_VISIBILITY },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 12,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      destaques: destaques.map(publicarPeca),
      ofertas: ofertas.map(publicarPeca),
      lancamentos: lancamentos.map(publicarPeca),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
