import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// GET — produtos vistos pelo cliente (para "continuar comprando" e "vistos recentemente")
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const session = await getVitrineSession(authHeader);
    if (!session) return NextResponse.json({ produtos: [] });

    // Buscar histórico de navegação do cliente (clienteId do JWT verificado)
    const navegacao = await prisma.historicoNavegacao.findMany({
      where: { clienteId: session.clienteId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { pecaId: true },
    });

    if (navegacao.length === 0) return NextResponse.json({ produtos: [] });

    const pecaIds = [...new Set(navegacao.map(n => n.pecaId))];
    const produtos = await prisma.peca.findMany({
      where: { id: { in: pecaIds }, ativo: true, vitrine: true },
      include: { categoria: { select: { nome: true, slug: true } } },
    });

    // Ordenar conforme ordem do histórico
    const ordem = navegacao.map(n => n.pecaId);
    produtos.sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id));

    return NextResponse.json({ produtos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — registrar histórico de navegação
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const session = await getVitrineSession(authHeader);
    if (!session) return NextResponse.json({ ok: true });

    const { pecaId } = await req.json();
    if (!pecaId) return NextResponse.json({ ok: false });

    // Usar clienteId do JWT verificado, nunca do body
    await prisma.historicoNavegacao.create({ data: { clienteId: session.clienteId, pecaId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
