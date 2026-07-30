import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — listar cupons do cliente
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const tipo = req.nextUrl.searchParams.get('tipo'); // disponiveis, utilizados, expirados
    const agora = new Date();

    let cupons: any[] = [];

    if (tipo === 'utilizados') {
      // Cupons usados em pedidos do cliente
      const pedidos = await prisma.pedido.findMany({
        where: { clienteId: session.clienteId, tipo: 'VITRINE' },
        select: { observacoes: true, numero: true, createdAt: true },
      });
      cupons = pedidos.filter(p => p.observacoes?.includes('CUPOM')).map(p => ({
        id: p.numero,
        codigo: p.observacoes?.match(/CUPOM:(\w+)/)?.[1] || '—',
        pedido: p.numero,
        usadoEm: p.createdAt,
        status: 'USADO',
      }));
    } else if (tipo === 'expirados') {
      cupons = await prisma.cupom.findMany({
        where: { dataFim: { lt: agora } },
        orderBy: { dataFim: 'desc' },
        take: 10,
      });
      cupons = cupons.map(c => ({ ...c, status: 'EXPIRADO' }));
    } else {
      // Disponíveis
      cupons = await prisma.cupom.findMany({
        where: { ativo: true, dataInicio: { lte: agora }, dataFim: { gte: agora } },
        orderBy: { dataFim: 'asc' },
      });
      cupons = cupons.map(c => ({ ...c, status: 'DISPONIVEL' }));
    }

    return NextResponse.json(cupons);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
