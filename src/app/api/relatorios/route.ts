import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const inicio = req.nextUrl.searchParams.get('inicio') || new Date(0).toISOString();
  const fim = req.nextUrl.searchParams.get('fim') || new Date().toISOString();

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
}
