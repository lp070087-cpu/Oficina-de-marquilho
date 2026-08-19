import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VITRINE_VISIBILITY, compararCategoriasVitrine } from '@/lib/vitrine-utils';

/**
 * GET — categorias da Vitrine PÚBLICA (menu + grid de categorias).
 *
 * DIFERENÇA de /api/categorias (usado pelo admin): esta rota filtra APENAS categorias
 * VÁLIDAS para a Vitrine e só expõe campos públicos. Uma categoria aparece NO MENU
 * somente se tiver PELO MENOS 1 produto visível (regra oficial: ativo && quantidadeLoja>0
 * && precoVenda>0). Isso elimina as 3 causas das categorias sumirem:
 *   1. acoplamento ao `take: 200` de /api/vitrine;
 *   2. categorias com produtos só no estoque central (quantidadeLoja=0);
 *   3. menus hardcoded (aqui o menu é 100% derivado dos dados).
 *
 * Ordenação: CAPACETES → CAPAS → ACESSÓRIOS primeiro (item 2), depois alfabético.
 * Normalização de nome SÓ para ordenação — dados reais (nome/slug) intactos.
 */
export async function GET() {
  try {
    const cats = await prisma.categoria.findMany({
      where: { parentId: null, ativa: true, mostrarNaVitrine: true },
      include: {
        _count: { select: { pecas: true } },
        subcategorias: {
          where: { ativa: true, mostrarNaVitrine: true },
          select: { id: true, nome: true, slug: true },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: { ordem: 'asc' },
    });

    // Para cada categoria top-level, conta quantos produtos VISÍVEIS ela tem.
    // (Produtos da subcategoria são contados via categoriaId da peça — peças sempre
    //  apontam para a categoria folha; somamos também as subcategorias.)
    const resultado = [];
    for (const c of cats) {
      const idsSubs = [c.id, ...c.subcategorias.map((s: any) => s.id)];
      const count = await prisma.peca.count({
        where: { ...VITRINE_VISIBILITY, categoriaId: { in: idsSubs } },
      });
      if (count === 0) continue;
      resultado.push({
        id: c.id,
        nome: c.nome,
        slug: c.slug,
        icone: c.icone || null,
        totalProdutos: count,
        subcategorias: c.subcategorias.map((s: any) => ({ nome: s.nome, slug: s.slug })),
      });
    }

    // Ordenação oficial: CAPACETES → CAPAS → ACESSÓRIOS → demais (alfabético).
    resultado.sort(compararCategoriasVitrine);

    return NextResponse.json(resultado);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
