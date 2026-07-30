import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — recomendações personalizadas para o cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // 1. Marcas favoritas (baseado em compras e visualizações)
    const compras = await prisma.pedidoItem.findMany({
      where: { pedido: { clienteId: session.clienteId, tipo: 'VITRINE' } },
      select: { peca: { select: { marca: true, categoriaId: true } } },
      take: 20,
    });

    const marcas = compras.map(c => c.peca.marca).filter(Boolean) as string[];
    const categoriasIds = compras.map(c => c.peca.categoriaId).filter(Boolean);

    // 2. Favoritos
    const favs = await prisma.favorito.findMany({
      where: { clienteId: session.clienteId },
      select: { peca: { select: { marca: true, categoriaId: true } } },
    });

    favs.forEach(f => {
      if (f.peca.marca) marcas.push(f.peca.marca);
      if (f.peca.categoriaId) categoriasIds.push(f.peca.categoriaId);
    });

    // 3. Histórico de visualização
    const vistos = await prisma.historicoNavegacao.findMany({
      where: { clienteId: session.clienteId },
      select: { peca: { select: { marca: true, categoriaId: true } } },
      take: 20,
    });

    vistos.forEach(v => {
      if (v.peca.marca) marcas.push(v.peca.marca);
      if (v.peca.categoriaId) categoriasIds.push(v.peca.categoriaId);
    });

    // 4. Produtos recomendados por marca mais frequente
    const marcaFreq = marcas.reduce((acc: Record<string, number>, m) => { acc[m] = (acc[m] || 0) + 1; return acc; }, {});
    const marcaTop = Object.entries(marcaFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

    // 5. Categoria mais frequente
    const catFreq = categoriasIds.reduce((acc: Record<string, number>, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {});
    const catTop = Object.entries(catFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Buscar recomendações
    const [porMarca, porCategoria, emAlta] = await Promise.all([
      marcaTop ? prisma.peca.findMany({
        where: { ativo: true, vitrine: true, marca: marcaTop },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 6,
      }) : Promise.resolve([]),
      catTop ? prisma.peca.findMany({
        where: { ativo: true, vitrine: true, categoriaId: catTop },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 6,
      }) : Promise.resolve([]),
      prisma.peca.findMany({
        where: { ativo: true, vitrine: true, oferta: true, precoOferta: { not: null } },
        include: { categoria: { select: { nome: true, slug: true } } },
        take: 4,
      }),
    ]);

    return NextResponse.json({
      porMarca: { marca: marcaTop, produtos: porMarca },
      porCategoria: { categoriaId: catTop, produtos: porCategoria },
      emAlta,
      perfil: { marcaFavorita: marcaTop, categoriasFrequentes: Object.keys(catFreq).slice(0, 3) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
