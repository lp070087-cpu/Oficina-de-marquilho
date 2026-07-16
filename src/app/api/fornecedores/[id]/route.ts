import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const f = await prisma.fornecedor.update({ where: { id }, data: body });
  return NextResponse.json(f);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  // Soft delete
  await prisma.fornecedor.update({ where: { id }, data: { ativo: false } });
  return NextResponse.json({ ok: true });
}
