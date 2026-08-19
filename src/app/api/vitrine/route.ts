import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { VITRINE_VISIBILITY, publicarPeca } from '@/lib/vitrine-utils';

export async function GET() {
  try {
    const pecas = await prisma.peca.findMany({
      where: { ...VITRINE_VISIBILITY },
      include: { categoria: { select: { nome: true, slug: true } } },
      orderBy: { nome: 'asc' },
      take: 200,
    });
    return NextResponse.json(pecas.map(publicarPeca));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { pecaId, vitrine, destaque, oferta, precoOferta, descricaoCurta, precoVitrine } = body;
    if (!pecaId) return NextResponse.json({ error: 'pecaId é obrigatório' }, { status: 400 });
    const data: any = {};
    if (typeof vitrine === 'boolean') data.vitrine = vitrine;
    if (typeof destaque === 'boolean') data.destaque = destaque;
    if (typeof oferta === 'boolean') data.oferta = oferta;
    if (precoOferta !== undefined) data.precoOferta = precoOferta;
    if (descricaoCurta !== undefined) data.descricaoCurta = descricaoCurta;
    // PREÇO EXCLUSIVO DA VITRINE (item 6): aceita um número (override) ou null (volta a usar
    // o preço do estoque). SÓ a DONA pode gravar (sessão validada acima). NUNCA altera
    // precoVenda/precoOferta → PDV/OS/Caixa/Notas intactos.
    if (precoVitrine !== undefined) {
      if (precoVitrine === null || precoVitrine === '') {
        data.precoVitrine = null;
      } else {
        const n = Number(String(precoVitrine).replace(',', '.'));
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json({ error: 'Preço da vitrine inválido' }, { status: 400 });
        }
        data.precoVitrine = n;
      }
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }
    await prisma.peca.update({ where: { id: pecaId }, data });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
