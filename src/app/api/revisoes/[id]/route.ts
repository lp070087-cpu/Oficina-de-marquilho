import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT - Somente DONO
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    const existing = await prisma.revisao.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Revisão não encontrada' }, { status: 404 });
    const revisao = await prisma.revisao.update({
      where: { id },
      data: {
        nome: body.nome,
        valor: body.valor,
        ativa: body.ativa,
        ordem: body.ordem,
      },
    });
    return NextResponse.json(revisao);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE - Somente DONO
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.revisao.update({ where: { id }, data: { ativa: false } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
