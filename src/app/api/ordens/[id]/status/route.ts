import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { status, mecanicoId, diagnostico, valorMaoDeObra, statusPagamento, valorPago } = body;
  const data: any = {};
  if (status !== undefined) data.status = status;
  if (mecanicoId !== undefined) data.mecanicoId = mecanicoId;
  if (diagnostico !== undefined) data.diagnostico = diagnostico;

  // Pagamento: apenas DONO pode alterar para PAGO
  if (statusPagamento === 'PAGO' && session.role !== 'DONO') {
    return NextResponse.json({ error: 'Apenas o Dono pode marcar como PAGO.' }, { status: 403 });
  }
  if (statusPagamento !== undefined) {
    data.statusPagamento = statusPagamento;
    if (statusPagamento === 'PAGO') {
      data.dataPagamento = new Date();
      data.usuarioPagamento = session.name;
    }
  }
  if (valorPago !== undefined) data.valorPago = valorPago;

  if (valorMaoDeObra !== undefined) {
    data.valorMaoDeObra = valorMaoDeObra;
    const itens = await prisma.itemOS.findMany({ where: { ordemServicoId: id }, include: { peca: true } });
    const valorPecas = itens.reduce((sum, i) => sum + Number(i.precoUnitario) * i.quantidade, 0);
    data.valorTotal = valorPecas + Number(valorMaoDeObra);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
  }

  const os = await prisma.ordemServico.update({
    where: { id }, data,
    include: { mecanico: { select: { name: true } }, balcao: { select: { name: true } }, itens: { include: { peca: true } } },
  });
  return NextResponse.json(os);
}
