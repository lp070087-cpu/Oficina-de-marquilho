import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Helper: registra HistoricoPedido
async function registrarHistorico(
  pedidoId: string, tipo: string, descricao: string, usuario: string, usuarioId?: string
) {
  await prisma.historicoPedido.create({
    data: { pedidoId, tipo, descricao, usuario, usuarioId: usuarioId || null },
  });
}

// GET: listar pedidos
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status');
  const tipo = req.nextUrl.searchParams.get('tipo');
  const where: any = {};
  if (status) where.status = status.toUpperCase();
  else where.status = { in: ['ABERTO', 'RESERVADO', 'SEPARADO', 'AGUARDANDO_PAGAMENTO'] };
  if (tipo) where.tipo = tipo.toUpperCase();

  const pedidos = await prisma.pedido.findMany({
    where,
    include: {
      itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, quantidadeLoja: true } } } },
      venda: { select: { id: true, numero: true, status: true, origem: true, operadorNome: true } },
      historico: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(pedidos);
}

// POST: criar pedido (carrinho → pedido)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const {
    itens, clienteNome, clienteTelefone, clienteCpf, observacoes,
    tipo, origem, ordemServicoId,
  } = body;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json({ error: 'Itens obrigatorios' }, { status: 400 });
  }

  const tipoPedido = tipo || 'VENDA';
  const origemPedido = origem || 'PDV';
  let subtotal = 0;
  let descontoTotal = 0;

  const pedido = await prisma.pedido.create({
    data: {
      tipo: tipoPedido,
      origem: origemPedido,
      ordemServicoId: ordemServicoId || null,
      clienteNome: clienteNome || null,
      clienteTelefone: clienteTelefone || null,
      clienteCpf: clienteCpf || null,
      observacoes: observacoes || null,
      subtotal: 0,
      descontoTotal: 0,
      total: 0,
      status: 'ABERTO',
      criadoPor: session.name || session.id,
      criadoPorId: session.id,
    },
  });

  // Historico: criacao
  await registrarHistorico(pedido.id, 'CRIADO', `Pedido #${pedido.numero} criado (${tipoPedido})`, session.name || 'Sistema', session.id);

  for (const item of itens) {
    const qtd = Math.max(1, parseInt(item.quantidade) || 1);
    const precoOrig = parseFloat(item.precoOriginal) || parseFloat(item.precoUnitario) || 0;
    const descPct = parseFloat(item.descontoPercent) || 0;
    const descReais = parseFloat(item.descontoReais) || parseFloat(item.desconto) || 0;
    const precoVend = precoOrig - (precoOrig * descPct / 100) - descReais;
    const sub = Math.max(0, precoVend * qtd);

    await prisma.pedidoItem.create({
      data: {
        pedidoId: pedido.id,
        pecaId: item.pecaId,
        quantidade: qtd,
        precoOriginal: precoOrig,
        descontoPercent: descPct,
        descontoReais: descReais,
        precoVendido: precoVend,
        subtotal: sub,
        reservado: item.reservado || false,
        observacao: item.observacao || null,
      },
    });

    subtotal += sub;
    descontoTotal += descReais + (precoOrig * descPct / 100) * qtd;
  }

  const total = subtotal;
  await prisma.pedido.update({
    where: { id: pedido.id },
    data: { subtotal, descontoTotal, total },
  });

  const result = await prisma.pedido.findUnique({
    where: { id: pedido.id },
    include: {
      itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, quantidadeLoja: true } } } },
      historico: { orderBy: { createdAt: 'desc' } },
    },
  });

  return NextResponse.json(result, { status: 201 });
}

// PUT: atualizar status (reservar, separar, cancelar, etc) — gera historico
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, observacoes } = body;

  if (!id || !status) return NextResponse.json({ error: 'id e status obrigatorios' }, { status: 400 });

  const data: any = { status };
  const operador = session.name || session.id;

  if (status === 'CANCELADO') {
    data.canceladoPor = operador;
    data.canceladoEm = new Date();
    // Liberar reservas
    await prisma.pedidoItem.updateMany({
      where: { pedidoId: id, reservado: true },
      data: { reservado: false },
    });
    await registrarHistorico(id, 'CANCELADO', `Pedido cancelado por ${operador}${observacoes ? ': ' + observacoes : ''}`, operador, session.id);
  }

  if (status === 'RESERVADO') {
    await prisma.pedidoItem.updateMany({
      where: { pedidoId: id },
      data: { reservado: true },
    });
    await registrarHistorico(id, 'RESERVADO', `Pecas reservadas por ${operador}`, operador, session.id);
  }

  if (status === 'SEPARADO') {
    // Separado: itens fisicamente separados, mas estoque ainda nao baixado
    await registrarHistorico(id, 'SEPARADO', `Pecas separadas por ${operador}`, operador, session.id);
  }

  if (status === 'AGUARDANDO_PAGAMENTO') {
    await registrarHistorico(id, 'AGUARDANDO_PAGAMENTO', `Aguardando pagamento — ${operador}`, operador, session.id);
  }

  if (observacoes) data.observacoes = observacoes;

  const pedido = await prisma.pedido.update({
    where: { id },
    data,
    include: {
      itens: { include: { peca: { select: { nome: true, codigo: true } } } },
      historico: { orderBy: { createdAt: 'desc' } },
    },
  });

  return NextResponse.json(pedido);
}
