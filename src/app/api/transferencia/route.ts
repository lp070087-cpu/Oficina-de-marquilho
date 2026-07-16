import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const { pecaId, quantidade, de, para } = await req.json();
  if (!pecaId || !quantidade) return NextResponse.json({ error: 'pecaId e quantidade obrigatorios' }, { status: 400 });

  // Transacao
  const result = await prisma.$transaction(async (tx) => {
    const peca = await tx.peca.findUnique({ where: { id: pecaId } });
    if (!peca) throw new Error('Peca nao encontrada');

    const qtd = parseInt(quantidade) || 0;
    if (de === 'CENTRAL' && peca.quantidade < qtd) throw new Error('Saldo insuficiente no estoque central');

    const updated = await tx.peca.update({
      where: { id: pecaId },
      data: {
        quantidade: de === 'CENTRAL' ? peca.quantidade - qtd : peca.quantidade,
        quantidadeLoja: para === 'LOJA' ? (peca.quantidadeLoja || 0) + qtd : (peca.quantidadeLoja || 0),
      },
    });

    await tx.transferenciaEstoque.create({
      data: { pecaId, quantidade: qtd, de: de || 'CENTRAL', para: para || 'LOJA', usuario: session.name },
    });

    await tx.movimentacaoEstoque.create({
      data: { pecaId, tipo: 'TRANSFERENCIA', quantidade: qtd, origem: de || 'CENTRAL', destino: para || 'LOJA', usuario: session.name, observacao: `Transferencia ${de} -> ${para}` },
    });

    return updated;
  });

  return NextResponse.json(result, { status: 201 });
}
