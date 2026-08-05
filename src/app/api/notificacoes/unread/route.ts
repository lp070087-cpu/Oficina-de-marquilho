import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — quantidade de não lidas
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const count = await prisma.notificacao.count({
      where: { usuarioId: session.id, lida: false },
    });

    // Últimas 3 para preview no bell
    const ultimas = await prisma.notificacao.findMany({
      where: { usuarioId: session.id, lida: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, titulo: true, mensagem: true, prioridade: true, icone: true, urlDestino: true, createdAt: true },
    });

    return NextResponse.json({ count, ultimas });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
