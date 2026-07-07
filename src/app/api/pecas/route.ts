import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'MECANICO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const q = req.nextUrl.searchParams.get('q') || '';
  const cat = req.nextUrl.searchParams.get('categoria') || '';
  const baixo = req.nextUrl.searchParams.get('baixo') === '1';
  const modelo = req.nextUrl.searchParams.get('modelo') || '';
  const todas = req.nextUrl.searchParams.get('todas') === '1';

  const where: any = { ativo: true };
  if (q) where.nome = { contains: q, mode: 'insensitive' };
  if (cat) where.categoriaId = cat;
  if (baixo) {
    const baixas = await prisma.$queryRaw<[{ id: string }]>`SELECT id FROM "Peca" WHERE ativo = true AND quantidade <= "estoqueMinimo"`;
    where.id = { in: baixas.map((b: { id: string }) => b.id) };
  }

  // Filtrar por compatibilidade com modelo de moto
  if (modelo && !todas) {
    where.OR = [
      { compatibilidade: { contains: modelo, mode: 'insensitive' } },
      { compatibilidade: { contains: 'Universal', mode: 'insensitive' } },
    ];
  }

  const pecas = await prisma.peca.findMany({
    where,
    include: { categoria: { select: { nome: true } } },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json(pecas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const peca = await prisma.peca.create({
    data: {
      nome: body.nome,
      descricao: body.descricao || null,
      codigo: body.codigo,
      precoVenda: body.precoVenda || 0,
      precoCusto: body.precoCusto || 0,
      quantidade: body.quantidade || 0,
      estoqueMinimo: body.estoqueMinimo || 5,
      subcategoria: body.subcategoria || null,
      marca: body.marca || null,
      compatibilidade: body.compatibilidade || null,
      categoriaId: body.categoriaId,
    },
    include: { categoria: { select: { nome: true } } },
  });
  return NextResponse.json(peca, { status: 201 });
}
