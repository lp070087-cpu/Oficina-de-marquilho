import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST — registrar visualização de produto
export async function POST(req: NextRequest) {
  try {
    const { pecaId, clienteId, sessao, origem } = await req.json();
    if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatório' }, { status: 400 });

    await prisma.produtoVisualizacao.create({
      data: { pecaId, clienteId: clienteId || null, sessao: sessao || null, origem: origem || 'catalogo' },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // silencioso — analytics não deve quebrar UX
  }
}
