import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/contas-pagar
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  try {
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
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

    // C6 — Verificar idempotência: rejeitar se conta já está no status alvo
    const contaAtual = await prisma.contaPagar.findUnique({ where: { id: body.id } });
    if (!contaAtual) return NextResponse.json({ error: 'Conta nao encontrada' }, { status: 404 });
    if (body.status === 'PAGO' && contaAtual.status === 'PAGO') {
      return NextResponse.json({ error: 'Conta ja paga' }, { status: 400 });
    }
    if (body.status === 'CANCELADO' && contaAtual.status === 'CANCELADO') {
      return NextResponse.json({ error: 'Conta ja cancelada' }, { status: 400 });
    }

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

    // C6 — Envolver update + auditoria + lançamento em $transaction (previne double-counting)
    const result = await prisma.$transaction(async (tx) => {
      const conta = await tx.contaPagar.update({ where: { id: body.id }, data, include: { centroCusto: { select: { nome: true } } } });

      await tx.auditoriaFinanceira.create({
        data: { entidade: 'ContaPagar', entidadeId: conta.id, acao: body.status === 'PAGO' ? 'PAGO' : 'ALTERADO',
          descricao: `Conta ${conta.fornecedor || 'despesa'} status: ${conta.status}`,
          usuario: session.name, usuarioId: session.id },
      });

      // Se paga, criar lançamento de despesa
      if (body.status === 'PAGO') {
        await tx.lancamentoFinanceiro.create({
          data: {
            tipo: 'DESPESA', categoria: conta.categoria || 'OUTROS', valor: Number(conta.valorPago || conta.valor),
            data: new Date(), descricao: `Pagamento: ${conta.fornecedor || ''} — ${conta.descricao || ''}`,
            centroCustoId: conta.centroCustoId, origem: conta.origem || 'MANUAL',
            formaPagamento: conta.formaPagamento, criadoPor: session.name, criadoPorId: session.id, status: 'EFETIVADO',
          },
        });
      }

      return conta;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
