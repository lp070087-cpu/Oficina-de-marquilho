import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const inicio = req.nextUrl.searchParams.get('inicio') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fim = req.nextUrl.searchParams.get('fim') || new Date().toISOString();

  // Valida range máximo de 365 dias para evitar queries pesadas
  const dias = (new Date(fim).getTime() - new Date(inicio).getTime()) / (1000 * 60 * 60 * 24);
  if (dias > 365) {
    return NextResponse.json({ error: 'Intervalo máximo permitido é de 365 dias' }, { status: 400 });
  }

  try {
    const ordens = await prisma.ordemServico.findMany({
      where: {
        createdAt: { gte: new Date(inicio), lte: new Date(fim) },
        status: { not: 'CANCELADA' },
      },
      include: {
        itens: { include: { peca: true } },
        balcao: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const saidas: any[] = [];
    for (const os of ordens) {
      for (const item of os.itens) {
        saidas.push({
          peca: item.peca.nome,
          codigo: item.peca.codigo,
          quantidade: item.quantidade,
          preco: Number(item.precoUnitario),
          os: os.numero,
          cliente: os.nomeCliente,
          data: os.createdAt.toISOString(),
          balcao: os.balcao?.name || '-',
        });
      }
    }

    const totalPecas = saidas.reduce((s, i) => s + i.quantidade, 0);
    const valorTotal = saidas.reduce((s, i) => s + i.preco * i.quantidade, 0);

    return NextResponse.json({ saidas, totalPecas, valorTotal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
