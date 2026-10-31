import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { localizarAtendente } from '@/lib/atendimento-acesso';

export async function POST(request: Request) {
  const rl = checkRateLimit(request, { key: 'auth:atendimento', maxRequests: 5, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } });
  }

  try {
    const { senha } = await request.json();
    if (typeof senha !== 'string' || !senha) return NextResponse.json({ error: 'Senha invalida.' }, { status: 401 });

    const user = await localizarAtendente(senha);
    if (!user) return NextResponse.json({ error: 'Senha invalida.' }, { status: 401 });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = await createToken({ id: user.id, name: user.name, email: user.email, role: user.role, tipoBalcao: user.tipoBalcao, emAlmoco: user.emAlmoco, trocarSenha: user.mustChangePassword });
    const response = NextResponse.json({ success: true, redirectTo: user.mustChangePassword ? '/trocar-senha' : '/balcao/atendimento' });
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'lax', maxAge: 60 * 60 * 12 });
    return response;
  } catch (error) {
    console.error('Login atendimento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
