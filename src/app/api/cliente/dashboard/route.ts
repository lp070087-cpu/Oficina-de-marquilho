import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — resumo do dashboard do cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const [totalPedidos, pedidosEmAndamento, totalFavoritos, totalGarantiasAtivas, notificacoesNaoLidas, ultimosPedidos, cuponsDisponiveis] =
    await Promise.all([
      prisma.pedido.count({ where: { clienteId: session.clienteId, tipo: 'VITRINE' } }),
      prisma.pedido.count({ where: { clienteId: session.clienteId, tipo: 'VITRINE', status: { in: ['PEDIDO_RECEBIDO', 'EM_SEPARACAO', 'PRONTO_PARA_RETIRADA'] } } }),
      prisma.favorito.count({ where: { clienteId: session.clienteId } }),
      prisma.garantiaCliente.count({ where: { clienteId: session.clienteId, status: 'ATIVA' } }),
      prisma.notificacaoCliente.count({ where: { clienteId: session.clienteId, lida: false } }),
      prisma.pedido.findMany({
        where: { clienteId: session.clienteId, tipo: 'VITRINE' },
        include: { itens: { include: { peca: { select: { nome: true, imagemUrl: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.cupom.count({ where: { ativo: true, dataInicio: { lte: new Date() }, dataFim: { gte: new Date() } } }),
    ]);

  return NextResponse.json({
    totalPedidos,
    pedidosEmAndamento,
    totalFavoritos,
    totalGarantiasAtivas,
    notificacoesNaoLidas,
    cuponsDisponiveis,
    ultimosPedidos,
  });
}
