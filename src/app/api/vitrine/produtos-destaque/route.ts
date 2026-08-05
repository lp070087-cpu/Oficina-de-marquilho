import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [destaques, ofertas, lancamentos] = await Promise.all([
      prisma.peca.findMany({
        where: { ativo: true, vitrine: true, destaque: true },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 12,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.peca.findMany({
        where: { ativo: true, vitrine: true, oferta: true, precoOferta: { not: null } },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 12,
        orderBy: { precoOferta: 'asc' },
      }),
      prisma.peca.findMany({
        where: { ativo: true, vitrine: true },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 12,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ destaques, ofertas, lancamentos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
