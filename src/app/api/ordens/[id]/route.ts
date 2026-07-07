import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  const os = await prisma.ordemServico.findUnique({
    where: { id },
    include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: { include: { categoria: { select: { nome: true } } } } } }, notaFiscal: true },
  });
  if (!os) return NextResponse.json({ error: 'OS nao encontrada' }, { status: 404 });
  if (session.role === 'MECANICO' && os.mecanicoId !== session.id) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  return NextResponse.json(os);
}
