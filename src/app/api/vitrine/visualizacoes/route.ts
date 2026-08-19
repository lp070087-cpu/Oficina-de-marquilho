import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// POST — registrar visualização de produto
export async function POST(req: NextRequest) {
  try {
    const { pecaId, sessao, origem } = await req.json();
    if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatório' }, { status: 400 });

    // Segurança: clienteId SEMPRE vem do JWT verificado (nunca do body).
    // Isso impede que um cliente registre visualizações em nome de outro.
    const authHeader = req.headers.get('authorization') || '';
    const cliente = authHeader ? await getVitrineSession(authHeader) : null;

    await prisma.produtoVisualizacao.create({
      data: {
        pecaId,
        clienteId: cliente?.clienteId || null,
        sessao: sessao || null,
        origem: origem || 'catalogo',
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // silencioso — analytics não deve quebrar UX
  }
}
