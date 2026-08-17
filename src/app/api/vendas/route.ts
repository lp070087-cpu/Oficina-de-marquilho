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

    // A partir desta versão a loja não aceita mais TRANSFERENCIA em NOVAS vendas.
    // Registros antigos permanecem legíveis (tipo é String livre no banco).
    // Só recusamos a forma; não apagamos nem alteramos dados existentes.
    if (pagamentos.some((p: any) => p?.tipo === 'TRANSFERENCIA')) {
      return NextResponse.json({ error: 'Transferencia nao e mais aceita como forma de pagamento em novas vendas' }, { status: 400 });
    }

    // Cada pagamento precisa ter valor finito > 0
    for (const pg of pagamentos) {
      const v = parseFloat(pg?.valor);
      if (!Number.isFinite(v) || v <= 0) {
        return NextResponse.json({ error: 'Cada pagamento deve ter valor maior que zero' }, { status: 400 });
      }
    }

    const venda = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { itens: { include: { peca: true } } },
      });

      if (!pedido) throw new Error('Pedido nao encontrado');
      if (pedido.status === 'CANCELADO') throw new Error('Pedido cancelado');
      if (pedido.status === 'PAGO') throw new Error('Pedido ja pago');

      // Validar estoque ANTES de qualquer escrita
      for (const item of pedido.itens) {
        const qtd = item.quantidade;
        if (!Number.isFinite(qtd) || qtd <= 0 || !Number.isInteger(qtd)) {
          throw new Error(`Quantidade invalida para ${item.peca.nome}: ${qtd}`);
        }
        const disponivel = item.peca.quantidadeLoja || 0;
        if (disponivel < qtd) {
          throw new Error(`Estoque insuficiente na Loja para ${item.peca.nome}. Disponivel: ${disponivel}, Solicitado: ${qtd}`);
        }
      }

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
        // C1: Para pedidos ORDEM_SERVICO o estoque já foi baixado ao adicionar
        // peças à OS (POST /api/ordens/[id]/itens) com MovimentacaoEstoque USO_OS.
        if (pedido.tipo !== 'ORDEM_SERVICO') {
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
      }

      // Criar pagamentos
      // Garante que o somatório dos pagamentos bata exatamente com o total da
      // venda (em centavos). Pagamento dividido ou único sempre fecha o total.
      const totalVendaCent = Math.round(Number(pedido.total) * 100);
      const totalPagoCent = pagamentos.reduce((s: number, pg: any) => s + Math.round((parseFloat(pg.valor) || 0) * 100), 0);
      if (totalPagoCent !== totalVendaCent) {
        throw new Error('Soma dos pagamentos nao confere com o total da venda');
      }

      let totalPago = 0;
      for (const pg of pagamentos) {
        const valor = Math.round((parseFloat(pg.valor) || 0) * 100) / 100;
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

      // ============================================================
      // EMISSÃO AUTOMÁTICA DE NOTA NO PAGAMENTO
      //  - ORDEM_SERVICO → Nota de Serviço (ligada à OS)
      //  - VENDA/PDV → Nota de Venda (ligada à venda)
      // Sempre verifica se já existe para NUNCA duplicar.
      // ============================================================
      try {
        if (pedido.tipo === 'ORDEM_SERVICO' && pedido.ordemServicoId) {
          const osInfo = await tx.ordemServico.findUnique({
            where: { id: pedido.ordemServicoId },
            select: { numero: true, createdAt: true },
          });
          const jaTem = await tx.notaFiscal.findUnique({ where: { ordemServicoId: pedido.ordemServicoId } });
          if (!jaTem && osInfo) {
            await tx.notaFiscal.create({
              data: {
                ordemServicoId: pedido.ordemServicoId,
                numero: `OS-${String(osInfo.numero).padStart(4, '0')}`,
                dataServico: osInfo.createdAt,
              },
            });
          }
        } else {
          const jaTem = await tx.notaFiscal.findUnique({ where: { vendaId: v.id } });
          if (!jaTem) {
            await tx.notaFiscal.create({
              data: {
                vendaId: v.id,
                numero: `V-${String(v.numero).padStart(4, '0')}`,
                dataServico: new Date(),
              },
            });
          }
        }
      } catch (e) {
        console.error('Falha ao emitir nota automatica:', e);
      }

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
          notaFiscal: { select: { numero: true } },
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
    const msg = e?.message || 'Erro ao processar venda';
    if (msg.includes('Estoque insuficiente') || msg.includes('Quantidade invalida') || msg.includes('Soma dos pagamentos')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error('Erro ao processar venda:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
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
    console.error('Erro ao listar vendas:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
