import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const pecaId = req.nextUrl.searchParams.get('pecaId');
  if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatorio' }, { status: 400 });
  const comps = await prisma.compatibilidadeVeiculo.findMany({
    where: { pecaId },
    orderBy: [{ marca: 'asc' }, { modelo: 'asc' }, { anoInicial: 'asc' }],
  });
  return NextResponse.json(comps);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  if (!body.pecaId) return NextResponse.json({ error: 'pecaId obrigatorio' }, { status: 400 });

  const comp = await prisma.compatibilidadeVeiculo.create({
    data: {
      pecaId: body.pecaId,
      marca: body.marca || '',
      modelo: body.modelo || '',
      anoInicial: body.anoInicial ? parseInt(body.anoInicial) : null,
      anoFinal: body.anoFinal ? parseInt(body.anoFinal) : null,
      motor: body.motor || null,
      versao: body.versao || null,
      observacao: body.observacao || null,
    },
  });
  return NextResponse.json(comp, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const comp = await prisma.compatibilidadeVeiculo.update({
    where: { id: body.id },
    data: {
      marca: body.marca || '',
      modelo: body.modelo || '',
      anoInicial: body.anoInicial ? parseInt(body.anoInicial) : null,
      anoFinal: body.anoFinal ? parseInt(body.anoFinal) : null,
      motor: body.motor || null,
      versao: body.versao || null,
      observacao: body.observacao || null,
    },
  });
  return NextResponse.json(comp);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
  await prisma.compatibilidadeVeiculo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
