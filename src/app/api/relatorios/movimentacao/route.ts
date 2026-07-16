import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const { pecaId, tipo, quantidade, valorUnitario, fornecedor, observacao } = body;
  if (!pecaId || !tipo || !quantidade) {
    return NextResponse.json({ error: 'pecaId, tipo e quantidade obrigatorios' }, { status: 400 });
  }
  const mov = await prisma.movimentacaoEstoque.create({
    data: {
      pecaId,
      tipo,
      quantidade,
      origem: body.origem || null,
      destino: body.destino || null,
      usuario: session.name,
      observacao: [
        fornecedor ? `Fornecedor: ${fornecedor}` : '',
        observacao || '',
        `Valor unit: ${valorUnitario || 0}`,
      ].filter(Boolean).join(' | ') || null,
    },
  });
  return NextResponse.json(mov, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const pecaId = req.nextUrl.searchParams.get('pecaId') || '';
  const tipo = req.nextUrl.searchParams.get('tipo') || '';
  const where: any = {};
  if (pecaId) where.pecaId = pecaId;
  if (tipo) where.tipo = tipo;
  const movs = await prisma.movimentacaoEstoque.findMany({
    where,
    include: { peca: { select: { nome: true, codigo: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json(movs);
}
