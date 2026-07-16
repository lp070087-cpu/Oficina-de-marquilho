import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const fornecedores = await prisma.fornecedor.findMany({ orderBy: { nome: 'asc' } });
  return NextResponse.json(fornecedores);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const f = await prisma.fornecedor.create({ data: body });
  return NextResponse.json(f, { status: 201 });
}
