import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VITRINE_VISIBILITY, compararCategoriasVitrine, slugDeNome, normalizarNome } from '@/lib/vitrine-utils';

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

      // AJUSTE 4: SÓ inclui subcategorias que tenham PELO MENOS 1 produto VISÍVEL.
      // Subcategoria sem produto (ou com produto invisível) é escondida dos filtros.
      // `id` é incluído para permitir filtro exato por subcategoria (DONA + catálogo).
      //
      // DUAS FONTES de subcategoria (AJUSTE 1/4):
      //   1. Hierarquia real — `Categoria.parentId` (categoria filha cadastrada no painel);
      //   2. Valor da string `Peca.subcategoria` (ex.: "Capacetes", "Luvas") dos produtos
      //      que apontam DIRETO para esta categoria top-level (como o seed grava acessórios).
      //      Esses são agrupados em chips "Tipo" com slug derivado (prefixo `tipo:`),
      //      para NUNCA colidir com slugs de categorias reais.
      const subsVisiveis: any[] = [];
      for (const s of c.subcategorias) {
        const nSub = await prisma.peca.count({
          where: { ...VITRINE_VISIBILITY, categoriaId: s.id },
        });
        if (nSub > 0) subsVisiveis.push({ id: s.id, nome: s.nome, slug: s.slug, totalProdutos: nSub });
      }

      // Tipos derivados de Peca.subcategoria (visíveis) dentro desta categoria.
      const tipos = await prisma.peca.groupBy({
        by: ['subcategoria'],
        where: {
          ...VITRINE_VISIBILITY,
          subcategoria: { not: null },
          categoriaId: { in: [c.id, ...c.subcategorias.map((s: any) => s.id)] },
        },
        _count: { _all: true },
      });
      for (const t of tipos) {
        const nome = (t.subcategoria || '').trim();
        if (!nome) continue;
        // Evita duplicar quando a subcategoria real tem o MESMO nome do tipo (ex.: nome
        // idêntico) — nesse caso o chip da subcategoria real já cobre.
        if (subsVisiveis.some(s => normalizarNome(s.nome) === normalizarNome(nome))) continue;
        subsVisiveis.push({
          id: `tipo:${slugDeNome(nome)}`,           // id sintético (não é categoria)
          nome,
          slug: `tipo:${slugDeNome(nome)}`,         // slug sintético com prefixo seguro
          totalProdutos: t._count._all,
          tipo: true,                               // flag: é tipo de acessório, não categoria
        });
      }

      // Ordena subcategorias: primeiro as hierárquicas (ordem real), depois os tipos (A-Z).
      subsVisiveis.sort((a: any, b: any) => {
        const ta = a.tipo ? 1 : 0, tb = b.tipo ? 1 : 0;
        if (ta !== tb) return ta - tb;
        return normalizarNome(a.nome).localeCompare(normalizarNome(b.nome), 'pt-BR');
      });

      resultado.push({
        id: c.id,
        nome: c.nome,
        slug: c.slug,
        icone: c.icone || null,
        totalProdutos: count,
        subcategorias: subsVisiveis,
      });
    }

    // Ordenação oficial: CAPACETES → CAPAS → ACESSÓRIOS → demais (alfabético).
    resultado.sort(compararCategoriasVitrine);

    return NextResponse.json(resultado);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
