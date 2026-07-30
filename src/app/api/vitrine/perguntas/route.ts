import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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

// POST — fazer pergunta
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: 'Login obrigatório' }, { status: 401 });

    const { pecaId, texto } = await req.json();
    if (!pecaId || !texto) return NextResponse.json({ error: 'pecaId e texto obrigatórios' }, { status: 400 });

    // Verificar token do cliente
    let clienteId: string;
    try {
      const payload = JSON.parse(Buffer.from(auth.split('.')[1], 'base64').toString());
      clienteId = payload.sub || payload.id;
    } catch { return NextResponse.json({ error: 'Token inválido' }, { status: 401 }); }

    const pergunta = await prisma.pergunta.create({
      data: { pecaId, clienteId, texto, aprovada: true },
    });
    return NextResponse.json(pergunta);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
