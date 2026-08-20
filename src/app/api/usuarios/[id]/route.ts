import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizarEmail(v: string): string {
  return v.trim().toLowerCase();
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    // Ajuste 8 — Proteção da conta ADMIN/DONA: edição de balcão NUNCA pode
    // alterar a conta da DONA (email, senha, role, nome). Bloqueia qualquer
    // tentativa de editar um usuário com role DONO.
    if (user.role === 'DONO') {
      return NextResponse.json({ error: 'A conta do administrador nao pode ser editada por aqui.' }, { status: 403 });
    }

    const body = await req.json();
    const data: any = {};

    // Name
    if (body.name !== undefined) {
      const nome = typeof body.name === 'string' ? body.name.trim() : '';
      if (!nome) return NextResponse.json({ error: 'Nome nao pode ficar vazio.' }, { status: 400 });
      data.name = nome;
    }

    // Username (Ajuste 5/9) — normaliza e verifica duplicidade
    if (body.username !== undefined) {
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      data.username = username || null;
      if (username) {
        const dupUsername = await prisma.user.findUnique({ where: { username } });
        if (dupUsername && dupUsername.id !== user.id) {
          return NextResponse.json({ error: 'Este usuario de login ja esta sendo utilizado por outro acesso.' }, { status: 400 });
        }
      }
    }

    // tipoBalcao
    if (body.tipoBalcao !== undefined) data.tipoBalcao = body.tipoBalcao || null;
    // cargo
    if (body.cargo !== undefined) data.cargo = body.cargo || null;
    // telefone
    if (body.telefone !== undefined) data.telefone = body.telefone || null;
    // observacoes
    if (body.observacoes !== undefined) data.observacoes = body.observacoes || null;
    // Active toggle
    if (typeof body.active === 'boolean') data.active = body.active;

    // Email (Ajustes 3/5/6) — normalização + validação + duplicidade
    if (body.email !== undefined) {
      const email = normalizarEmail(String(body.email ?? ''));
      if (!email || !EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Email invalido.' }, { status: 400 });
      }
      const dupEmail = await prisma.user.findUnique({ where: { email } });
      if (dupEmail && dupEmail.id !== user.id) {
        return NextResponse.json({ error: 'Este e-mail já está sendo utilizado por outro acesso.' }, { status: 400 });
      }
      data.email = email;
    }

    // Password (Ajuste 4) — vazio mantém hash atual; preenchido gera novo hash.
    // NUNCA retornar senha/hash, salvar texto puro ou logar.
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10);
      data.passwordUpdatedAt = new Date();
    }

    // mustChangePassword
    if (typeof body.mustChangePassword === 'boolean') data.mustChangePassword = body.mustChangePassword;
    // Lock/unlock
    if (body.lockedUntil !== undefined) data.lockedUntil = body.lockedUntil;
    if (typeof body.failedLoginAttempts === 'number') data.failedLoginAttempts = body.failedLoginAttempts;

    // Compatibilidade: toggle antigo vazio
    if (Object.keys(data).length === 0 && Object.keys(body).length === 0) {
      data.active = !user.active;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, username: true, role: true, active: true, tipoBalcao: true, mustChangePassword: true, lockedUntil: true, passwordUpdatedAt: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Erro ao atualizar usuario:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
