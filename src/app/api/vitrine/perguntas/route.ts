import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, getVitrineSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

// GET — listar perguntas de um produto
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pecaId = searchParams.get('pecaId');
    if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatório' }, { status: 400 });

    const perguntas = await prisma.pergunta.findMany({
      where: { pecaId, aprovada: true },
      include: {
        cliente: { select: { nome: true } },
        respostas: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const total = await prisma.pergunta.count({ where: { pecaId, aprovada: true } });
    return NextResponse.json({ perguntas, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — fazer pergunta (cliente autenticado via vitrine)
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { key: 'vitrine:perguntas', maxRequests: 5, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitas perguntas. Aguarde um momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Login obrigatório' }, { status: 401 });
    }

    // Verificar token do cliente com validação de assinatura (jose)
    const vitrineSession = await getVitrineSession(authHeader);
    if (!vitrineSession) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    const { pecaId, texto } = await req.json();
    if (!pecaId || !texto) {
      return NextResponse.json({ error: 'pecaId e texto obrigatórios' }, { status: 400 });
    }

    const pergunta = await prisma.pergunta.create({
      data: { pecaId, clienteId: vitrineSession.clienteId, texto, aprovada: true },
    });
    return NextResponse.json(pergunta);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
