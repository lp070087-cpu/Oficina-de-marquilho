import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/ordens/[id]/historico — Listar historico da OS (read-only, nunca apagar)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

    const { id } = await params;
    const historico = await prisma.historicoOS.findMany({
      where: { ordemServicoId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(historico);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
