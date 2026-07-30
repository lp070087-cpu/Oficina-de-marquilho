import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — listar notificações do usuário atual (interno, não cliente)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const searchParams = req.nextUrl.searchParams;
    const filtro = searchParams.get('filtro') || 'todas'; // todas, naoLidas, lidas
    const prioridade = searchParams.get('prioridade');
    const tipo = searchParams.get('tipo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const where: any = { usuarioId: session.id };

    if (filtro === 'naoLidas') where.lida = false;
    if (filtro === 'lidas') where.lida = true;
    if (prioridade) where.prioridade = prioridade;
    if (tipo) where.tipo = tipo;

    const [notificacoes, total] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificacao.count({ where }),
    ]);

    // Contagem de não lidas
    const naoLidas = await prisma.notificacao.count({
      where: { usuarioId: session.id, lida: false },
    });

    return NextResponse.json({
      notificacoes,
      total,
      naoLidas,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
