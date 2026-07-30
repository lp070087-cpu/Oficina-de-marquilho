import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/contas-pagar
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') || '';
  const categoria = req.nextUrl.searchParams.get('categoria') || '';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '200');

  const where: any = {};
  if (status) where.status = status;
  if (categoria) where.categoria = categoria;

  const contas = await prisma.contaPagar.findMany({
    where, include: { centroCusto: { select: { nome: true } } },
    orderBy: { dataVencimento: 'asc' }, take: Math.min(limit, 500),
  });
  return NextResponse.json(contas);
}

// POST /api/financeiro/contas-pagar
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.valor || !body.dataVencimento || !body.centroCustoId) {
      return NextResponse.json({ error: 'valor, dataVencimento e centroCustoId obrigatorios' }, { status: 400 });
    }
    const conta = await prisma.contaPagar.create({
      data: {
        fornecedor: body.fornecedor, descricao: body.descricao,
        valor: body.valor, valorPago: 0,
        dataVencimento: new Date(body.dataVencimento),
        dataEmissao: body.dataEmissao ? new Date(body.dataEmissao) : new Date(),
        status: body.status || 'EM_ABERTO', categoria: body.categoria || 'OUTROS',
        centroCustoId: body.centroCustoId, origem: body.origem || 'MANUAL',
        pedidoFornecedorId: body.pedidoFornecedorId,
        parcela: body.parcela, totalParcelas: body.totalParcelas,
        formaPagamento: body.formaPagamento, observacoes: body.observacoes,
        criadoPor: session.name,
      },
      include: { centroCusto: { select: { nome: true } } },
    });

    await prisma.auditoriaFinanceira.create({
      data: { entidade: 'ContaPagar', entidadeId: conta.id, acao: 'CRIADO',
        descricao: `Conta a pagar — R$ ${Number(body.valor).toFixed(2)} (${body.categoria || 'OUTROS'})`,
        usuario: session.name, usuarioId: session.id },
    });

    return NextResponse.json(conta, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT — Pagar/atualizar
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

    const data: any = {};
    if (body.status) {
      data.status = body.status;
      if (body.status === 'PAGO') {
        data.dataPagamento = new Date();
        data.valorPago = body.valor || body.valorPago;
        data.pagoPor = session.name;
        data.formaPagamento = body.formaPagamento;
      }
      if (body.status === 'CANCELADO') { data.canceladoPor = session.name; data.canceladoEm = new Date(); }
    }
    if (body.valorPago !== undefined) data.valorPago = body.valorPago;
    if (body.observacoes !== undefined) data.observacoes = body.observacoes;

    const conta = await prisma.contaPagar.update({ where: { id: body.id }, data, include: { centroCusto: { select: { nome: true } } } });

    await prisma.auditoriaFinanceira.create({
      data: { entidade: 'ContaPagar', entidadeId: conta.id, acao: body.status === 'PAGO' ? 'PAGO' : 'ALTERADO',
        descricao: `Conta ${conta.fornecedor || 'despesa'} status: ${conta.status}`,
        usuario: session.name, usuarioId: session.id },
    });

    // Se paga, criar lançamento de despesa
    if (body.status === 'PAGO') {
      await prisma.lancamentoFinanceiro.create({
        data: {
          tipo: 'DESPESA', categoria: conta.categoria || 'OUTROS', valor: Number(conta.valorPago || conta.valor),
          data: new Date(), descricao: `Pagamento: ${conta.fornecedor || ''} — ${conta.descricao || ''}`,
          centroCustoId: conta.centroCustoId, origem: conta.origem || 'MANUAL',
          formaPagamento: conta.formaPagamento, criadoPor: session.name, criadoPorId: session.id, status: 'EFETIVADO',
        },
      });
    }

    return NextResponse.json(conta);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
