import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const pecas = await prisma.peca.findMany({
    where: { ativo: true, vitrine: true },
    include: { categoria: { select: { nome: true, slug: true } } },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json(pecas);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const { pecaId, vitrine, destaque, oferta, precoOferta, descricaoCurta } = body;
  const data: any = {};
  if (typeof vitrine === 'boolean') data.vitrine = vitrine;
  if (typeof destaque === 'boolean') data.destaque = destaque;
  if (typeof oferta === 'boolean') data.oferta = oferta;
  if (precoOferta !== undefined) data.precoOferta = precoOferta;
  if (descricaoCurta !== undefined) data.descricaoCurta = descricaoCurta;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
  }
  await prisma.peca.update({ where: { id: pecaId }, data });
  return NextResponse.json({ ok: true });
}
