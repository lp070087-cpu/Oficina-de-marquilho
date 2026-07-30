import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/contas-receber
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') || '';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '200');

  const where: any = {};
  if (status) where.status = status;

  const contas = await prisma.contaReceber.findMany({
    where, orderBy: { dataVencimento: 'asc' }, take: Math.min(limit, 500),
  });
  return NextResponse.json(contas);
}

// POST /api/financeiro/contas-receber
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.cliente || !body.valor || !body.dataVencimento) {
      return NextResponse.json({ error: 'cliente, valor e dataVencimento obrigatorios' }, { status: 400 });
    }
    const conta = await prisma.contaReceber.create({
      data: {
        cliente: body.cliente, telefone: body.telefone, documento: body.documento,
        valor: body.valor, valorRecebido: body.valorRecebido || 0,
        dataVencimento: new Date(body.dataVencimento),
        dataEmissao: body.dataEmissao ? new Date(body.dataEmissao) : new Date(),
        status: body.status || 'EM_ABERTO', origem: body.origem || 'MANUAL',
        ordemServicoId: body.ordemServicoId, vendaId: body.vendaId,
        parcela: body.parcela, totalParcelas: body.totalParcelas,
        formaPagamento: body.formaPagamento, descricao: body.descricao,
        criadoPor: session.name,
      },
    });

    await prisma.auditoriaFinanceira.create({
      data: { entidade: 'ContaReceber', entidadeId: conta.id, acao: 'CRIADO',
        descricao: `Conta a receber de ${body.cliente} — R$ ${Number(body.valor).toFixed(2)}`,
        usuario: session.name, usuarioId: session.id },
    });

    return NextResponse.json(conta, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT — Receber/atualizar conta
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
      if (body.status === 'RECEBIDO') {
        data.dataRecebimento = new Date();
        data.valorRecebido = body.valorRecebido || body.valor;
        data.recebidoPor = session.name;
        data.formaPagamento = body.formaPagamento;
      }
      if (body.status === 'CANCELADO') { data.canceladoPor = session.name; data.canceladoEm = new Date(); }
    }
    if (body.valorRecebido !== undefined) data.valorRecebido = body.valorRecebido;
    if (body.observacoes !== undefined) data.observacoes = body.observacoes;

    const conta = await prisma.contaReceber.update({ where: { id: body.id }, data });

    await prisma.auditoriaFinanceira.create({
      data: { entidade: 'ContaReceber', entidadeId: conta.id, acao: body.status === 'RECEBIDO' ? 'RECEBIDO' : 'ALTERADO',
        descricao: `Conta ${conta.cliente} status: ${conta.status}`,
        usuario: session.name, usuarioId: session.id },
    });

    // Se recebida, criar lançamento financeiro
    if (body.status === 'RECEBIDO') {
      // Buscar centro de custo padrão
      const centro = await prisma.centroCusto.findFirst({ where: { tipo: 'LOJA' } });
      if (centro) {
        await prisma.lancamentoFinanceiro.create({
          data: {
            tipo: 'RECEITA', categoria: 'OUTROS', valor: conta.valorRecebido,
            data: new Date(), descricao: `Recebimento: ${conta.cliente} — ${conta.descricao || ''}`,
            centroCustoId: centro.id, origem: 'MANUAL',
            formaPagamento: body.formaPagamento, criadoPor: session.name, criadoPorId: session.id, status: 'EFETIVADO',
          },
        });
      }
    }

    return NextResponse.json(conta);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
