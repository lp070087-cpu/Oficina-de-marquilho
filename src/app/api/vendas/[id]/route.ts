import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// C7 — Valores de status permitidos para Venda
const STATUS_VENDA_VALIDOS = ['PAGA', 'CANCELADA'];

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
    console.error('Erro ao buscar venda:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
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

    // C7 — Validar status contra valores permitidos
    if (body.status && !STATUS_VENDA_VALIDOS.includes(body.status)) {
      return NextResponse.json({ error: `Status invalido. Valores permitidos: ${STATUS_VENDA_VALIDOS.join(', ')}` }, { status: 400 });
    }

    const venda = await prisma.venda.update({
      where: { id },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json(venda);
  } catch (e: any) {
    console.error('Erro ao atualizar venda:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
