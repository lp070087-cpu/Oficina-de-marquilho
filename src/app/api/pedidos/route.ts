import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PENDENTES, podeAtender, podeReceber, codigoPedido, OperacaoErro, centavos, quantidadeValida } from '@/lib/operacao-pedidos';

const include = {
  itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, quantidadeLoja: true } } } },
  venda: { select: { id: true, numero: true, status: true, operadorNome: true } },
  historico: { orderBy: { createdAt: 'desc' as const }, take: 10 },
};
async function comServicos<T extends { ordemServicoId: string | null }>(pedidos: T[]) {
  const ids = [...new Set(pedidos.map(p => p.ordemServicoId).filter(Boolean))] as string[];
  const servicos = ids.length ? await prisma.servicoOrdem.findMany({ where: { ordemServicoId: { in: ids } } }) : [];
  return pedidos.map(p => ({ ...p, servicos: servicos.filter(s => s.ordemServicoId === p.ordemServicoId) }));
}
function erro(e: unknown) {
  if (e instanceof OperacaoErro) return NextResponse.json({ error: e.message }, { status: e.status });
  if ((e as { code?: string })?.code === 'P2028') return NextResponse.json({ error: 'Sistema ocupado. O pedido nao foi salvo; tente novamente.' }, { status: 503 });
  console.error('Operacao de pedido:', e);
  return NextResponse.json({ error: 'Erro ao salvar ou consultar pedido' }, { status: 500 });
}
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!podeAtender(s) && !podeReceber(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    const where: any = {};
    if (!podeReceber(s)) where.criadoPorId = s!.id;
    const codigo = req.nextUrl.searchParams.get('codigo');
    if (codigo) {
      if (!/^(MP-)?\d+$/i.test(codigo.trim())) throw new OperacaoErro('Codigo de pedido invalido');
      const numero = Number(codigo.trim().replace(/^MP-/i, ''));
      if (!Number.isSafeInteger(numero) || numero < 1 || numero > 2147483647) throw new OperacaoErro('Codigo de pedido invalido');
      where.numero = numero;
    } else {
      const status = req.nextUrl.searchParams.get('status');
      where.status = status === 'TODOS' ? undefined : status || { in: PENDENTES };
    }
    const tipo = req.nextUrl.searchParams.get('tipo');
    if (tipo) where.tipo = tipo;
    const pedidos = await prisma.pedido.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json((await comServicos(pedidos)).map(p => ({ ...p, codigo: codigoPedido(p.numero) })));
  } catch (e) { return erro(e); }
}
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!podeAtender(s) && !podeReceber(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    const b = await req.json();
    const tipo = b.tipo || 'VENDA';
    if (!['VENDA', 'ORCAMENTO', 'ORDEM_SERVICO'].includes(tipo)) throw new OperacaoErro('Tipo de pedido invalido');
    if (tipo === 'ORDEM_SERVICO' && !podeReceber(s)) throw new OperacaoErro('Somente o balcao de servicos pode receber OS', 403);
    if (tipo !== 'ORDEM_SERVICO' && !podeAtender(s)) throw new OperacaoErro('Utilize o atendimento para montar pedidos', 403);
    const pedido = await prisma.$transaction(async tx => {
      let rows: any[] = [];
      let subtotalCent = 0;
      let descontoCent = 0;
      let clienteNome = b.clienteNome || null;
      let clienteTelefone = b.clienteTelefone || null;
      let ordemServicoId: string | null = tipo === 'ORDEM_SERVICO' ? b.ordemServicoId : null;
      if (tipo === 'ORDEM_SERVICO') {
        // OS supplies prices, quantities and labour. A client cannot spoof an OS to skip stock.
        if (!b.ordemServicoId) throw new OperacaoErro('OS obrigatoria');
        await tx.$queryRaw`SELECT id FROM "OrdemServico" WHERE id = ${b.ordemServicoId} FOR UPDATE`;
        const os = await tx.ordemServico.findUnique({ where: { id: b.ordemServicoId }, include: { itens: true } });
        if (!os || os.status === 'CANCELADA') throw new OperacaoErro('OS indisponivel');
        if (os.statusPagamento === 'PAGO' || os.statusPagamento === 'PAGA') throw new OperacaoErro('OS ja paga', 409);
        const existente = await tx.pedido.findFirst({ where: { ordemServicoId: os.id, status: { in: [...PENDENTES, 'PAGO'] } }, include });
        if (existente) return existente;
        clienteNome = os.nomeCliente; clienteTelefone = os.telefoneCliente;
        for (const i of os.itens) {
          const preco = centavos(String(i.precoUnitario));
          rows.push({ pecaId: i.pecaId, quantidade: i.quantidade, precoOriginal: preco / 100, precoVendido: preco / 100, subtotal: preco * i.quantidade / 100 });
          subtotalCent += preco * i.quantidade;
        }
        subtotalCent += centavos(String(os.valorMaoDeObra));
      } else {
        const itens = b.itens ?? [];
        const servicos = b.servicos ?? [];
        if (!Array.isArray(itens) || !Array.isArray(servicos) || itens.length > 200 || servicos.length > 50 || !(itens.length + servicos.length)) throw new OperacaoErro('Informe de 1 a 200 itens');
        const ids = new Set<string>();
        for (const i of itens) {
          if (typeof i.pecaId !== 'string' || ids.has(i.pecaId)) throw new OperacaoErro('Peca invalida ou repetida');
          ids.add(i.pecaId);
          const qtd = quantidadeValida(i.quantidade);
          const p = await tx.peca.findUnique({ where: { id: i.pecaId } });
          if (!p?.ativo) throw new OperacaoErro('Peca indisponivel');
          if (p.quantidadeLoja < qtd) throw new OperacaoErro(`Estoque insuficiente para ${p.nome}`);
          const preco = centavos(String(p.precoVenda));
          if (preco <= 0) throw new OperacaoErro(`Peca sem preco: ${p.nome}`);
          const pct = Number(i.descontoPercent ?? 0);
          const reais = centavos(i.descontoReais ?? i.desconto ?? 0);
          if (!Number.isFinite(pct) || pct < 0 || pct > 100 || reais < 0) throw new OperacaoErro('Desconto invalido');
          if ((pct || reais) && s!.role !== 'DONO') throw new OperacaoErro('Desconto requer autorizacao da administracao', 403);
          const desc = Math.round(preco * pct / 100) + reais;
          if (desc >= preco) throw new OperacaoErro('Desconto deve ser menor que o preco');
          subtotalCent += preco * qtd; descontoCent += desc * qtd;
          rows.push({ pecaId: p.id, quantidade: qtd, precoOriginal: preco / 100, descontoPercent: pct, descontoReais: reais / 100, precoVendido: (preco - desc) / 100, subtotal: (preco - desc) * qtd / 100, observacao: typeof i.observacao === 'string' ? i.observacao.slice(0, 1000) : null });
        }
        const linhas: { nome: string; valor: number }[] = [];
        for (const item of servicos) {
          const tabelado = item.servicoTabeladoId ? await tx.servicoTabelado.findUnique({ where: { id: String(item.servicoTabeladoId) } }) : null;
          if (item.servicoTabeladoId && !tabelado?.ativo) throw new OperacaoErro('Servico indisponivel');
          const nome = String(tabelado?.nome ?? item.nome ?? '').trim().slice(0, 150);
          const valor = centavos(tabelado ? String(tabelado.valor) : item.valor);
          if (!nome || valor <= 0) throw new OperacaoErro('Informe descricao e valor do servico');
          linhas.push({ nome, valor: valor / 100 });
          subtotalCent += valor;
        }
        if (linhas.length) {
          // Reaproveita OS e ServicoOrdem; as peças seguem no pedido e baixam estoque no pagamento.
          const maoDeObra = linhas.reduce((n, l) => n + Math.round(l.valor * 100), 0) / 100;
          const os = await tx.ordemServico.create({ data: { nomeCliente: clienteNome || 'Cliente balcao', telefoneCliente: clienteTelefone || '', modeloMoto: typeof b.moto === 'string' && b.moto.trim() ? b.moto.trim().slice(0, 150) : 'Nao informado', tipoServico: 'ATENDIMENTO', balcaoId: s!.id, valorMaoDeObra: maoDeObra, valorTotal: maoDeObra, servicos: { create: linhas } } });
          ordemServicoId = os.id;
        }
      }
      if (subtotalCent - descontoCent <= 0) throw new OperacaoErro('Pedido sem valor');
      return tx.pedido.create({ data: {
        tipo, origem: tipo === 'ORDEM_SERVICO' ? 'ORDEM_SERVICO' : 'ATENDIMENTO',
        ordemServicoId,
        clienteNome, clienteTelefone, clienteCpf: b.clienteCpf || null,
        observacoes: typeof b.observacoes === 'string' ? b.observacoes.slice(0, 2000) : null,
        subtotal: subtotalCent / 100, descontoTotal: descontoCent / 100, total: (subtotalCent - descontoCent) / 100,
        status: 'AGUARDANDO_PAGAMENTO', criadoPor: s!.name, criadoPorId: s!.id,
        itens: { create: rows }, historico: { create: { tipo: 'CRIADO', descricao: 'Pedido salvo; aguardando pagamento no caixa', usuario: s!.name, usuarioId: s!.id } },
      }, include });
    }, { maxWait: 10000, timeout: 15000 });
    const [salvo] = await comServicos([pedido]);
    return NextResponse.json({ ...salvo, codigo: codigoPedido(pedido.numero) }, { status: 201 });
  } catch (e) { return erro(e); }
}
export async function PUT(req: NextRequest) {
  const s = await getSession();
  if (!podeAtender(s) && !podeReceber(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    const b = await req.json();
    if (typeof b.id !== 'string') throw new OperacaoErro('Pedido obrigatorio');
    if (b.status && ![...PENDENTES, 'CANCELADO'].includes(b.status)) throw new OperacaoErro('Status nao permitido. Pagamento somente pelo caixa', 403);
    const pedido = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Pedido" WHERE id = ${b.id} FOR UPDATE`;
      const atual = await tx.pedido.findUnique({ where: { id: b.id } });
      if (!atual) throw new OperacaoErro('Pedido nao encontrado', 404);
      if (!podeReceber(s) && atual.criadoPorId !== s!.id) throw new OperacaoErro('Nao autorizado', 403);
      if (!PENDENTES.includes(atual.status)) throw new OperacaoErro('Pedido encerrado nao pode ser alterado', 409);
      const transicoes: Record<string, string[]> = { ABERTO: ['RESERVADO','SEPARADO','AGUARDANDO_PAGAMENTO','CANCELADO'], RESERVADO: ['SEPARADO','AGUARDANDO_PAGAMENTO','CANCELADO'], SEPARADO: ['AGUARDANDO_PAGAMENTO','CANCELADO'], AGUARDANDO_PAGAMENTO: ['CANCELADO'] };
      if (b.status && b.status !== atual.status && !transicoes[atual.status]?.includes(b.status)) throw new OperacaoErro('Transicao de status nao permitida', 409);
      const data: any = {};
      for (const field of ['observacoes','clienteNome','clienteTelefone']) if (b[field] !== undefined) { if (typeof b[field] !== 'string') throw new OperacaoErro('Dados do cliente invalidos'); data[field] = b[field].slice(0, 2000); }
      if (b.status) {
        data.status = b.status;
        if (b.status === 'CANCELADO') { data.canceladoPor = s!.name; data.canceladoEm = new Date(); }
        if (b.status === 'CANCELADO' && atual.tipo !== 'ORDEM_SERVICO' && atual.ordemServicoId) await tx.ordemServico.update({ where: { id: atual.ordemServicoId }, data: { status: 'CANCELADA' } });
        if (['RESERVADO','CANCELADO'].includes(b.status)) await tx.pedidoItem.updateMany({ where: { pedidoId: b.id }, data: { reservado: b.status === 'RESERVADO' } });
      }
      if (!Object.keys(data).length) throw new OperacaoErro('Nenhum campo para atualizar');
      await tx.historicoPedido.create({ data: { pedidoId: b.id, tipo: b.status || 'ATUALIZADO', usuario: s!.name, usuarioId: s!.id, descricao: 'Atualizacao autorizada do pedido' } });
      return tx.pedido.update({ where: { id: b.id }, data, include });
    }, { maxWait: 10000, timeout: 15000 });
    const [salvo] = await comServicos([pedido]);
    return NextResponse.json({ ...salvo, codigo: codigoPedido(pedido.numero) });
  } catch (e) { return erro(e); }
}
