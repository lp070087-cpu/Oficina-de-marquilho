import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { createToken, getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MINIMA = 8;
const EMAIL_EM_USO = 'Este e-mail já está sendo utilizado por outro acesso.';

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function PATCH(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    return erro('Formato de solicitação inválido.', 415);
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return erro('Solicitação não autorizada.', 403);

  try {
    const session = await getSession();
    if (session?.role !== 'DONO') return erro('Entre como administradora para continuar.', 403);

    const limite = checkRateLimit(request, { key: `auth:minha-conta:${session.id}`, maxRequests: 5, windowMs: 60_000 });
    if (limite.limited) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, Math.ceil((limite.reset - Date.now()) / 1000))) },
      });
    }

    const dados = await request.json().catch(() => null);
    if (!dados || typeof dados.senhaAtual !== 'string' || !dados.senhaAtual || dados.senhaAtual.length > 1024) {
      return erro('Informe a senha atual.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { password: true, passwordUpdatedAt: true },
    });
    if (!user || (user.passwordUpdatedAt?.getTime() ?? null) !== session.credenciaisEm) {
      return erro('Sua sessão foi atualizada. Entre novamente para continuar.', 409);
    }
    if (!(await bcrypt.compare(dados.senhaAtual, user.password))) return erro('A senha atual está incorreta.', 400);

    let email = session.email;
    let alteracao: Prisma.UserUpdateManyMutationInput;
    if (dados.tipo === 'email') {
      const novoEmail = typeof dados.novoEmail === 'string' ? dados.novoEmail.trim().toLowerCase() : '';
      if (novoEmail.length > 254 || !EMAIL.test(novoEmail)) return erro('Informe um novo e-mail válido.', 400);
      if (novoEmail === email.toLowerCase()) return erro('Informe um e-mail diferente do atual.', 400);

      // O login aceita e-mail e nome de usuário no mesmo campo.
      const duplicado = await prisma.user.findFirst({
        where: { id: { not: session.id }, OR: [
          { email: { equals: novoEmail, mode: 'insensitive' } },
          { username: { equals: novoEmail, mode: 'insensitive' } },
        ] },
        select: { id: true },
      });
      if (duplicado) return erro(EMAIL_EM_USO, 409);
      email = novoEmail;
      alteracao = { email };
    } else if (dados.tipo === 'senha') {
      const { novaSenha, confirmarSenha } = dados;
      if (typeof novaSenha !== 'string' || novaSenha.length < SENHA_MINIMA || Buffer.byteLength(novaSenha, 'utf8') > 72) {
        return erro(`Use pelo menos ${SENHA_MINIMA} caracteres e até 72 bytes na nova senha.`, 400);
      }
      if (novaSenha !== confirmarSenha) return erro('A confirmação precisa ser igual à nova senha.', 400);
      if (await bcrypt.compare(novaSenha, user.password)) return erro('Escolha uma senha diferente da atual.', 400);
      alteracao = { password: await bcrypt.hash(novaSenha, 12) };
    } else {
      return erro('Escolha a credencial que deseja alterar.', 400);
    }

    // A versão usa a coluna existente e avança inclusive em atualizações no mesmo milissegundo.
    const versao = new Date(Math.max(Date.now(), (session.credenciaisEm ?? 0) + 1));
    const token = await createToken({
      id: session.id, name: session.name, email, role: 'DONO', credenciaisEm: versao.getTime(),
    });
    const resultado = await prisma.user.updateMany({
      where: { id: session.id, role: 'DONO', active: true, deletedAt: null, passwordUpdatedAt: user.passwordUpdatedAt },
      data: { ...alteracao, passwordUpdatedAt: versao },
    });
    if (!resultado.count) return erro('Sua conta mudou durante a solicitação. Entre novamente para continuar.', 409);

    const response = NextResponse.json({
      email,
      mensagem: dados.tipo === 'email' ? 'E-mail alterado com sucesso.' : 'Senha alterada com sucesso.',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
    response.cookies.set('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24,
    });
    return response;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return erro(EMAIL_EM_USO, 409);
    console.error('Falha ao atualizar as credenciais da Dona');
    return erro('Não foi possível salvar a alteração. Tente novamente.', 500);
  }
}
