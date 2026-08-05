import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const categoria = searchParams.get('categoria');
    const marca = searchParams.get('marca');
    const compatibilidade = searchParams.get('compatibilidade');
    const ordem = searchParams.get('ordem') || 'relevancia';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 24;
    const skip = (page - 1) * limit;

    const where: any = { ativo: true, vitrine: true };
    if (q) {
      where.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { codigo: { contains: q, mode: 'insensitive' } },
        { codigoBarras: { contains: q, mode: 'insensitive' } },
        { marca: { contains: q, mode: 'insensitive' } },
        { descricao: { contains: q, mode: 'insensitive' } },
        { descricaoCurta: { contains: q, mode: 'insensitive' } },
        { compatibilidade: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (categoria) where.categoria = { slug: categoria };
    if (marca) where.marca = { equals: marca, mode: 'insensitive' };
    if (compatibilidade) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { compatibilidade: { contains: compatibilidade, mode: 'insensitive' } },
          { nome: { contains: compatibilidade, mode: 'insensitive' } },
        ],
      });
    }

    const orderBy: any = {};
    switch (ordem) {
      case 'menor_preco': orderBy.precoVenda = 'asc'; break;
      case 'maior_preco': orderBy.precoVenda = 'desc'; break;
      case 'mais_recentes': orderBy.createdAt = 'desc'; break;
      case 'maior_desconto': orderBy.precoOferta = { sort: 'desc', nulls: 'last' }; break;
      case 'mais_vendidos': orderBy.destaque = 'desc'; break;
      default: orderBy.destaque = 'desc';
    }

    const [produtos, total, marcasDisponiveis] = await Promise.all([
      prisma.peca.findMany({
        where, orderBy, skip, take: limit,
        include: { categoria: { select: { nome: true, slug: true } } },
      }),
      prisma.peca.count({ where }),
      prisma.peca.findMany({
        where: { ativo: true, vitrine: true, marca: { not: null } },
        select: { marca: true }, distinct: ['marca'],
      }),
    ]);

    // Sugestões (autocomplete) com produtos
    const sugestoes = q && page === 1 ? await prisma.peca.findMany({
      where: { ativo: true, vitrine: true, nome: { contains: q, mode: 'insensitive' } },
      select: { id: true, nome: true, codigo: true, imagemUrl: true, precoVenda: true, marca: true },
      take: 6,
    }) : [];

    // Categorias sugeridas pela busca
    const categoriasSug = q && page === 1 ? await prisma.categoria.findMany({
      where: { ativa: true, nome: { contains: q, mode: 'insensitive' } },
      select: { slug: true, nome: true },
      take: 3,
    }) : [];

    // Marcas sugeridas pela busca
    const marcasSug = q && page === 1 ? await prisma.peca.findMany({
      where: { ativo: true, vitrine: true, marca: { contains: q, mode: 'insensitive' } },
      select: { marca: true }, distinct: ['marca'],
      take: 3,
    }) : [];

    return NextResponse.json({
      produtos,
      total,
      paginas: Math.ceil(total / limit),
      pagina: page,
      marcas: marcasDisponiveis.map(m => m.marca).filter(Boolean),
      sugestoes,
      categoriasSug,
      marcasSug: marcasSug.map(m => ({ nome: m.marca })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
