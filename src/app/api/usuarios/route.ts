import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['MECANICO', 'BALCAO', 'ESTOQUE'] } },
      select: { id: true, name: true, email: true, username: true, role: true, active: true, emAlmoco: true, tipoBalcao: true, mustChangePassword: true, lastLoginAt: true, lockedUntil: true, failedLoginAttempts: true, cargo: true, telefone: true, observacoes: true },
      take: 200, orderBy: { name: 'asc' },
    });
    return NextResponse.json(users);
  } catch (e: any) {
    console.error('Erro ao listar usuarios:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 });
    if (!body.email) return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 });
    if (!body.password) return NextResponse.json({ error: 'Senha obrigatoria' }, { status: 400 });

    // Ajuste 6 — normaliza email (trim + lowercase) e username (trim) na criação
    const email = String(body.email).trim().toLowerCase();
    const username = typeof body.username === 'string' && body.username.trim() ? body.username.trim() : null;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) return NextResponse.json({ error: 'Email invalido.' }, { status: 400 });

    // Check duplicate email (normalizado)
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'Este e-mail já está sendo utilizado por outro acesso.' }, { status: 400 });

    // Check duplicate username
    if (username) {
      const dupUser = await prisma.user.findUnique({ where: { username } });
      if (dupUser) return NextResponse.json({ error: 'Este usuario de login ja esta sendo utilizado por outro acesso.' }, { status: 400 });
    }

    const hash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        username,
        password: hash,
        role: body.role || 'BALCAO',
        tipoBalcao: body.tipoBalcao || null,
        cargo: body.cargo || null,
        telefone: body.telefone || null,
        observacoes: body.observacoes || null,
        createdBy: session.name,
      },
      select: { id: true, name: true, email: true, username: true, role: true, active: true, tipoBalcao: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    console.error('Erro ao criar usuario:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
