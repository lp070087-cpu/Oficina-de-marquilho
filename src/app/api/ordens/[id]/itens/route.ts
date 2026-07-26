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

  try {
    const ordemAtualizada = await prisma.$transaction(async (tx) => {
      // Ler estoque DENTRO da transação (evita TOCTOU)
      const peca = await tx.peca.findUnique({ where: { id: pecaId } });
      if (!peca) throw new Error('Peca nao encontrada');

      const qtdLoja = peca.quantidadeLoja || 0;
      const qtdCentral = peca.quantidade || 0;
      const qtdNecessaria = quantidade;

      if (qtdLoja + qtdCentral < qtdNecessaria) {
        throw new Error(`Estoque insuficiente. Loja: ${qtdLoja}, Central: ${qtdCentral}`);
      }

      // Baixa primeiro da Loja, depois do Central
      const baixaLoja = Math.min(qtdLoja, qtdNecessaria);
      const baixaCentral = qtdNecessaria - baixaLoja;

      // Verificar compatibilidade
      const ordemExistente = await tx.ordemServico.findUnique({ where: { id }, select: { modeloMoto: true } });
      const modelo = ordemExistente?.modeloMoto?.toLowerCase() || '';
      const comp = (peca.compatibilidade || '').toLowerCase();
      const isUniversal = comp.includes('universal');
      const isCompativel = comp.includes(modelo) || isUniversal;
      const isAdaptado = adaptado === true || (!isCompativel && !isUniversal);

      await tx.itemOS.create({
        data: { ordemServicoId: id, pecaId, quantidade, precoUnitario: peca.precoVenda, adaptado: isAdaptado },
      });

      // Update stock (atômico com create)
      await tx.peca.update({
        where: { id: pecaId },
        data: {
          quantidadeLoja: qtdLoja - baixaLoja,
          quantidade: baixaCentral > 0 ? qtdCentral - baixaCentral : undefined,
        },
      });

      // Register movement
      if (baixaLoja > 0) {
        await tx.movimentacaoEstoque.create({
          data: { pecaId, tipo: 'USO_OS', quantidade: baixaLoja, origem: 'LOJA', usuario: session.name, observacao: `OS #${id} - usado em servico` },
        });
      }
      if (baixaCentral > 0) {
        await tx.movimentacaoEstoque.create({
          data: { pecaId, tipo: 'USO_OS', quantidade: baixaCentral, origem: 'CENTRAL', usuario: session.name, observacao: `OS #${id} - usado em servico` },
        });
      }

      const itensOS = await tx.itemOS.findMany({ where: { ordemServicoId: id }, include: { peca: true } });
      const valorPecas = itensOS.reduce((sum, i) => sum + Number(i.precoUnitario) * i.quantidade, 0);
      const ordemAtual = await tx.ordemServico.findUnique({ where: { id } });
      const valorTotal = valorPecas + Number(ordemAtual?.valorMaoDeObra || 0);
      await tx.ordemServico.update({ where: { id }, data: { valorTotal } });

      return tx.ordemServico.findUnique({
        where: { id },
        include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: true } } },
      });
    });

    return NextResponse.json(ordemAtualizada, { status: 201 });
  } catch (e: any) {
    const msg = e?.message || 'Erro ao adicionar item';
    if (msg.includes('Peca nao encontrada')) return NextResponse.json({ error: msg }, { status: 404 });
    if (msg.includes('Estoque insuficiente')) return NextResponse.json({ error: msg }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  const { itemId } = await req.json();

  try {
    const ordemServicoAtualizada = await prisma.$transaction(async (tx) => {
      const item = await tx.itemOS.findUnique({ where: { id: itemId } });
      if (!item) throw new Error('Item nao encontrado');

      // Devolver estoque + deletar item + recalcular total — tudo atômico
      await tx.peca.update({ where: { id: item.pecaId }, data: { quantidadeLoja: { increment: item.quantidade } } });
      await tx.itemOS.delete({ where: { id: itemId } });

      const itensRestantes = await tx.itemOS.findMany({ where: { ordemServicoId: id }, include: { peca: true } });
      const valorPecas = itensRestantes.reduce((sum, i) => sum + Number(i.precoUnitario) * i.quantidade, 0);
      const ordemServico = await tx.ordemServico.findUnique({ where: { id } });
      const valorTotal = valorPecas + Number(ordemServico?.valorMaoDeObra || 0);
      await tx.ordemServico.update({ where: { id }, data: { valorTotal } });

      return tx.ordemServico.findUnique({
        where: { id },
        include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: true } } },
      });
    });

    return NextResponse.json(ordemServicoAtualizada);
  } catch (e: any) {
    if (e?.message === 'Item nao encontrado') return NextResponse.json({ error: e.message }, { status: 404 });
    return NextResponse.json({ error: 'Erro ao remover item' }, { status: 500 });
  }
}
