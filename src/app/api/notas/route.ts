import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const body = await req.json();
  const { ordemServicoId, numero, chaveAcesso } = body;
  const existente = await prisma.notaFiscal.findUnique({ where: { ordemServicoId } });
  if (existente) {
    return NextResponse.json({ error: 'Essa OS ja possui nota fiscal' }, { status: 400 });
  }
  const nf = await prisma.notaFiscal.create({
    data: { ordemServicoId, numero, chaveAcesso: chaveAcesso || null },
    include: { ordemServico: { select: { numero: true, nomeCliente: true, telefoneCliente: true, valorTotal: true } } },
  });
  return NextResponse.json(nf, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const notas = await prisma.notaFiscal.findMany({
    include: { ordemServico: { select: { numero: true, nomeCliente: true, telefoneCliente: true, valorTotal: true } } },
    orderBy: { emitidaEm: 'desc' },
  });
  return NextResponse.json(notas);
}
