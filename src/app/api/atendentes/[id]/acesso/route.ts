import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { OperacaoErro } from '@/lib/operacao-pedidos';
import { bloquearAtendente, definirSenhaAtendente, revogarAtendente } from '@/lib/atendimento-acesso';

type Params = { params: Promise<{ id: string }> };

function erro(e: unknown) {
  if (e instanceof OperacaoErro) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error('Acesso do atendente:', e);
  return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
}

// PUT cria ou troca a senha individual; PATCH bloqueia ou desbloqueia; DELETE revoga o acesso e derruba as sessões abertas.
export async function PUT(req: NextRequest, { params }: Params) {
  if ((await getSession())?.role !== 'DONO') return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    const { senha, forcarTroca } = await req.json();
    if (typeof senha !== 'string') throw new OperacaoErro('Senha obrigatoria');
    await definirSenhaAtendente((await params).id, senha, forcarTroca === true);
    return NextResponse.json({ ok: true });
  } catch (e) { return erro(e); }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if ((await getSession())?.role !== 'DONO') return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    const { bloqueado } = await req.json();
    if (typeof bloqueado !== 'boolean') throw new OperacaoErro('Informe se o acesso fica bloqueado');
    await bloquearAtendente((await params).id, bloqueado);
    return NextResponse.json({ ok: true });
  } catch (e) { return erro(e); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if ((await getSession())?.role !== 'DONO') return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    await revogarAtendente((await params).id);
    return NextResponse.json({ ok: true });
  } catch (e) { return erro(e); }
}
