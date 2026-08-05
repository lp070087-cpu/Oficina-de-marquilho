import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { emitEvent } from '@/lib/event-bus';

// POST: Pagar pedido → gera Venda → baixa estoque → registra historico
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { pedidoId, pagamentos } = body;

    if (!pedidoId) return NextResponse.json({ error: 'pedidoId obrigatorio' }, { status: 400 });
    if (!pagamentos || !Array.isArray(pagamentos) || pagamentos.length === 0) {
      return NextResponse.json({ error: 'Pagamentos obrigatorios' }, { status: 400 });
    }

    const venda = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { itens: { include: { peca: true } } },
      });

      if (!pedido) throw new Error('Pedido nao encontrado');
      if (pedido.status === 'CANCELADO') throw new Error('Pedido cancelado');
      if (pedido.status === 'PAGO') throw new Error('Pedido ja pago');

      // Criar Venda
      const origemMap: Record<string, string> = {
        VENDA: 'VENDA_AVULSA', ORDEM_SERVICO: 'ORDEM_SERVICO', ORCAMENTO: 'ORCAMENTO',
      };
      const vendaOrigem = origemMap[pedido.tipo] || pedido.origem || 'PDV';

      const v = await tx.venda.create({
        data: {
          pedidoId: pedido.id,
          status: 'PAGA',
          origem: vendaOrigem,
          operadorNome: session.name || 'Balcao',
          operadorId: session.id,
          clienteNome: pedido.clienteNome,
          clienteTelefone: pedido.clienteTelefone,
          clienteCpf: pedido.clienteCpf,
          subtotal: pedido.subtotal,
          descontoTotal: pedido.descontoTotal,
          total: pedido.total,
          criadoPor: session.name || session.id,
        },
      });

      // Historico de pagamento no pedido
      await tx.historicoPedido.create({
        data: {
          pedidoId: pedido.id,
          tipo: 'PAGO',
          descricao: `Pagamento recebido — Venda #${v.numero}`,
          usuario: session.name || 'Balcao',
          usuarioId: session.id,
        },
      });

      // Criar VendaItem com dados de lucro
      for (const item of pedido.itens) {
        const custo = Number(item.peca.precoCusto) || 0;
        const lucroUnit = Number(item.precoVendido) - custo;
        const lucroTotal = lucroUnit * item.quantidade;

        await tx.vendaItem.create({
          data: {
            vendaId: v.id,
            pecaId: item.pecaId,
            quantidade: item.quantidade,
            precoOriginal: item.precoOriginal,
            descontoPercent: item.descontoPercent,
            descontoReais: item.descontoReais,
            precoVendido: item.precoVendido,
            subtotal: item.subtotal,
            precoCusto: custo,
            lucroUnitario: lucroUnit,
            lucroTotal: lucroTotal,
            observacao: item.observacao,
          },
        });

        // BAIXA DO ESTOQUE DA LOJA (nunca central)
        await tx.peca.update({
          where: { id: item.pecaId },
          data: { quantidadeLoja: { decrement: item.quantidade } },
        });

        // Registrar movimentacao
        await tx.movimentacaoEstoque.create({
          data: {
            pecaId: item.pecaId,
            tipo: 'VENDA',
            quantidade: item.quantidade,
            origem: 'LOJA',
            destino: 'VENDA_PDV',
            usuario: session.name || 'Balcao',
            observacao: `Venda #${v.numero}`,
          },
        });
      }

      // Criar pagamentos
      let totalPago = 0;
      for (const pg of pagamentos) {
        const valor = parseFloat(pg.valor) || 0;
        await tx.pagamentoVenda.create({
          data: {
            vendaId: v.id,
            tipo: pg.tipo,
            valor,
            troco: parseFloat(pg.troco) || 0,
            bandeira: pg.bandeira || null,
            parcelas: pg.parcelas ? parseInt(pg.parcelas) : null,
          },
        });
        totalPago += valor;
      }

      // Atualizar pedido para PAGO
      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          status: 'PAGO',
          formaPagamento: pagamentos.map((p: any) => p.tipo).join(', '),
        },
      });

      // Sessao de caixa: registrar vendas
      const sessao = await tx.sessaoCaixa.findFirst({
        where: { status: 'ABERTA' },
        orderBy: { abertoEm: 'desc' },
      });

      if (sessao) {
        const vendasDinheiro = pagamentos.filter((p: any) => p.tipo === 'DINHEIRO').reduce((s: number, p: any) => s + (parseFloat(p.valor) || 0), 0);
        const vendasPix = pagamentos.filter((p: any) => p.tipo === 'PIX').reduce((s: number, p: any) => s + (parseFloat(p.valor) || 0), 0);
        const vendasCartao = pagamentos.filter((p: any) => ['CARTAO_DEBITO', 'CARTAO_CREDITO'].includes(p.tipo)).reduce((s: number, p: any) => s + (parseFloat(p.valor) || 0), 0);

        await tx.sessaoCaixa.update({
          where: { id: sessao.id },
          data: {
            totalVendas: { increment: Number(pedido.total) },
            saldoDinheiro: { increment: vendasDinheiro },
          },
        });

        if (vendasDinheiro > 0) {
          await tx.movimentacaoCaixa.create({
            data: { sessaoId: sessao.id, tipo: 'VENDA_DINHEIRO', valor: vendasDinheiro, descricao: `Venda #${v.numero}`, usuario: session.name || 'Balcao', vendaId: v.id },
          });
        }
        if (vendasPix > 0) {
          await tx.movimentacaoCaixa.create({
            data: { sessaoId: sessao.id, tipo: 'VENDA_PIX', valor: vendasPix, descricao: `Venda #${v.numero}`, usuario: session.name || 'Balcao', vendaId: v.id },
          });
        }
        if (vendasCartao > 0) {
          await tx.movimentacaoCaixa.create({
            data: { sessaoId: sessao.id, tipo: 'VENDA_CARTAO', valor: vendasCartao, descricao: `Venda #${v.numero}`, usuario: session.name || 'Balcao', vendaId: v.id },
          });
        }
      }

      return tx.venda.findUnique({
        where: { id: v.id },
        include: {
          itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, marca: true } } } },
          pagamentos: true,
          pedido: { select: { numero: true } },
        },
      });
    });

    // FASE 15-J: Emitir evento de venda concretizada
    if (venda) {
      emitEvent({
        tipo: 'VENDA_PAGA',
        origem: 'PDV',
        entidadeTipo: 'Venda',
        entidadeId: String(venda.numero),
        usuarioId: session.id,
        payload: { numero: venda.numero, total: Number(venda.total), operador: session.name || 'Balcao' },
      });
    }

    return NextResponse.json(venda, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: listar vendas
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const data = req.nextUrl.searchParams.get('data');
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const where: any = {};
    if (data) {
      const inicio = new Date(data);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(data);
      fim.setHours(23, 59, 59, 999);
      where.createdAt = { gte: inicio, lte: fim };
    }

    const [vendas, total] = await Promise.all([
      prisma.venda.findMany({
        where,
        include: {
          itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true } } } },
          pagamentos: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.venda.count({ where }),
    ]);

    return NextResponse.json({ vendas, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
