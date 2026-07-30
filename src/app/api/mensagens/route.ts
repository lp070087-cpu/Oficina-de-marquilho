import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { emitEvent } from '@/lib/event-bus';

// GET — listar mensagens do usuário
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const searchParams = req.nextUrl.searchParams;
    const caixa = searchParams.get('caixa') || 'recebidas'; // recebidas, enviadas
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    const where: any = caixa === 'enviadas'
      ? { remetenteId: session.id }
      : { destinatarioId: session.id };

    const [mensagens, total] = await Promise.all([
      prisma.mensagemInterna.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          remetente: { select: { name: true, role: true } },
          destinatario: { select: { name: true, role: true } },
        },
      }),
      prisma.mensagemInterna.count({ where }),
    ]);

    const naoLidas = await prisma.mensagemInterna.count({
      where: { destinatarioId: session.id, lida: false },
    });

    return NextResponse.json({ mensagens, total, naoLidas, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — enviar mensagem
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { destinatarioId, assunto, mensagem } = await req.json();
    if (!destinatarioId || !mensagem) {
      return NextResponse.json({ error: 'destinatarioId e mensagem são obrigatórios' }, { status: 400 });
    }

    const msg = await prisma.mensagemInterna.create({
      data: {
        remetenteId: session.id,
        destinatarioId,
        assunto: assunto || null,
        mensagem,
      },
      include: {
        remetente: { select: { name: true, role: true } },
        destinatario: { select: { name: true, role: true } },
      },
    });

    // Emitir evento de mensagem recebida
    await emitEvent({
      tipo: 'MENSAGEM_RECEBIDA',
      origem: 'SISTEMA',
      entidadeTipo: 'MensagemInterna',
      entidadeId: msg.id,
      usuarioId: session.id,
      payload: {
        remetenteNome: session.name,
        destinatarioId,
        assunto: assunto || 'Sem assunto',
      },
    });

    return NextResponse.json(msg, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
