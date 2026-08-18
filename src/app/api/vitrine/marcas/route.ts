import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { VITRINE_VISIBILITY, slugDeNome } from '@/lib/vitrine-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const destaque = searchParams.get('destaque');

    // Contagem de produtos por marca SOMENTE entre os produtos visíveis na Vitrine
    // (ativo && vitrine && quantidadeLoja > 0 && precoVenda > 0).
    const pecasPorMarca = await prisma.peca.groupBy({
      by: ['marca'],
      where: { ...VITRINE_VISIBILITY, marca: { not: null } },
      _count: { id: true },
    });
    const contagemMap = new Map(pecasPorMarca.map(p => [p.marca!, p._count.id]));

    // Marcas registradas na tabela Marca (admin Premium), se existirem.
    const whereMarca: any = {};
    if (destaque === 'true') whereMarca.destaque = true;
    const marcasTabela = await prisma.marca.findMany({
      where: whereMarca,
      orderBy: { ordem: 'asc' },
    });

    // Monta a lista final de marcas da Vitrine:
    // 1º) marcas com registro próprio (Marca) que tenham produtos visíveis;
    // 2º) marcas derivadas de Peca.marca (valores reais) sem registro na tabela.
    const comRegistro = marcasTabela
      .filter(m => (contagemMap.get(m.nome) || 0) > 0)
      .map(m => ({
        nome: m.nome,
        slug: m.slug || slugDeNome(m.nome),
        logoUrl: m.logoUrl,
        descricao: m.descricao,
        site: m.site,
        destaque: m.destaque,
        ordem: m.ordem,
        quantidadeProdutos: contagemMap.get(m.nome) || 0,
      }));

    const nomesRegistrados = new Set(comRegistro.map(m => m.nome.toLowerCase()));
    const derivadas = [...contagemMap.entries()]
      .filter(([nome]) => nome && !nomesRegistrados.has(nome.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .map(([nome, quantidade]) => ({
        nome,
        slug: slugDeNome(nome),
        logoUrl: null,
        descricao: null,
        site: null,
        destaque: false,
        ordem: 999,
        quantidadeProdutos: quantidade,
      }));

    return NextResponse.json([...comRegistro, ...derivadas]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const slug = body.slug || body.nome.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');
    const marca = await prisma.marca.create({
      data: { nome: body.nome, slug, logoUrl: body.logoUrl, descricao: body.descricao, site: body.site, destaque: body.destaque || false, ordem: body.ordem || 0 },
    });
    return NextResponse.json(marca, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
