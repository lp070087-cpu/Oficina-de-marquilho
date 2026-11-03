import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { indexar, relevancia, type IndicePeca } from '@/lib/busca-pecas';

// Busca incremental do Atendimento/OS: todo o catálogo ativo é pesquisável, mas só uma
// página de resultados vai ao navegador. Sem termo, os mais vendidos aparecem primeiro.
type Vendas = Map<string, { recente: number; total: number }>;
let cacheVendas: { em: number; dados: Vendas } | null = null;
// Catálogo indexado por poucos segundos: a digitação não repete a consulta a cada tecla.
// Estoque e preço são conferidos de novo no servidor ao salvar o pedido.
const selecao = { id: true, nome: true, codigo: true, marca: true, codigoBarras: true, imagemUrl: true, precoVenda: true, quantidadeLoja: true, subcategoria: true, compatibilidade: true, descricao: true } as const;
type PecaCatalogo = Awaited<ReturnType<typeof carregarCatalogo>>[number];
let cacheCatalogo: { em: number; dados: PecaCatalogo[] } | null = null;
async function carregarCatalogo() {
  const pecas = await prisma.peca.findMany({ where: { ativo: true }, select: selecao });
  return pecas.map(p => ({ ...p, indice: indexar(p) as IndicePeca }));
}
async function catalogo(): Promise<PecaCatalogo[]> {
  if (cacheCatalogo && Date.now() - cacheCatalogo.em < 10_000) return cacheCatalogo.dados;
  const dados = await carregarCatalogo();
  cacheCatalogo = { em: Date.now(), dados };
  return dados;
}

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
    const offset = Math.max(0, Math.min(100000, Number(req.nextUrl.searchParams.get('offset')) || 0));
    const limite = Math.max(1, Math.min(60, Number(req.nextUrl.searchParams.get('limite')) || 36));
    const [pecas, vendas] = await Promise.all([catalogo(), vendasConfirmadas()]);
    const termo = q.trim();
    const ranqueadas = [] as { p: (typeof pecas)[number]; rel: number; recente: number; total: number }[];
    for (const p of pecas) {
      const rel = termo ? relevancia(termo, p.indice) : 0;
      if (termo && rel <= 0) continue;
      const v = vendas.get(p.id);
      ranqueadas.push({ p, rel, recente: v?.recente || 0, total: v?.total || 0 });
    }
    // Relevância da pesquisa primeiro; depois vendidos recentemente, vendidos no histórico,
    // disponíveis na loja e nome. Nenhum produto é escondido por vender pouco.
    ranqueadas.sort((a, b) => b.rel - a.rel || b.recente - a.recente || b.total - a.total
      || Number(b.p.quantidadeLoja > 0) - Number(a.p.quantidadeLoja > 0) || a.p.nome.localeCompare(b.p.nome, 'pt-BR'));
    const itens = ranqueadas.slice(offset, offset + limite).map(({ p, recente, total }) => ({
      id: p.id, nome: p.nome, codigo: p.codigo, marca: p.marca, codigoBarras: p.codigoBarras, imagemUrl: p.imagemUrl,
      precoVenda: p.precoVenda, quantidadeLoja: p.quantidadeLoja, vendidosRecentes: recente, vendidosTotal: total,
    }));
    return NextResponse.json({ itens, total: ranqueadas.length, offset, proximo: offset + itens.length < ranqueadas.length ? offset + itens.length : null });
  } catch (e) {
    console.error('Busca de pecas:', e);
    return NextResponse.json({ error: 'Erro ao pesquisar pecas' }, { status: 500 });
  }
}
