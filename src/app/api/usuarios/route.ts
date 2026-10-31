import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { OperacaoErro } from '@/lib/operacao-pedidos';
import { validarSenhaAtendente } from '@/lib/atendimento-acesso';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['MECANICO', 'BALCAO', 'ESTOQUE'] } },
      select: { id: true, name: true, email: true, username: true, role: true, active: true, deletedAt: true, emAlmoco: true, tipoBalcao: true, mustChangePassword: true, lastLoginAt: true, lockedUntil: true, failedLoginAttempts: true, cargo: true, telefone: true, observacoes: true },
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
    // Atendente entra só com a senha individual: o e-mail interno apenas preenche o campo único do cadastro.
    const atendente = body.tipoBalcao === 'VENDA_LOJA';
    if (!body.email && !atendente) return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 });
    if (!body.password) return NextResponse.json({ error: 'Senha obrigatoria' }, { status: 400 });
    if (atendente) await validarSenhaAtendente(String(body.password));

    // Ajuste 6 — normaliza email (trim + lowercase) e username (trim) na criação
    const email = String(body.email || `atendente.${randomUUID()}@atendimento.local`).trim().toLowerCase();
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
        role: atendente ? 'BALCAO' : body.role || 'BALCAO',
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
    if (e instanceof OperacaoErro) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('Erro ao criar usuario:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
