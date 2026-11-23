import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { indexar, relevancia } from '@/lib/busca-pecas';

export const dynamic = 'force-dynamic';

// Busca incremental do Atendimento/OS: todo o catálogo ativo é pesquisável, mas só uma
// página de resultados vai ao navegador. Sem termo, os mais vendidos aparecem primeiro.
type Vendas = Map<string, { recente: number; total: number }>;
let cacheVendas: { em: number; dados: Vendas } | null = null;
// O saldo vem do cadastro de peças em cada consulta. Só a estatística de vendas é cacheada.
const selecao = { id: true, nome: true, codigo: true, marca: true, codigoBarras: true, imagemUrl: true, precoVenda: true, quantidade: true, quantidadeLoja: true, categoriaId: true, subcategoria: true, compatibilidade: true, descricao: true, descricaoCurta: true, localizacao: true } as const;

async function vendasConfirmadas(): Promise<Vendas> {
  if (cacheVendas && Date.now() - cacheVendas.em < 60_000) return cacheVendas.dados;
  // Somente vendas pagas de pedidos pagos (cancelados e pendentes não contam).
  const linhas = await prisma.$queryRaw<{ pecaId: string; total: bigint; recente: bigint }[]>`
    SELECT vi."pecaId", SUM(vi.quantidade)::bigint AS total,
           SUM(CASE WHEN v."createdAt" >= now() - interval '30 days' THEN vi.quantidade ELSE 0 END)::bigint AS recente
    FROM "VendaItem" vi
    JOIN "Venda" v ON v.id = vi."vendaId"
    JOIN "Pedido" p ON p.id = v."pedidoId"
    WHERE v.status = 'PAGA' AND p.status = 'PAGO'
    GROUP BY vi."pecaId"`;
  const dados: Vendas = new Map(linhas.map(l => [l.pecaId, { recente: Number(l.recente), total: Number(l.total) }]));
  cacheVendas = { em: Date.now(), dados };
  return dados;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    const q = (req.nextUrl.searchParams.get('q') || '').slice(0, 100);
    const inicio = Number(req.nextUrl.searchParams.get('offset'));
    const offset = Number.isSafeInteger(inicio) && inicio > 0 ? inicio : 0;
    const categoria = (req.nextUrl.searchParams.get('categoria') || '').slice(0, 60);
    const limite = Math.max(1, Math.min(60, Math.trunc(Number(req.nextUrl.searchParams.get('limite'))) || 36));
    const [pecas, vendas, categorias] = await Promise.all([
      prisma.peca.findMany({ where: { ativo: true }, select: selecao }),
      vendasConfirmadas(),
      prisma.categoria.findMany({ select: { id: true, nome: true, parentId: true } }),
    ]);
    const cats = new Map(categorias.map(c => [c.id, c]));
    const termo = q.trim();
    const porCategoria = new Map<string, number>();
    const ranqueadas = [] as { p: (typeof pecas)[number]; rel: number; recente: number; total: number }[];
    let totalGeral = 0;
    for (const p of pecas) {
      const rel = termo ? relevancia(termo, indexar(p)) : 0;
      if (termo && rel <= 0) continue;
      totalGeral++;
      const pai = cats.get(p.categoriaId)?.parentId;
      porCategoria.set(p.categoriaId, (porCategoria.get(p.categoriaId) || 0) + 1);
      if (pai) porCategoria.set(pai, (porCategoria.get(pai) || 0) + 1);
      if (categoria && p.categoriaId !== categoria && pai !== categoria) continue;
      const v = vendas.get(p.id);
      ranqueadas.push({ p, rel, recente: v?.recente || 0, total: v?.total || 0 });
    }
    // O saldo não muda a posição entre páginas. Nome e código desempatam vendas iguais.
    ranqueadas.sort((a, b) => b.rel - a.rel || b.recente - a.recente || b.total - a.total
      || a.p.nome.localeCompare(b.p.nome, 'pt-BR') || a.p.codigo.localeCompare(b.p.codigo, 'pt-BR') || a.p.id.localeCompare(b.p.id));
    const itens = ranqueadas.slice(offset, offset + limite).map(({ p, recente, total }) => ({
      id: p.id, nome: p.nome, codigo: p.codigo, marca: p.marca, codigoBarras: p.codigoBarras, imagemUrl: p.imagemUrl,
      precoVenda: p.precoVenda, quantidade: p.quantidade, quantidadeLoja: p.quantidadeLoja, vendidosRecentes: recente, vendidosTotal: total,
    }));
    const listaCategorias = [...porCategoria].filter(([id]) => cats.has(id))
      .map(([id, total]) => ({ id, nome: cats.get(id)!.nome, total }))
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'));
    return NextResponse.json({ itens, categorias: listaCategorias, totalGeral, total: ranqueadas.length, offset, proximo: offset + itens.length < ranqueadas.length ? offset + itens.length : null }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    console.error('Busca de pecas:', e);
    return NextResponse.json({ error: 'Erro ao pesquisar pecas' }, { status: 500 });
  }
}
