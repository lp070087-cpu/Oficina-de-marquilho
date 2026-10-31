import { NextResponse } from 'next/server';
import { createToken, getSession, roleToPath } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { OperacaoErro } from '@/lib/operacao-pedidos';
import { trocarSenhaObrigatoria } from '@/lib/atendimento-acesso';

// Só atende quem entrou com senha temporária; a sessão nova sai sem a marca de troca.
export async function POST(request: Request) {
  const rl = checkRateLimit(request, { key: 'auth:trocar-senha', maxRequests: 5, windowMs: 60_000 });
  if (rl.limited) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429 });

  const session = await getSession();
  if (!session?.trocarSenha) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  try {
    const { senhaAtual, novaSenha } = await request.json();
    if (typeof senhaAtual !== 'string' || typeof novaSenha !== 'string') throw new OperacaoErro('Preencha as senhas');
    const u = await trocarSenhaObrigatoria(session.id, senhaAtual, novaSenha);
    const token = await createToken({ id: u.id, name: u.name, email: u.email, role: u.role, tipoBalcao: u.tipoBalcao, emAlmoco: u.emAlmoco });
    const response = NextResponse.json({ success: true, redirectTo: roleToPath(u.role, u.tipoBalcao) });
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'lax', maxAge: u.tipoBalcao === 'VENDA_LOJA' ? 60 * 60 * 12 : 60 * 60 * 24 });
    return response;
  } catch (e) {
    if (e instanceof OperacaoErro) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('Troca de senha:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
