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
    const cat = req.nextUrl.searchParams.get('categoria') || '';
    const baixo = req.nextUrl.searchParams.get('baixo') === '1';
    const modelo = req.nextUrl.searchParams.get('modelo') || '';
    const todas = req.nextUrl.searchParams.get('todas') === '1';
    const barcode = (req.nextUrl.searchParams.get('barcode') || '').trim();

    const where: any = { ativo: true };
    const andConditions: any[] = [];

    // Busca unificada: Nome, SKU (codigo), Codigo de Barras, Marca, Descricao
    if (q) {
      andConditions.push({
        OR: [
          { nome: { contains: q, mode: 'insensitive' } },
          { codigo: { contains: q, mode: 'insensitive' } },
          { codigoBarras: { contains: q, mode: 'insensitive' } },
          { marca: { contains: q, mode: 'insensitive' } },
          { descricao: { contains: q, mode: 'insensitive' } },
          { subcategoria: { contains: q, mode: 'insensitive' } },
          { compatibilidade: { contains: q, mode: 'insensitive' } },
          { descricaoCurta: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (cat) where.categoriaId = cat;
    if (barcode) where.codigoBarras = barcode;
    if (baixo) {
      const baixas = await prisma.$queryRaw<[{ id: string }]>`SELECT id FROM "Peca" WHERE ativo = true AND "estoqueMinimo" > 0 AND quantidade < "estoqueMinimo"`;
      where.id = { in: baixas.map((b: { id: string }) => b.id) };
    }

    // Filtrar por compatibilidade com modelo de moto
    if (modelo && !todas) {
      andConditions.push({
        OR: [
          { compatibilidade: { contains: modelo, mode: 'insensitive' } },
          { compatibilidade: { contains: 'Universal', mode: 'insensitive' } },
        ],
      });
    }

    // Combina multiplos OR via AND para evitar overwrite
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const pecas = await prisma.peca.findMany({
      where,
      include: { categoria: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
      take: 500,
    });
    return NextResponse.json(pecas);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  if (!body.nome || !body.codigo || !body.categoriaId) {
    return NextResponse.json({ error: 'Nome, código e categoria são obrigatórios' }, { status: 400 });
  }
  const peca = await prisma.peca.create({
    data: {
      nome: body.nome,
      descricao: body.descricao || null,
      codigo: body.codigo,
      precoVenda: body.precoVenda || 0,
      precoCusto: body.precoCusto || 0,
      quantidade: body.quantidade || 0,
      quantidadeLoja: body.quantidadeLoja || 0,
      estoqueMinimo: body.estoqueMinimo || 5,
      subcategoria: body.subcategoria || null,
      marca: body.marca || null,
      compatibilidade: body.compatibilidade || null,
      codigoBarras: body.codigoBarras || null,
      custoMedio: body.custoMedio || 0,
      localizacao: body.localizacao || null,
      categoriaId: body.categoriaId,
    },
    include: { categoria: { select: { nome: true } } },
  });
  return NextResponse.json(peca, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar peça:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
