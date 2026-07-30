import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const cats = await prisma.categoria.findMany({
    where: { parentId: null },
    include: {
      _count: { select: { pecas: true } },
      subcategorias: {
        include: {
          _count: { select: { pecas: true } },
          pecas: { select: { quantidade: true, custoMedio: true, precoVenda: true, quantidadeLoja: true } },
        },
        orderBy: { ordem: 'asc' },
      },
      pecas: { select: { quantidade: true, custoMedio: true, precoVenda: true, quantidadeLoja: true } },
    },
    orderBy: { ordem: 'asc' },
    take: 200,
  });

  // Adicionar agregacao de estoque
  const enriched = cats.map((c) => {
    const qtdEstoque = c.pecas.reduce((sum, p) => sum + p.quantidade + p.quantidadeLoja, 0);
    const valorEstoque = c.pecas.reduce((sum, p) => sum + Number(p.custoMedio) * (p.quantidade + p.quantidadeLoja), 0);
    const subQtdEstoque = c.subcategorias.reduce((sum, s) => sum + s.pecas.reduce((ss, p) => ss + p.quantidade + p.quantidadeLoja, 0), 0);
    const subValorEstoque = c.subcategorias.reduce((sum, s) => sum + s.pecas.reduce((ss, p) => ss + Number(p.custoMedio) * (p.quantidade + p.quantidadeLoja), 0), 0);

    const totalPecas = c._count.pecas + c.subcategorias.reduce((sum, s) => sum + s._count.pecas, 0);
    const totalEstoque = qtdEstoque + subQtdEstoque;
    const totalValorEstoque = valorEstoque + subValorEstoque;

    // Remove pecas array da resposta (dados brutos desnecessarios no front)
    const { pecas: _, subcategorias: rawSubs, ...rest } = c;
    const cleanSubs = rawSubs.map((s) => {
      const { pecas: __, ...sRest } = s;
      return sRest;
    });

    return {
      ...rest,
      subcategorias: cleanSubs,
      _estoque: { totalPecas, totalEstoque, totalValorEstoque },
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'DONO') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const body = await req.json();
    if (!body.nome) {
      return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 });
    }

    // Validar: so permite 1 nivel de subcategoria (parent so pode ser top-level)
    if (body.parentId) {
      const parent = await prisma.categoria.findUnique({ where: { id: body.parentId } });
      if (!parent) {
        return NextResponse.json({ error: 'Categoria pai nao encontrada' }, { status: 400 });
      }
      if (parent.parentId) {
        return NextResponse.json({ error: 'Nao e permitido criar subcategoria de subcategoria. Apenas 1 nivel.' }, { status: 400 });
      }
    }

    // Slug sempre gerado automaticamente, nunca editavel
    const slug = body.nome.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');
    const cat = await prisma.categoria.create({
      data: {
        nome: body.nome,
        slug,
        descricao: body.descricao || null,
        descricaoIa: body.descricaoIa || null,
        icone: body.icone || null,
        ordem: body.ordem ?? 0,
        ativa: body.ativa !== undefined ? body.ativa : true,
        mostrarNaVitrine: body.mostrarNaVitrine !== undefined ? body.mostrarNaVitrine : true,
        permiteCadastro: body.permiteCadastro !== undefined ? body.permiteCadastro : true,
        parentId: body.parentId || null,
      },
      include: {
        _count: { select: { pecas: true } },
        subcategorias: { orderBy: { ordem: 'asc' } },
      },
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ja existe uma categoria com este nome' }, { status: 409 });
    }
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
