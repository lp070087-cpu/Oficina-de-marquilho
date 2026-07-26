import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { status, mecanicoId, diagnostico, valorMaoDeObra, statusPagamento, valorPago } = body;
  const data: any = {};
  if (status !== undefined) data.status = status;
  if (mecanicoId !== undefined) data.mecanicoId = mecanicoId;
  if (diagnostico !== undefined) data.diagnostico = diagnostico;

  // Pagamento: apenas DONO pode marcar como PAGO
  // BALCAO pode marcar como AGUARDANDO_PAGAMENTO (finalizar servico) e ENTREGUE (liberar moto)
  if (statusPagamento === 'PAGO' && session.role !== 'DONO') {
    return NextResponse.json({ error: 'Apenas o Dono pode marcar como PAGO.' }, { status: 403 });
  }
  if (statusPagamento !== undefined) {
    data.statusPagamento = statusPagamento;
    if (statusPagamento === 'PAGO') {
      data.dataPagamento = new Date();
      data.usuarioPagamento = session.name;
    }
    // Quando Balcao finaliza servico, registrar data e responsavel
    if (statusPagamento === 'AGUARDANDO_PAGAMENTO') {
      data.finalizadoEm = new Date();
      data.finalizadoPor = session.name;
    }
    // Quando Balcao (ou qualquer um) entrega a moto
    if (statusPagamento === 'ENTREGUE') {
      data.finalizadoEm = data.finalizadoEm || new Date();
    }
  }
  if (valorPago !== undefined) data.valorPago = valorPago;

  if (Object.keys(data).length === 0 && !valorMaoDeObra) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
  }

  try {
    // Transação atômica: ler itens + atualizar OS (evita race condition no valorTotal)
    const os = await prisma.$transaction(async (tx) => {
      if (valorMaoDeObra !== undefined) {
        const itens = await tx.itemOS.findMany({ where: { ordemServicoId: id }, include: { peca: true } });
        const valorPecas = itens.reduce((sum, i) => sum + Number(i.precoUnitario) * i.quantidade, 0);
        data.valorMaoDeObra = valorMaoDeObra;
        data.valorTotal = valorPecas + Number(valorMaoDeObra);
      }
      if (Object.keys(data).length === 0) throw new Error('Nada para atualizar');

      return tx.ordemServico.update({
        where: { id }, data,
        include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: true } } },
      });
    });

    return NextResponse.json(os);
  } catch (e: any) {
    if (e?.message === 'Nada para atualizar') return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
