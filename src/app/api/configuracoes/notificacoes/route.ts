import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — configuração de notificações do usuário
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    let config = await prisma.configuracaoNotificacao.findUnique({
      where: { usuarioId: session.id },
    });

    // Se não existe, cria com defaults
    if (!config) {
      config = await prisma.configuracaoNotificacao.create({
        data: { usuarioId: session.id },
      });
    }

    return NextResponse.json(config);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — atualizar preferências
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const campos = ['pedidos', 'vendas', 'oficina', 'estoque', 'financeiro', 'sistema', 'mensagens', 'interno', 'whatsapp', 'email', 'push'];

    const data: any = {};
    for (const c of campos) {
      if (body[c] !== undefined) data[c] = body[c];
    }

    const config = await prisma.configuracaoNotificacao.upsert({
      where: { usuarioId: session.id },
      update: data,
      create: { usuarioId: session.id, ...data as any },
    });

    return NextResponse.json(config);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
