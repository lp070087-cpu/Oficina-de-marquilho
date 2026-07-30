import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT — responder uma pergunta (admin)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const { perguntaId, texto, por } = await req.json();
    if (!perguntaId || !texto) return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 });

    const resposta = await prisma.resposta.create({
      data: { perguntaId, texto, por: por || 'dono' },
    });
    return NextResponse.json(resposta);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
