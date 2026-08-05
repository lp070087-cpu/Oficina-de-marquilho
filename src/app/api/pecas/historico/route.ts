import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const pecaId = req.nextUrl.searchParams.get('pecaId');
    if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatorio' }, { status: 400 });

    const [movimentacoes, transferencias, itensOS] = await Promise.all([
      prisma.movimentacaoEstoque.findMany({
        where: { pecaId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.transferenciaEstoque.findMany({
        where: { pecaId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.itemOS.findMany({
        where: { pecaId },
        include: {
          ordemServico: { select: { numero: true, nomeCliente: true, createdAt: true } },
        },
        orderBy: { ordemServico: { createdAt: 'desc' } },
        take: 50,
      }),
    ]);

    // Merge em um só timeline
    const timeline: any[] = [];

    for (const m of movimentacoes) {
      timeline.push({
        tipo: 'MOVIMENTACAO',
        subtipo: m.tipo,
        data: m.createdAt,
        quantidade: m.quantidade,
        origem: m.origem,
        destino: m.destino,
        usuario: m.usuario,
        observacao: m.observacao,
      });
    }

    for (const t of transferencias) {
      timeline.push({
        tipo: 'TRANSFERENCIA',
        data: t.createdAt,
        quantidade: t.quantidade,
        de: t.de,
        para: t.para,
        usuario: t.usuario,
      });
    }

    for (const i of itensOS) {
      timeline.push({
        tipo: 'OS',
        data: i.ordemServico.createdAt,
        osNumero: i.ordemServico.numero,
        cliente: i.ordemServico.nomeCliente,
        quantidade: i.quantidade,
        precoUnitario: Number(i.precoUnitario),
        adaptado: i.adaptado,
      });
    }

    // Ordena por data (mais recente primeiro)
    timeline.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return NextResponse.json(timeline);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
