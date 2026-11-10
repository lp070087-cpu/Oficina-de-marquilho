import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PENDENTES, podeAtender, podeReceber, codigoPedido, OperacaoErro, centavos, quantidadeValida } from '@/lib/operacao-pedidos';
import { lerCodigoPedido } from '@/lib/codigo-pedido';

const include = {
  itens: { include: { peca: { select: { nome: true, codigo: true, imagemUrl: true, quantidadeLoja: true } } } },
  venda: { select: { id: true, numero: true, status: true, operadorNome: true } },
  historico: { orderBy: { createdAt: 'desc' as const }, take: 10 },
};
async function comServicos<T extends { ordemServicoId: string | null }>(pedidos: T[]) {
  const ids = [...new Set(pedidos.map(p => p.ordemServicoId).filter(Boolean))] as string[];
  const [servicos, ordens] = ids.length ? await Promise.all([
    prisma.servicoOrdem.findMany({ where: { ordemServicoId: { in: ids } } }),
    prisma.ordemServico.findMany({ where: { id: { in: ids } }, select: { id: true, numero: true, status: true, statusPagamento: true, tipoServico: true, modeloMoto: true, placaMoto: true, anoMoto: true, kmAtual: true, descricaoProblema: true, observacoes: true, createdAt: true, finalizadoEm: true } }),
  ]) : [[], []];
  return pedidos.map(p => ({ ...p, servicos: servicos.filter(s => s.ordemServicoId === p.ordemServicoId), ordemServico: ordens.find(o => o.id === p.ordemServicoId) || null }));
}
type Tx = Prisma.TransactionClient;
type Anterior = { itens: { pecaId: string; quantidade: number; precoOriginal: unknown; descontoPercent: unknown; descontoReais: unknown; precoVendido: unknown; observacao: string | null }[]; servicos: { id: string; nome: string; valor: unknown }[] };
/**
 * Calcula as linhas do pedido no servidor: peças pelo preço do cadastro e serviços tabelados ou avulsos.
 * Em uma OS em aberto (`anterior`), peças já lançadas mantêm o preço registrado e serviços já lançados
 * podem ser mantidos pelo id ({ id }); somente itens novos usam o cadastro atual.
 */
async function calcularLinhas(tx: Tx, s: NonNullable<Awaited<ReturnType<typeof getSession>>>, itensBrutos: unknown, servicosBrutos: unknown, opcoes: { permitirVazio?: boolean; anterior?: Anterior } = {}) {
  const itens: any[] = itensBrutos == null ? [] : itensBrutos as any[];
  const servicos: any[] = servicosBrutos == null ? [] : servicosBrutos as any[];
  if (!Array.isArray(itens) || !Array.isArray(servicos) || itens.length > 200 || servicos.length > 50 || (!opcoes.permitirVazio && !(itens.length + servicos.length))) throw new OperacaoErro('Informe de 1 a 200 itens');
  const rows: any[] = [];
  let subtotalCent = 0, descontoCent = 0;
  const ids = new Set<string>();
  for (const i of itens) {
    if (typeof i?.pecaId !== 'string' || ids.has(i.pecaId)) throw new OperacaoErro('Peca invalida ou repetida');
    ids.add(i.pecaId);
    const qtd = quantidadeValida(i.quantidade);
    const p = await tx.peca.findUnique({ where: { id: i.pecaId } });
    if (!p?.ativo) throw new OperacaoErro('Peca indisponivel');
    if (p.quantidadeLoja < qtd) throw new OperacaoErro(`Estoque insuficiente para ${p.nome}`);
    const ja = opcoes.anterior?.itens.find(a => a.pecaId === p.id);
    if (ja) {
      // Preço registrado quando a peça entrou na OS (evita divergência durante o atendimento).
      const preco = centavos(String(ja.precoOriginal)), vendido = centavos(String(ja.precoVendido));
      subtotalCent += preco * qtd; descontoCent += (preco - vendido) * qtd;
      rows.push({ pecaId: p.id, quantidade: qtd, precoOriginal: preco / 100, descontoPercent: Number(ja.descontoPercent), descontoReais: Number(ja.descontoReais), precoVendido: vendido / 100, subtotal: vendido * qtd / 100, observacao: ja.observacao });
      continue;
    }
    const preco = centavos(String(p.precoVenda));
    if (preco <= 0) throw new OperacaoErro(`Peca sem preco: ${p.nome}`);
    const pct = Number(i.descontoPercent ?? 0);
    const reais = centavos(i.descontoReais ?? i.desconto ?? 0);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100 || reais < 0) throw new OperacaoErro('Desconto invalido');
    if ((pct || reais) && s.role !== 'DONO') throw new OperacaoErro('Desconto requer autorizacao da administracao', 403);
    const desc = Math.round(preco * pct / 100) + reais;
    if (desc >= preco) throw new OperacaoErro('Desconto deve ser menor que o preco');
    subtotalCent += preco * qtd; descontoCent += desc * qtd;
    rows.push({ pecaId: p.id, quantidade: qtd, precoOriginal: preco / 100, descontoPercent: pct, descontoReais: reais / 100, precoVendido: (preco - desc) / 100, subtotal: (preco - desc) * qtd / 100, observacao: typeof i.observacao === 'string' ? i.observacao.slice(0, 1000) : null });
  }
  const linhas: { nome: string; valor: number }[] = [];
  const mantidos = new Set<string>();
  for (const item of servicos) {
    if (item?.id) {
      const ja = opcoes.anterior?.servicos.find(a => a.id === item.id);
      if (!ja || mantidos.has(ja.id)) throw new OperacaoErro('Servico invalido ou repetido');
      mantidos.add(ja.id);
      const valor = centavos(String(ja.valor));
      linhas.push({ nome: ja.nome, valor: valor / 100 });
      subtotalCent += valor;
      continue;
    }
    const tabelado = item?.servicoTabeladoId ? await tx.servicoTabelado.findUnique({ where: { id: String(item.servicoTabeladoId) } }) : null;
    if (item?.servicoTabeladoId && !tabelado?.ativo) throw new OperacaoErro('Servico indisponivel');
    const nome = String(tabelado?.nome ?? item?.nome ?? '').trim().slice(0, 150);
    const valor = centavos(tabelado ? String(tabelado.valor) : item?.valor);
    if (!nome || valor <= 0) throw new OperacaoErro('Informe descricao e valor do servico');
    linhas.push({ nome, valor: valor / 100 });
    subtotalCent += valor;
  }
  return { rows, linhas, subtotalCent, descontoCent };
}
/** Momento em que o pedido entrou na fila do Caixa (OS do Atendimento: ao ser finalizada). */
function entradaCaixa(p: { status: string; createdAt: Date; historico?: { tipo: string; createdAt: Date }[] }) {
  if (p.status === 'ABERTO') return null;
  return p.historico?.find(h => h.tipo === 'ENVIADO_CAIXA')?.createdAt ?? p.createdAt;
}
const texto = (v: unknown, max: number) => typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
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
    const proprio = !podeReceber(s);
    if (proprio) where.criadoPorId = s!.id;
    const autor = proprio ? Prisma.sql`AND p."criadoPorId" = ${s!.id}` : Prisma.empty;
    const codigo = req.nextUrl.searchParams.get('codigo');
    const status = req.nextUrl.searchParams.get('status');
    // Ordem fixa vinda do banco (fila do Caixa, busca por código ou lista de OS).
    let ordem: string[] | null = null;
    if (req.nextUrl.searchParams.get('os') === '1') {
      // Aba "Ordens de Serviço" do Atendimento: OS abertas no Atendimento (mais recentes primeiro).
      const filtro = status && status !== 'TODOS' ? Prisma.sql`AND p.status = ${status}` : Prisma.sql`AND p.status <> 'CANCELADO'`;
      const linhas = await prisma.$queryRaw<{ id: string }[]>`SELECT p.id FROM "Pedido" p JOIN "OrdemServico" o ON o.id = p."ordemServicoId" WHERE p.origem = 'ATENDIMENTO' AND o."tipoServico" = 'ORDEM_SERVICO' ${filtro} ${autor} ORDER BY p."createdAt" DESC, p.numero DESC LIMIT 60`;
      ordem = linhas.map(r => r.id);
    } else if (codigo) {
      const consulta = lerCodigoPedido(codigo);
      if (!consulta) throw new OperacaoErro('Codigo de pedido invalido');
      // Código completo: igualdade. Número puro (6709, 709, 09): últimos dígitos do código atual ou,
      // nos pedidos antigos, do número interno. Vários resultados: o caixa escolhe na lista.
      // OS ainda aberta no Atendimento não aparece (só entra no Caixa depois de finalizada).
      const n = consulta.numero, sufixo = '%' + consulta.digitos;
      const condicao = consulta.exato
        ? Prisma.sql`(p."codigoNumero" = ${n} OR (p."codigoNumero" IS NULL AND p.numero = ${n}))`
        : Prisma.sql`(p."codigoNumero"::text LIKE ${sufixo} OR (p."codigoNumero" IS NULL AND p.numero::text LIKE ${sufixo}))`;
      const linhas = await prisma.$queryRaw<{ id: string }[]>`SELECT p.id FROM "Pedido" p WHERE ${condicao} AND NOT (p.status = 'ABERTO' AND p.origem = 'ATENDIMENTO') ${autor}
        ORDER BY (p.status = 'AGUARDANDO_PAGAMENTO') DESC, (COALESCE(p."codigoNumero", p.numero) = ${n}) DESC, p."createdAt" DESC, p.numero DESC LIMIT 20`;
      ordem = linhas.map(r => r.id);
    } else if (status === 'AGUARDANDO_PAGAMENTO') {
      // Fila do Caixa por ordem de chegada: venda direta entra ao ser criada; OS do Atendimento ao ser
      // finalizada (histórico ENVIADO_CAIXA). Empate resolvido pelo número interno (único).
      const linhas = await prisma.$queryRaw<{ id: string }[]>`SELECT p.id FROM "Pedido" p
        LEFT JOIN LATERAL (SELECT MAX(h."createdAt") AS em FROM "HistoricoPedido" h WHERE h."pedidoId" = p.id AND h.tipo = 'ENVIADO_CAIXA') e ON true
        WHERE p.status = 'AGUARDANDO_PAGAMENTO' ${autor} ORDER BY COALESCE(e.em, p."createdAt") ASC, p.numero ASC LIMIT 200`;
      ordem = linhas.map(r => r.id);
    } else {
      where.status = status === 'TODOS' ? undefined : status || { in: PENDENTES };
    }
    if (ordem) where.id = { in: ordem };
    const tipo = req.nextUrl.searchParams.get('tipo');
    if (tipo) where.tipo = tipo;
    const pedidos = await prisma.pedido.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: ordem ? 200 : 50 });
    if (ordem) { const pos = new Map(ordem.map((id, i) => [id, i])); pedidos.sort((a, b) => pos.get(a.id)! - pos.get(b.id)!); }
    return NextResponse.json((await comServicos(pedidos)).map(p => ({ ...p, codigo: codigoPedido(p), entradaCaixa: entradaCaixa(p) })));
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
      let manterAberta = false;
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
        // "Abrir Ordem de Serviço": mesma OS do módulo de Ordens, com dados da moto e do problema.
        // Com manterAberta a OS fica em aberto no Atendimento (pedido ABERTO, fora do Caixa) até "Finalizar OS".
        const abrirOS = b.os && typeof b.os === 'object' ? b.os : null;
        manterAberta = !!abrirOS && b.manterAberta === true;
        const calculo = await calcularLinhas(tx, s!, b.itens, b.servicos, { permitirVazio: manterAberta });
        rows = calculo.rows; subtotalCent = calculo.subtotalCent; descontoCent = calculo.descontoCent;
        const linhas = calculo.linhas;
        if (abrirOS && (!texto(clienteNome, 150) || !texto(clienteTelefone, 30) || !texto(b.moto, 150))) throw new OperacaoErro('Para abrir a OS informe cliente, telefone e modelo da moto');
        if (linhas.length || abrirOS) {
          // Reaproveita OS e ServicoOrdem; as peças seguem no pedido e baixam estoque só no pagamento
          // (não viram ItemOS, que baixaria o estoque uma segunda vez).
          const maoDeObra = linhas.reduce((n, l) => n + Math.round(l.valor * 100), 0) / 100;
          const solicitados = abrirOS ? texto(abrirOS.servicosSolicitados, 2000) : null;
          const os = await tx.ordemServico.create({ data: {
            nomeCliente: texto(clienteNome, 150) || 'Cliente balcao', telefoneCliente: texto(clienteTelefone, 30) || '', modeloMoto: texto(b.moto, 150) || 'Nao informado',
            tipoServico: abrirOS ? 'ORDEM_SERVICO' : 'ATENDIMENTO', balcaoId: s!.id, valorMaoDeObra: maoDeObra, valorTotal: maoDeObra, servicos: { create: linhas },
            ...(abrirOS ? { placaMoto: texto(abrirOS.placa, 10)?.toUpperCase() || null, anoMoto: texto(abrirOS.ano, 10), kmAtual: texto(abrirOS.km, 20), descricaoProblema: texto(abrirOS.problema, 2000), observacoes: [solicitados && `Serviços solicitados: ${solicitados}`, rows.length ? `Peças no pedido (baixa no pagamento): ${rows.length} item(ns)` : null].filter(Boolean).join('\n') || null } : {}),
          } });
          if (abrirOS) await tx.historicoOS.create({ data: { ordemServicoId: os.id, tipo: 'CRIACAO', descricao: `OS #${os.numero} aberta no Atendimento para ${os.nomeCliente} — ${os.modeloMoto}`, usuario: s!.name, usuarioId: s!.id } });
          ordemServicoId = os.id;
        }
      }
      if (!manterAberta && subtotalCent - descontoCent <= 0) throw new OperacaoErro('Pedido sem valor');
      return tx.pedido.create({ data: {
        tipo, origem: tipo === 'ORDEM_SERVICO' ? 'ORDEM_SERVICO' : 'ATENDIMENTO',
        ordemServicoId,
        clienteNome, clienteTelefone, clienteCpf: b.clienteCpf || null,
        observacoes: typeof b.observacoes === 'string' ? b.observacoes.slice(0, 2000) : null,
        subtotal: subtotalCent / 100, descontoTotal: descontoCent / 100, total: (subtotalCent - descontoCent) / 100,
        status: manterAberta ? 'ABERTO' : 'AGUARDANDO_PAGAMENTO', criadoPor: s!.name, criadoPorId: s!.id,
        itens: { create: rows }, historico: { create: manterAberta
          ? { tipo: 'OS_ABERTA', descricao: 'OS aberta no Atendimento; ainda nao enviada ao caixa', usuario: s!.name, usuarioId: s!.id }
          : { tipo: 'CRIADO', descricao: 'Pedido salvo; aguardando pagamento no caixa', usuario: s!.name, usuarioId: s!.id } },
      }, include });
    }, { maxWait: 10000, timeout: 15000 });
    const [salvo] = await comServicos([pedido]);
    return NextResponse.json({ ...salvo, codigo: codigoPedido(pedido) }, { status: 201 });
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
      // OS em aberto do Atendimento só vai ao Caixa por "Finalizar OS" (PATCH), que recalcula o total.
      if (atual.origem === 'ATENDIMENTO' && atual.status === 'ABERTO' && b.status && b.status !== 'CANCELADO') throw new OperacaoErro('Use Finalizar OS para enviar ao Caixa', 409);
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
    return NextResponse.json({ ...salvo, codigo: codigoPedido(pedido) });
  } catch (e) { return erro(e); }
}
/**
 * OS em aberto no Atendimento.
 *  • acao SALVAR: substitui peças e serviços da mesma OS (pedido continua ABERTO, fora do Caixa).
 *  • acao FINALIZAR: grava os itens enviados (se houver), recalcula o total e encaminha ao Caixa
 *    (AGUARDANDO_PAGAMENTO). Depois disso alterações comuns ficam bloqueadas.
 * O pedido e a OS ficam travados (FOR UPDATE): duas finalizações simultâneas não passam.
 */
export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!podeAtender(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    const b = await req.json();
    if (typeof b.id !== 'string' || !b.id) throw new OperacaoErro('Pedido obrigatorio');
    if (!['SALVAR', 'FINALIZAR'].includes(b.acao)) throw new OperacaoErro('Acao invalida');
    const finalizar = b.acao === 'FINALIZAR';
    const pedido = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Pedido" WHERE id = ${b.id} FOR UPDATE`;
      const atual = await tx.pedido.findUnique({ where: { id: b.id }, include: { itens: true } });
      if (!atual) throw new OperacaoErro('OS nao encontrada', 404);
      if (s!.role !== 'DONO' && atual.criadoPorId !== s!.id) throw new OperacaoErro('Nao autorizado', 403);
      if (atual.origem !== 'ATENDIMENTO' || !atual.ordemServicoId) throw new OperacaoErro('Pedido nao e uma OS do Atendimento', 409);
      if (atual.status === 'AGUARDANDO_PAGAMENTO') throw new OperacaoErro('OS ja finalizada e enviada ao Caixa. Alteracoes bloqueadas.', 409);
      if (atual.status === 'PAGO') throw new OperacaoErro('OS ja paga e encerrada', 409);
      if (atual.status !== 'ABERTO') throw new OperacaoErro('OS encerrada nao pode ser alterada', 409);
      await tx.$queryRaw`SELECT id FROM "OrdemServico" WHERE id = ${atual.ordemServicoId} FOR UPDATE`;
      const os = await tx.ordemServico.findUnique({ where: { id: atual.ordemServicoId }, include: { servicos: true } });
      if (!os || os.tipoServico !== 'ORDEM_SERVICO' || os.status === 'CANCELADA') throw new OperacaoErro('OS indisponivel', 409);
      if (['PAGO', 'PAGA'].includes(os.statusPagamento || '')) throw new OperacaoErro('OS ja paga', 409);

      let subtotalCent = centavos(String(atual.subtotal)), descontoCent = centavos(String(atual.descontoTotal));
      let quantidadePecas = atual.itens.length;
      const alterar = Array.isArray(b.itens) || Array.isArray(b.servicos);
      if (alterar) {
        const calc = await calcularLinhas(tx, s!, Array.isArray(b.itens) ? b.itens : atual.itens.map(i => ({ pecaId: i.pecaId, quantidade: i.quantidade })), Array.isArray(b.servicos) ? b.servicos : os.servicos.map(x => ({ id: x.id })), { permitirVazio: true, anterior: { itens: atual.itens, servicos: os.servicos } });
        subtotalCent = calc.subtotalCent; descontoCent = calc.descontoCent; quantidadePecas = calc.rows.length;
        await tx.pedidoItem.deleteMany({ where: { pedidoId: atual.id } });
        if (calc.rows.length) await tx.pedidoItem.createMany({ data: calc.rows.map(r => ({ ...r, pedidoId: atual.id })) });
        await tx.servicoOrdem.deleteMany({ where: { ordemServicoId: os.id } });
        if (calc.linhas.length) await tx.servicoOrdem.createMany({ data: calc.linhas.map(l => ({ ...l, ordemServicoId: os.id })) });
        const maoDeObra = calc.linhas.reduce((n, l) => n + Math.round(l.valor * 100), 0) / 100;
        const obs = [...(os.observacoes || '').split('\n').filter(l => l && !l.startsWith('Peças no pedido')), quantidadePecas ? `Peças no pedido (baixa no pagamento): ${quantidadePecas} item(ns)` : null].filter(Boolean).join('\n') || null;
        await tx.ordemServico.update({ where: { id: os.id }, data: { valorMaoDeObra: maoDeObra, valorTotal: maoDeObra, observacoes: obs } });
      }
      const total = subtotalCent - descontoCent;
      if (finalizar && total <= 0) throw new OperacaoErro('Adicione pecas ou servicos antes de finalizar a OS');
      if (finalizar) {
        await tx.ordemServico.update({ where: { id: os.id }, data: { status: 'PRONTA', statusPagamento: 'AGUARDANDO_PAGAMENTO', finalizadoEm: new Date(), finalizadoPor: s!.name } });
        await tx.historicoOS.create({ data: { ordemServicoId: os.id, tipo: 'FINALIZADA', descricao: `OS #${os.numero} finalizada no Atendimento e enviada ao Caixa (${(total / 100).toFixed(2)})`, usuario: s!.name, usuarioId: s!.id } });
      }
      await tx.historicoPedido.create({ data: { pedidoId: atual.id, tipo: finalizar ? 'ENVIADO_CAIXA' : 'OS_ATUALIZADA', usuario: s!.name, usuarioId: s!.id, descricao: finalizar ? 'OS finalizada; aguardando pagamento no caixa' : 'Itens da OS atualizados' } });
      return tx.pedido.update({ where: { id: atual.id }, data: { subtotal: subtotalCent / 100, descontoTotal: descontoCent / 100, total: total / 100, ...(finalizar ? { status: 'AGUARDANDO_PAGAMENTO' } : {}) }, include });
    }, { maxWait: 10000, timeout: 15000 });
    const [salvo] = await comServicos([pedido]);
    return NextResponse.json({ ...salvo, codigo: codigoPedido(pedido), entradaCaixa: entradaCaixa(pedido) });
  } catch (e) { return erro(e); }
}
