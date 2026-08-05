import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, getVitrineSession } from '@/lib/auth';
import { emitEvent } from '@/lib/event-bus';

// GET — detalhes de um pedido (cliente vê o próprio, admin vê qualquer)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Verificar autenticação: admin (cookie) ou cliente vitrine (Bearer token)
    const session = await getSession();
    const isAdmin = session && ['DONO', 'BALCAO'].includes(session.role);

    if (!isAdmin) {
      // Verificar token da vitrine (cliente)
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({ error: 'Autenticação obrigatória' }, { status: 401 });
      }
      const vitrineSession = await getVitrineSession(authHeader);
      if (!vitrineSession) {
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
      }

      // Cliente só pode ver o próprio pedido
      const pedido = await prisma.pedido.findUnique({
        where: { id },
        select: { clienteId: true },
      });
      if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
      if (pedido.clienteId !== vitrineSession.clienteId) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, marca: true, precoVenda: true, categoria: { select: { nome: true } } } } } },
        cliente: { select: { nome: true, telefone: true, email: true } },
        historico: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    return NextResponse.json(pedido);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — alterar status do pedido (DONO ou BALCAO_VENDA)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) return NextResponse.json({ error: 'Status obrigatório' }, { status: 400 });

    const STATUS_VALIDOS = [
      'PEDIDO_RECEBIDO', 'EM_SEPARACAO', 'PRONTO_PARA_RETIRADA', 'RETIRADO', 'CANCELADO',
    ];

    if (!STATUS_VALIDOS.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    const operador = session.name || 'Sistema';
    const updateData: any = { status };

    // Ações específicas por status
    if (status === 'CANCELADO') {
      updateData.canceladoPor = operador;
      updateData.canceladoEm = new Date();
      // Devolver estoque reservado
      const itens = await prisma.pedidoItem.findMany({ where: { pedidoId: pedido.id, reservado: true } });
      for (const item of itens) {
        await prisma.peca.update({
          where: { id: item.pecaId },
          data: { quantidadeLoja: { increment: item.quantidade } },
        });
      }
      await prisma.pedidoItem.updateMany({
        where: { pedidoId: pedido.id },
        data: { reservado: false },
      });
    }

    if (status === 'RETIRADO') {
      // Baixar estoque definitivamente
      updateData.retiradaEm = new Date();
      // O estoque já foi reservado na criação do pedido (quantidadeLoja decrementado)
      // Aqui apenas confirmamos a baixa — o estoque já foi reduzido
      // Atualizar estoque central também
      const itens = await prisma.pedidoItem.findMany({ where: { pedidoId: pedido.id } });
      for (const item of itens) {
        await prisma.peca.update({
          where: { id: item.pecaId },
          data: { quantidade: { decrement: item.quantidade } },
        });
      }
    }

    // Registrar histórico
    const descricoes: Record<string, string> = {
      PEDIDO_RECEBIDO: `Pedido recebido`,
      EM_SEPARACAO: `Em separação — ${operador}`,
      PRONTO_PARA_RETIRADA: `Pronto para retirada — ${operador}`,
      RETIRADO: `Retirado — ${operador}`,
      CANCELADO: `Cancelado por ${operador}${body.motivo ? ': ' + body.motivo : ''}`,
    };

    await prisma.historicoPedido.create({
      data: {
        pedidoId: pedido.id,
        tipo: status,
        descricao: descricoes[status] || `Status alterado para ${status}`,
        usuario: operador,
        usuarioId: session.id,
      },
    });

    const updated = await prisma.pedido.update({
      where: { id: pedido.id },
      data: updateData,
      include: {
        itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true } } } },
        cliente: { select: { nome: true, telefone: true } },
        historico: { orderBy: { createdAt: 'desc' } },
      },
    });

    // FASE 15-J: Emitir evento de mudança de status
    const statusToEvent: Record<string, any> = {
      EM_SEPARACAO: { tipo: 'PEDIDO_EM_SEPARACAO' as any, origem: 'VITRINE' as any },
      PRONTO_PARA_RETIRADA: { tipo: 'PEDIDO_PRONTO_RETIRADA' as any, origem: 'VITRINE' as any },
      RETIRADO: { tipo: 'PEDIDO_RETIRADO' as any, origem: 'VITRINE' as any },
      CANCELADO: { tipo: 'PEDIDO_CANCELADO' as any, origem: 'VITRINE' as any },
    };

    const evt = statusToEvent[status];
    if (evt) {
      emitEvent({
        ...evt,
        entidadeTipo: 'Pedido',
        entidadeId: String(pedido.numero),
        usuarioId: session.id,
        payload: { numero: pedido.numero, total: Number(pedido.total), operador },
      });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
