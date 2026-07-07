import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clienteId, modeloMoto, observacao, itens } = body;
  if (!clienteId || !itens?.length) {
    return NextResponse.json({ error: 'Cliente e pelo menos uma peca sao obrigatorios.' }, { status: 400 });
  }
  // Recalcular total com preços atuais
  let total = 0;
  const itensData = [];
  for (const item of itens) {
    const peca = await prisma.peca.findUnique({ where: { id: item.pecaId } });
    if (!peca) return NextResponse.json({ error: `Peca ${item.pecaId} nao encontrada.` }, { status: 404 });
    const preco = Number(peca.precoVenda);
    total += preco * item.quantidade;
    itensData.push({ pecaId: item.pecaId, quantidade: item.quantidade, precoUnitario: preco });
  }
  const orcamento = await prisma.orcamento.create({
    data: { clienteId, modeloMoto: modeloMoto || null, observacao: observacao || null, total, itens: { create: itensData } },
    include: { itens: { include: { peca: { include: { categoria: { select: { nome: true } } } } } }, cliente: true },
  });
  return NextResponse.json(orcamento, { status: 201 });
}

export async function GET(req: NextRequest) {
  const clienteId = req.nextUrl.searchParams.get('clienteId');
  let where: any = {};
  if (clienteId && clienteId !== 'ALL') {
    where = { clienteId };
  }
  const orcamentos = await prisma.orcamento.findMany({
    where,
    include: { itens: { include: { peca: { include: { categoria: { select: { nome: true } } } } } }, cliente: { select: { nome: true, telefone: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(orcamentos);
}
