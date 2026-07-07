import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { pecaId, quantidade, adaptado } = body;
  const peca = await prisma.peca.findUnique({ where: { id: pecaId } });
  if (!peca) return NextResponse.json({ error: 'Peca nao encontrada' }, { status: 404 });
  if (peca.quantidade < quantidade) {
    return NextResponse.json({ error: `Estoque insuficiente. Disponivel: ${peca.quantidade}` }, { status: 400 });
  }
  // Verificar compatibilidade
  const ordem = await prisma.ordemServico.findUnique({ where: { id }, select: { modeloMoto: true } });
  const modelo = ordem?.modeloMoto?.toLowerCase() || '';
  const comp = (peca.compatibilidade || '').toLowerCase();
  const isUniversal = comp.includes('universal');
  const isCompativel = comp.includes(modelo) || isUniversal;
  const isAdaptado = adaptado === true || (!isCompativel && !isUniversal);

  const item = await prisma.itemOS.create({
    data: { ordemServicoId: id, pecaId, quantidade, precoUnitario: peca.precoVenda, adaptado: isAdaptado },
    include: { peca: true },
  });
  await prisma.peca.update({ where: { id: pecaId }, data: { quantidade: { decrement: quantidade } } });
  const items = await prisma.itemOS.findMany({ where: { ordemServicoId: id }, include: { peca: true } });
  const valorPecas = items.reduce((sum, i) => sum + Number(i.precoUnitario) * i.quantidade, 0);
  const os = await prisma.ordemServico.findUnique({ where: { id } });
  const valorTotal = valorPecas + Number(os?.valorMaoDeObra || 0);
  await prisma.ordemServico.update({ where: { id }, data: { valorTotal } });
  const updated = await prisma.ordemServico.findUnique({
    where: { id },
    include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: true } } },
  });
  return NextResponse.json(updated, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  const { itemId } = await req.json();
  const item = await prisma.itemOS.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
  await prisma.peca.update({ where: { id: item.pecaId }, data: { quantidade: { increment: item.quantidade } } });
  await prisma.itemOS.delete({ where: { id: itemId } });
  const items = await prisma.itemOS.findMany({ where: { ordemServicoId: id }, include: { peca: true } });
  const valorPecas = items.reduce((sum, i) => sum + Number(i.precoUnitario) * i.quantidade, 0);
  const os = await prisma.ordemServico.findUnique({ where: { id } });
  const valorTotal = valorPecas + Number(os?.valorMaoDeObra || 0);
  await prisma.ordemServico.update({ where: { id }, data: { valorTotal } });
  const updated = await prisma.ordemServico.findUnique({
    where: { id },
    include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: true } } },
  });
  return NextResponse.json(updated);
}
