import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

  const body = await req.json();
  const data: any = {};

  if (typeof body.active === 'boolean') data.active = body.active;
  else if (Object.keys(body).length === 1 && body.name === undefined && body.password === undefined) {
    // compatibilidade: requisição antiga só com toggle
    data.active = !user.active;
  }

  if (body.name) data.name = body.name;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id }, data, select: { id:true, name:true, email:true, active:true } });
  return NextResponse.json(updated);
}
