import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — produtos vistos pelo cliente (para "continuar comprando" e "vistos recentemente")
export async function GET(req: NextRequest) {
  try {
    const clienteId = req.nextUrl.searchParams.get('clienteId');
    if (!clienteId) return NextResponse.json({ produtos: [] });

    // Buscar histórico de navegação do cliente
    const navegacao = await prisma.historicoNavegacao.findMany({
      where: { clienteId },
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
    const { clienteId, pecaId } = await req.json();
    if (!clienteId || !pecaId) return NextResponse.json({ ok: false });

    await prisma.historicoNavegacao.create({ data: { clienteId, pecaId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
