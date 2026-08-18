import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, getVitrineSession } from '@/lib/auth';
import { emitEvent } from '@/lib/event-bus';
import { checkRateLimit } from '@/lib/rate-limit';

// GET — listar pedidos do cliente (vitrine) ou todos (admin ?admin=1)
export async function GET(req: NextRequest) {
  try {
    const admin = req.nextUrl.searchParams.get('admin');

    // Admin: listar todos (exige sessão DONO/BALCAO)
    if (admin === '1') {
      const session = await getSession();
      if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const status = req.nextUrl.searchParams.get('status');
      const where: any = { tipo: 'VITRINE' };
      if (status) where.status = status.toUpperCase();

      const pedidos = await prisma.pedido.findMany({
        where,
        include: {
          itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true } } } },
          cliente: { select: { nome: true, telefone: true } },
          historico: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      return NextResponse.json({
        pedidos,
        metricas: {
          aguardando: await prisma.pedido.count({ where: { tipo: 'VITRINE', status: 'PEDIDO_RECEBIDO' } }),
          separando: await prisma.pedido.count({ where: { tipo: 'VITRINE', status: 'EM_SEPARACAO' } }),
          prontos: await prisma.pedido.count({ where: { tipo: 'VITRINE', status: 'PRONTO_PARA_RETIRADA' } }),
          retiradosHoje: await prisma.pedido.count({ where: { tipo: 'VITRINE', status: 'RETIRADO', retiradaEm: { gte: hoje } } }),
          cancelados: await prisma.pedido.count({ where: { tipo: 'VITRINE', status: 'CANCELADO' } }),
        },
      });
    }

    // Cliente: listar seus pedidos (usa getVitrineSession centralizada)
    const authHeader = req.headers.get('authorization') || '';
    const cliente = await getVitrineSession(authHeader);
    if (!cliente) return NextResponse.json({ pedidos: [] });

    const pedidos = await prisma.pedido.findMany({
      where: { clienteId: cliente.clienteId, tipo: 'VITRINE' },
      include: {
        itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, categoria: { select: { nome: true } } } } } },
        historico: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pedidos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — criar pedido da vitrine (checkout finalizado)
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { key: 'vitrine:pedidos', maxRequests: 5, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitos pedidos. Aguarde um momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const authHeader = req.headers.get('authorization') || '';
    const cliente = await getVitrineSession(authHeader);
    if (!cliente) return NextResponse.json({ error: 'Login necessário' }, { status: 401 });

    const body = await req.json();
    const {
      itens, formaPagamento, observacoes, cupomCodigo,
      retiradaNome, retiradaTelefone, retiradaDocumento,
    } = body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    // Buscar cliente para nome/telefone
    const clienteData = await prisma.cliente.findUnique({ where: { id: cliente.clienteId } });
    if (!clienteData) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

    // Calcular totais e validar estoque da loja
    let subtotal = 0;
    let descontoTotal = 0;
    const itensValidados: any[] = [];

    for (const item of itens) {
      const peca = await prisma.peca.findUnique({ where: { id: item.pecaId } });
      if (!peca || !peca.ativo) continue;

      const qtd = Math.max(1, parseInt(item.quantidade) || 1);

      // Regra oficial da Vitrine (Correção 1): ativo=true && quantidadeLoja>0 && precoVenda>0.
      // O flag manual `vitrine` NÃO bloqueia mais a venda.
      if (Number(peca.precoVenda) <= 0 || peca.quantidadeLoja < qtd) {
        return NextResponse.json(
          { error: `Estoque insuficiente na loja para "${peca.nome}". Reduza a quantidade ou remova do carrinho.` },
          { status: 400 }
        );
      }

      const preco = peca.precoOferta && peca.precoOferta < peca.precoVenda ? peca.precoOferta : peca.precoVenda;
      const precoFinal = Number(preco);
      const sub = precoFinal * qtd;

      // RESERVAR estoque da loja
      await prisma.peca.update({
        where: { id: peca.id },
        data: { quantidadeLoja: { decrement: qtd } },
      });

      itensValidados.push({
        pecaId: peca.id,
        quantidade: qtd,
        precoOriginal: precoFinal,
        precoVendido: precoFinal,
        subtotal: sub,
        reservado: true,
      });

      subtotal += sub;
    }

    if (itensValidados.length === 0) {
      return NextResponse.json({ error: 'Nenhum item válido no carrinho' }, { status: 400 });
    }

    // Aplicar cupom se fornecido
    if (cupomCodigo) {
      const cupom = await prisma.cupom.findFirst({
        where: { codigo: cupomCodigo.toUpperCase(), ativo: true, dataInicio: { lte: new Date() }, dataFim: { gte: new Date() } },
      });
      if (!cupom) {
        return NextResponse.json({ error: 'Cupom inválido ou expirado.' }, { status: 400 });
      }

      // C4 — Validar regras de negócio do cupom
      // quantidadeMax: rejeitar se já atingiu o limite de usos
      if (cupom.quantidadeMax !== null && cupom.quantidadeMax > 0 && cupom.quantidadeUsada >= cupom.quantidadeMax) {
        return NextResponse.json({ error: 'Cupom esgotado.' }, { status: 400 });
      }
      // valorMinimo: rejeitar se subtotal não atinge o mínimo
      if (cupom.valorMinimo !== null && subtotal < Number(cupom.valorMinimo)) {
        return NextResponse.json({ error: `Pedido mínimo para este cupom: R$ ${Number(cupom.valorMinimo).toFixed(2).replace('.', ',')}` }, { status: 400 });
      }
      // primeiraCompra: verificar se cliente já tem pedidos anteriores (excluindo cancelados)
      if (cupom.primeiraCompra) {
        const pedidosAnteriores = await prisma.pedido.count({
          where: { clienteId: cliente.clienteId, status: { not: 'CANCELADO' } },
        });
        if (pedidosAnteriores > 0) {
          return NextResponse.json({ error: 'Cupom válido apenas para a primeira compra.' }, { status: 400 });
        }
      }

      if (cupom.tipo === 'PERCENTUAL') {
        descontoTotal = subtotal * (Number(cupom.valor) / 100);
      } else {
        descontoTotal = Number(cupom.valor);
      }
    }

    const total = Math.max(0, subtotal - descontoTotal);

    // Gerar QR code (id do pedido como conteúdo)
    const pedido = await prisma.pedido.create({
      data: {
        tipo: 'VITRINE',
        origem: 'VITRINE',
        status: 'PEDIDO_RECEBIDO',
        clienteId: cliente.clienteId,
        clienteNome: clienteData.nome,
        clienteTelefone: clienteData.telefone,
        formaPagamento,
        retiradaNome: retiradaNome || clienteData.nome,
        retiradaTelefone: retiradaTelefone || clienteData.telefone,
        retiradaDocumento: retiradaDocumento || null,
        qrCode: `MP:${cliente.clienteId}:${Date.now()}`, // Será substituído após criação
        subtotal,
        descontoTotal,
        total,
        observacoes: observacoes || null,
        criadoPor: clienteData.nome,
        criadoPorId: cliente.clienteId,
      },
    });

    // Atualizar QR code com o número do pedido
    const qrData = `MP-PEDIDO-${pedido.numero}`;
    await prisma.pedido.update({ where: { id: pedido.id }, data: { qrCode: qrData } });

    // Criar itens
    for (const item of itensValidados) {
      await prisma.pedidoItem.create({
        data: {
          pedidoId: pedido.id,
          pecaId: item.pecaId,
          quantidade: item.quantidade,
          precoOriginal: item.precoOriginal,
          precoVendido: item.precoVendido,
          subtotal: item.subtotal,
          reservado: true,
        },
      });
    }

    // Registrar histórico
    await prisma.historicoPedido.create({
      data: {
        pedidoId: pedido.id,
        tipo: 'PEDIDO_RECEBIDO',
        descricao: `Pedido #${pedido.numero} recebido via Vitrine`,
        usuario: clienteData.nome,
      },
    });

    // C4 — Incrementar quantidadeUsada do cupom após pedido criado com sucesso
    // Não reverte o pedido em caso de falha (try/catch separado)
    if (cupomCodigo) {
      try {
        const cupomAtual = await prisma.cupom.findFirst({
          where: { codigo: cupomCodigo.toUpperCase(), ativo: true },
        });
        if (cupomAtual) {
          await prisma.cupom.update({
            where: { id: cupomAtual.id },
            data: { quantidadeUsada: { increment: 1 } },
          });
        }
      } catch (cupomErr) {
        console.error('Erro ao incrementar uso do cupom:', cupomErr);
        // Não falha o pedido — o pedido já foi criado
      }
    }

    // FASE 15-J: Emitir evento de pedido criado
    emitEvent({
      tipo: 'PEDIDO_CRIADO',
      origem: 'VITRINE',
      entidadeTipo: 'Pedido',
      entidadeId: String(pedido.numero),
      payload: { numero: pedido.numero, total: Number(total), clienteNome: clienteData.nome },
    });

    // Resultado completo
    const result = await prisma.pedido.findUnique({
      where: { id: pedido.id },
      include: {
        itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true } } } },
        historico: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
