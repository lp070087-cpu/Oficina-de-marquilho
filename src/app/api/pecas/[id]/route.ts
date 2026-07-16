import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const peca = await prisma.peca.update({
    where: { id },
    data: { nome: body.nome, descricao: body.descricao, codigo: body.codigo, codigoBarras: body.codigoBarras || null, precoVenda: body.precoVenda, precoCusto: body.precoCusto, custoMedio: body.custoMedio !== undefined ? body.custoMedio : undefined, quantidade: body.quantidade, quantidadeLoja: body.quantidadeLoja !== undefined ? body.quantidadeLoja : undefined, estoqueMinimo: body.estoqueMinimo, localizacao: body.localizacao || null, subcategoria: body.subcategoria || null, marca: body.marca || null, compatibilidade: body.compatibilidade || null, categoriaId: body.categoriaId },
    include: { categoria: { select: { nome: true } } },
  });
  return NextResponse.json(peca);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  await prisma.peca.update({ where: { id }, data: { ativo: false } });
  return NextResponse.json({ ok: true });
}
