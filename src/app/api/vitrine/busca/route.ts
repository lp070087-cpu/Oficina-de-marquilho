import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VITRINE_VISIBILITY, CAMPOS_BUSCA_VITRINE, buildBuscaVitrine, publicarPeca } from '@/lib/vitrine-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const categoria = searchParams.get('categoria');
    const marca = searchParams.get('marca');
    const compatibilidade = searchParams.get('compatibilidade');
    const subcategoriaParam = searchParams.get('subcategoria');
    const precoMin = searchParams.get('precoMin');
    const precoMax = searchParams.get('precoMax');
    const promocao = searchParams.get('promocao') === '1' || searchParams.get('promocao') === 'true';
    const ordem = searchParams.get('ordem') || 'relevancia';
    const page = parseInt(searchParams.get('page') || '1');
    // limit opcional (categorias/home podem pedir mais), limitado a 200 para não estourar.
    const limit = Math.min(parseInt(searchParams.get('limit') || '24') || 24, 200);
    const skip = (page - 1) * limit;

    // Regra oficial de visibilidade + busca tokenizada com suporte a CATEGORIA:
    // AND de palavras × OR de campos, case-insensitive. Cada palavra deve casar
    // com nome/codigo/barras/marca/descricao/compatibilidade OU categoria.nome.
    const where: any = { ...VITRINE_VISIBILITY };
    if (q) {
      where.AND = buildBuscaVitrine(q);
    }
    // EXPANSÃO DE SUBCATEGORIAS (AJUSTE 2/3): quando `categoria` é uma categoria top-level,
    // inclui também as subcategorias filhas — produtos que apontam para a categoria folha
    // aparecem ao navegar a categoria pai. Se for uma subcategoria (folha), o filtro é exato.
    if (categoria) {
      const catSel = await prisma.categoria.findUnique({
        where: { slug: categoria },
        select: { id: true, subcategorias: { select: { id: true } } },
      });
      if (catSel && catSel.subcategorias.length > 0) {
        where.categoria = { id: { in: [catSel.id, ...catSel.subcategorias.map((s: any) => s.id)] } };
      } else {
        where.categoria = { slug: categoria };
      }
    }
    // Filtro de SUBCATEGORIA (AJUSTE 1/4). Duas fontes:
    //   - slug com prefixo `tipo:` → valor da string Peca.subcategoria (ex.: "Capacetes");
    //   - slug normal → subcategoria real (categoria folha) → filtro por categoriaId exato.
    if (subcategoriaParam) {
      if (subcategoriaParam.startsWith('tipo:')) {
        const nome = decodeURIComponent(subcategoriaParam.replace(/^tipo:/, ''));
        where.subcategoria = { equals: nome, mode: 'insensitive' };
      } else {
        const subCat = await prisma.categoria.findUnique({
          where: { slug: subcategoriaParam },
          select: { id: true },
        });
        if (subCat) where.categoria = { id: subCat.id };
      }
    }
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

    // Filtro de PREÇO PÚBLICO (mesma regra do precoPublico: precoVitrine > precoOferta > precoVenda).
    // Expresso no banco como OR de 3 cenários para respeitar a precedência do preço efetivo.
    const min = precoMin ? Number(precoMin) : NaN;
    const max = precoMax ? Number(precoMax) : NaN;
    const gte = Number.isFinite(min) && min > 0 ? min : undefined;
    const lte = Number.isFinite(max) && max > 0 ? max : undefined;
    if (gte !== undefined || lte !== undefined) {
      const faixa: any = {};
      if (gte !== undefined) faixa.gte = gte;
      if (lte !== undefined) faixa.lte = lte;
      // precoVitrine é a fonte que prevalece quando definido (>0)
      const cenarioOverride = { precoVitrine: { gt: 0, ...faixa } };
      // Sem override: usa precoOferta (quando é o preço efetivo: precisa ser >0 E menor que precoVenda)
      const cenarioOferta = {
        precoVitrine: null,
        oferta: true,
        precoOferta: { gt: 0, lt: prisma.peca.fields.precoVenda, ...faixa },
      };
      // Sem override e sem oferta válida: usa precoVenda
      const cenarioVenda = {
        precoVitrine: null,
        OR: [
          { oferta: false },
          { precoOferta: null },
          { precoOferta: { lte: 0 } },
          { precoOferta: { gte: prisma.peca.fields.precoVenda } }, // oferta não é menor → precoVenda
        ],
        precoVenda: { gt: 0, ...faixa },
      };
      where.AND = where.AND || [];
      where.AND.push({ OR: [cenarioOverride, cenarioOferta, cenarioVenda] });
    }

    // Filtro PROMOÇÃO: só produtos com preço público MENOR que o preço de venda.
    // (override precoVitrine menor que precoVenda OU oferta válida)
    if (promocao) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { precoVitrine: { gt: 0, lt: prisma.peca.fields.precoVenda } },
          {
            precoVitrine: null,
            oferta: true,
            precoOferta: { gt: 0, lt: prisma.peca.fields.precoVenda },
          },
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
        where: { ...VITRINE_VISIBILITY, marca: { not: null } },
        select: { marca: true }, distinct: ['marca'],
      }),
    ]);

    // Sugestões (autocomplete) com produtos — inclui precoVitrine/precoOferta para o preço público
    // (item 6: precoPublico = precoVitrine > precoOferta > precoVenda).
    const sugestoes = q && page === 1 ? await prisma.peca.findMany({
      where: { ...VITRINE_VISIBILITY, nome: { contains: q, mode: 'insensitive' } },
      select: { id: true, nome: true, codigo: true, imagemUrl: true, precoVenda: true, precoOferta: true, precoVitrine: true, oferta: true, marca: true },
      take: 6,
    }) : [];

    // Categorias sugeridas pela busca
    const categoriasSug = q && page === 1 ? await prisma.categoria.findMany({
      where: { ativa: true, nome: { contains: q, mode: 'insensitive' } },
      select: { slug: true, nome: true },
      take: 3,
    }) : [];

    // Marcas sugeridas pela busca (derivadas de Peca.marca dos produtos visíveis)
    const marcasSug = q && page === 1 ? await prisma.peca.findMany({
      where: { ...VITRINE_VISIBILITY, marca: { contains: q, mode: 'insensitive' } },
      select: { marca: true }, distinct: ['marca'],
      take: 3,
    }) : [];

    return NextResponse.json({
      produtos: produtos.map(publicarPeca),
      total,
      paginas: Math.ceil(total / limit),
      pagina: page,
      marcas: marcasDisponiveis.map(m => m.marca).filter(Boolean),
      sugestoes: sugestoes.map(publicarPeca),
      categoriasSug,
      marcasSug: marcasSug.map(m => ({ nome: m.marca })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
