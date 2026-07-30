import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { emitEvent, TipoEvento, OrigemEvento, processarFilaPendente } from '@/lib/event-bus';

// POST — registrar evento interno (e opcionalmente disparar processamento)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { tipo, origem, entidadeTipo, entidadeId, payload } = body;

    if (!tipo || !origem || !entidadeTipo) {
      return NextResponse.json({ error: 'tipo, origem e entidadeTipo são obrigatórios' }, { status: 400 });
    }

    // Apenas DONO pode emitir eventos manuais
    // Mas eventos automáticos são emitidos internamente (sem req)
    if (origem === 'MANUAL' && session.role !== 'DONO') {
      return NextResponse.json({ error: 'Apenas DONO pode emitir eventos manuais' }, { status: 403 });
    }

    const eventoId = await emitEvent({
      tipo: tipo as TipoEvento,
      origem: origem as OrigemEvento,
      entidadeTipo,
      entidadeId: entidadeId || undefined,
      usuarioId: session.id,
      payload: payload || undefined,
    });

    return NextResponse.json({ ok: true, eventoId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET — histórico de eventos (DONO e autorizados)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Apenas DONO pode ver eventos
  if (session.role !== 'DONO') {
    return NextResponse.json({ error: 'Acesso restrito à DONA' }, { status: 403 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const tipo = searchParams.get('tipo');
    const origem = searchParams.get('origem');
    const processado = searchParams.get('processado');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (origem) where.origem = origem;
    if (processado !== null && processado !== undefined) where.processado = processado === '1';

    const [eventos, total] = await Promise.all([
      prisma.eventoSistema.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { usuario: { select: { name: true, role: true } } },
      }),
      prisma.eventoSistema.count({ where }),
    ]);

    return NextResponse.json({
      eventos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
