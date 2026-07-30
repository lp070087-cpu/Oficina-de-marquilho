import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destaque = searchParams.get('destaque');
  const where: any = { ativo: true };
  if (destaque === 'true') where.destaque = true;
  const marcas = await prisma.marca.findMany({
    where,
    orderBy: { ordem: 'asc' },
  });

  // Buscar contagem de produtos por marca
  const pecasPorMarca = await prisma.peca.groupBy({
    by: ['marca'],
    where: { ativo: true, vitrine: true, marca: { not: null } },
    _count: { id: true },
  });
  const contagemMap = new Map(pecasPorMarca.map(p => [p.marca!, p._count.id]));

  const result = marcas.map(m => ({
    ...m,
    quantidadeProdutos: contagemMap.get(m.nome) || 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const slug = body.slug || body.nome.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const marca = await prisma.marca.create({
    data: { nome: body.nome, slug, logoUrl: body.logoUrl, descricao: body.descricao, site: body.site, destaque: body.destaque || false, ordem: body.ordem || 0 },
  });
  return NextResponse.json(marca, { status: 201 });
}
