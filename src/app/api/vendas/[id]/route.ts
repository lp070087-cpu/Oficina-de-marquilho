import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        itens: { include: { peca: { select: { nome: true, codigo: true, codigoBarras: true, imagemUrl: true, marca: true } } } },
        pagamentos: true,
      },
    });

    if (!venda) return NextResponse.json({ error: 'Venda nao encontrada' }, { status: 404 });
    return NextResponse.json(venda);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const body = await req.json();
    const venda = await prisma.venda.update({
      where: { id },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json(venda);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
