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
    where: { role: { in: ['MECANICO', 'BALCAO', 'ESTOQUE'] } },
    select: { id: true, name: true, email: true, username: true, role: true, active: true, emAlmoco: true, tipoBalcao: true, mustChangePassword: true, lastLoginAt: true, lockedUntil: true, failedLoginAttempts: true },
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
  if (!body.email) return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 });
  if (!body.password) return NextResponse.json({ error: 'Senha obrigatoria' }, { status: 400 });

  // Check duplicate email
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) return NextResponse.json({ error: 'Este email ja esta cadastrado.' }, { status: 400 });

  const hash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      username: body.username || null,
      password: hash,
      role: body.role || 'BALCAO',
      tipoBalcao: body.tipoBalcao || null,
      createdBy: 'DONO',
    },
    select: { id: true, name: true, email: true, username: true, role: true, active: true, tipoBalcao: true },
  });
  return NextResponse.json(user, { status: 201 });
}
