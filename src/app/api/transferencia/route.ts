import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const { pecaId, quantidade, de, para } = await req.json();
    if (!pecaId || !quantidade) return NextResponse.json({ error: 'pecaId e quantidade obrigatorios' }, { status: 400 });

    // Transacao
    const result = await prisma.$transaction(async (tx) => {
      const qtd = parseInt(quantidade) || 0;

      // C5 — Substituir read-then-write por updateMany atômico condicional (previne race condition)
      let updateResult;
      if (de === 'CENTRAL') {
        updateResult = await tx.peca.updateMany({
          where: { id: pecaId, quantidade: { gte: qtd } },
          data: {
            quantidade: { decrement: qtd },
            ...(para === 'LOJA' ? { quantidadeLoja: { increment: qtd } } : {}),
          },
        });
      } else {
        updateResult = await tx.peca.updateMany({
          where: { id: pecaId, quantidadeLoja: { gte: qtd } },
          data: {
            quantidadeLoja: { decrement: qtd },
            ...(para === 'CENTRAL' ? { quantidade: { increment: qtd } } : {}),
          },
        });
      }
      if (updateResult.count === 0) {
        throw new Error(`Saldo insuficiente no estoque ${de === 'CENTRAL' ? 'central' : 'da loja'}`);
      }

      const updated = await tx.peca.findUnique({ where: { id: pecaId } });
      if (!updated) throw new Error('Peca nao encontrada');

      await tx.transferenciaEstoque.create({
        data: { pecaId, quantidade: qtd, de: de || 'CENTRAL', para: para || 'LOJA', usuario: session.name },
      });

      await tx.movimentacaoEstoque.create({
        data: { pecaId, tipo: 'TRANSFERENCIA', quantidade: qtd, origem: de || 'CENTRAL', destino: para || 'LOJA', usuario: session.name, observacao: `Transferencia ${de} -> ${para}` },
      });

      return updated;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    console.error('Erro na transferencia:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
