import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createToken, roleToPath } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit: 5 tentativas por IP a cada 60s (brute-force protection)
  const rl = checkRateLimit(request, { key: 'auth:login', maxRequests: 5, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const { email, password, perfil } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email }], active: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
    }

    // Mecanico nao possui login — apenas cadastro interno
    if (user.role === 'MECANICO') {
      return NextResponse.json({ error: 'Este perfil nao tem permissao de login.' }, { status: 403 });
    }

    // C22 — Verifica se a conta está bloqueada (lockout após 5 falhas por 15 min)
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutosRestantes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60_000);
      const horaDesbloqueio = new Date(user.lockedUntil).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return NextResponse.json({
        error: `Conta temporariamente bloqueada. Tente novamente em ${minutosRestantes} minuto(s) (após ${horaDesbloqueio}).`
      }, { status: 423 });
    }

    // Validate perfil match
    if (perfil) {
      const profileRoleMap: Record<string, { role: string; tipoBalcao?: string }> = {
        DONO: { role: 'DONO' },
        BALCAO_SERVICOS: { role: 'BALCAO', tipoBalcao: 'SERVICOS' },
        ESTOQUE_CENTRAL: { role: 'ESTOQUE', tipoBalcao: 'ESTOQUE_CENTRAL' },
        BALCAO_VENDA: { role: 'BALCAO', tipoBalcao: 'VENDA_LOJA' },
      };
      const expected = profileRoleMap[perfil];
      if (!expected || user.role !== expected.role || (expected.tipoBalcao && user.tipoBalcao !== expected.tipoBalcao)) {
        return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
      }
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Incrementa tentativas de login falhas e bloqueia após 5 tentativas
      const novasTentativas = (user.failedLoginAttempts || 0) + 1;
      const bloqueado = novasTentativas >= 5
        ? new Date(Date.now() + 15 * 60 * 1000) // bloqueia por 15 minutos
        : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: novasTentativas, lockedUntil: bloqueado },
      });
      return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
    }

    // Login bem-sucedido: reseta tentativas falhas e trava
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    });

    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tipoBalcao: user.tipoBalcao,
      emAlmoco: user.emAlmoco,
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: roleToPath(user.role),
      user: { id: user.id, name: user.name, role: user.role },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
