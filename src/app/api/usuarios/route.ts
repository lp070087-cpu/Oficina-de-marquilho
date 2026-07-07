import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    where: { role: { in: ['MECANICO', 'BALCAO'] } },
    select: { id: true, name: true, email: true, role: true, active: true, emAlmoco: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const hash = await bcrypt.hash(body.password || 'marquinho123', 10);
  const user = await prisma.user.create({
    data: { name: body.name, email: body.email, password: hash, role: body.role },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return NextResponse.json(user, { status: 201 });
}
