import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/lancamentos — Listar com filtros
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const tipo = req.nextUrl.searchParams.get('tipo') || '';
  const categoria = req.nextUrl.searchParams.get('categoria') || '';
  const status = req.nextUrl.searchParams.get('status') || '';
  const centroCustoId = req.nextUrl.searchParams.get('centroCustoId') || '';
  const dataInicio = req.nextUrl.searchParams.get('dataInicio') || '';
  const dataFim = req.nextUrl.searchParams.get('dataFim') || '';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '200');

  const where: any = {};
  if (tipo) where.tipo = tipo;
  if (categoria) where.categoria = categoria;
  if (status) where.status = status;
  if (centroCustoId) where.centroCustoId = centroCustoId;
  if (dataInicio || dataFim) {
    where.data = {};
    if (dataInicio) where.data.gte = new Date(dataInicio);
    if (dataFim) where.data.lte = new Date(dataFim);
  }

  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where,
    include: { centroCusto: { select: { nome: true } }, comissao: true },
    orderBy: { data: 'desc' },
    take: Math.min(limit, 500),
  });

  return NextResponse.json(lancamentos);
}

// POST /api/financeiro/lancamentos — Criar lançamento manual
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.tipo || !body.valor || !body.centroCustoId) {
      return NextResponse.json({ error: 'tipo, valor e centroCustoId obrigatorios' }, { status: 400 });
    }

    const lancamento = await prisma.lancamentoFinanceiro.create({
      data: {
        tipo: body.tipo,
        categoria: body.categoria || 'OUTROS',
        valor: body.valor,
        data: body.data ? new Date(body.data) : new Date(),
        descricao: body.descricao || null,
        centroCustoId: body.centroCustoId,
        origem: 'MANUAL',
        formaPagamento: body.formaPagamento || null,
        status: body.status || 'EFETIVADO',
        criadoPor: session.name,
        criadoPorId: session.id,
      },
      include: { centroCusto: { select: { nome: true } } },
    });

    // Auditoria
    await prisma.auditoriaFinanceira.create({
      data: {
        entidade: 'LancamentoFinanceiro', entidadeId: lancamento.id,
        acao: 'CRIADO',
        descricao: `Lançamento ${body.tipo} de R$ ${Number(body.valor).toFixed(2)} criado`,
        usuario: session.name, usuarioId: session.id,
      },
    });

    return NextResponse.json(lancamento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar lancamento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT /api/financeiro/lancamentos — Atualizar
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

    const lancamento = await prisma.lancamentoFinanceiro.update({
      where: { id: body.id },
      data: {
        descricao: body.descricao,
        status: body.status,
        centroCustoId: body.centroCustoId,
        observacoes: body.observacoes,
      },
      include: { centroCusto: { select: { nome: true } } },
    });

    await prisma.auditoriaFinanceira.create({
      data: {
        entidade: 'LancamentoFinanceiro', entidadeId: lancamento.id,
        acao: 'ALTERADO', descricao: 'Lançamento alterado',
        usuario: session.name, usuarioId: session.id,
      },
    });

    return NextResponse.json(lancamento);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
