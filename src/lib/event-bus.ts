// FASE 15-J: Central de Eventos — Event Bus unificado
// Arquitetura: evento → Event Bus → regras → notificações → canais

import prisma from '@/lib/prisma';

// ─── Tipos ───────────────────────────────────────────────

export type TipoEvento =
  | 'VENDA_CRIADA' | 'VENDA_PAGA' | 'VENDA_CANCELADA'
  | 'PEDIDO_CRIADO' | 'PEDIDO_EM_SEPARACAO' | 'PEDIDO_PRONTO_RETIRADA' | 'PEDIDO_RETIRADO' | 'PEDIDO_CANCELADO'
  | 'OS_CRIADA' | 'OS_ATUALIZADA' | 'OS_ATRASADA' | 'OS_PRONTA' | 'OS_FINALIZADA' | 'OS_PAGA'
  | 'ESTOQUE_CRITICO' | 'ESTOQUE_ZERADO' | 'TRANSFERENCIA_PENDENTE' | 'TRANSFERENCIA_CONCLUIDA'
  | 'FINANCEIRO_CONTA_VENCENDO' | 'FINANCEIRO_CONTA_VENCIDA' | 'FINANCEIRO_PAGAMENTO_RECEBIDO'
  | 'GARANTIA_PROXIMA_VENCIMENTO' | 'REVISAO_PROXIMA'
  | 'USUARIO_ACAO_IMPORTANTE' | 'SISTEMA_ALERTA' | 'MENSAGEM_RECEBIDA'
  | 'CLIENTE_CADASTRADO' | 'CUPOM_USADO' | 'PRODUTO_NOVO' | 'RESUMO_DIARIO';

export type OrigemEvento = 'VITRINE' | 'PDV' | 'OFICINA' | 'ESTOQUE' | 'FINANCEIRO' | 'SISTEMA' | 'MANUAL';

export type Prioridade = 'BAIXA' | 'NORMAL' | 'ALTA' | 'CRITICA';

export interface EventoPayload {
  tipo: TipoEvento;
  origem: OrigemEvento;
  entidadeTipo: string;
  entidadeId?: string;
  usuarioId?: string;
  payload?: Record<string, any>;
}

export interface RegraNotificacao {
  tipoEvento: TipoEvento;
  titulo: string | ((payload: EventoPayload) => string);
  mensagem: string | ((payload: EventoPayload) => string);
  prioridade: Prioridade;
  urlDestino?: string | ((payload: EventoPayload) => string);
  tipoNotificacao: string;
  icone?: string;
  papeis: string[]; // roles que recebem
}

// ─── Regras de Notificação ──────────────────────────────

export const REGRAS_NOTIFICACAO: RegraNotificacao[] = [
  // Pedidos Vitrine
  {
    tipoEvento: 'PEDIDO_CRIADO',
    titulo: 'Novo pedido da vitrine',
    mensagem: (p) => `Pedido #${(p.payload as any)?.numero || '—'} aguardando separação.`,
    prioridade: 'ALTA',
    urlDestino: (p) => `/dono/pedidos-loja`,
    tipoNotificacao: 'PEDIDO',
    icone: '🛒',
    papeis: ['DONO', 'BALCAO'],
  },
  {
    tipoEvento: 'PEDIDO_EM_SEPARACAO',
    titulo: 'Pedido em separação',
    mensagem: (p) => `Pedido #${(p.payload as any)?.numero || '—'} está sendo separado.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/pedidos-loja`,
    tipoNotificacao: 'PEDIDO',
    icone: '📦',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'PEDIDO_PRONTO_RETIRADA',
    titulo: 'Pedido pronto para retirada',
    mensagem: (p) => `Pedido #${(p.payload as any)?.numero || '—'} está pronto. Cliente será notificado.`,
    prioridade: 'ALTA',
    urlDestino: (p) => `/dono/pedidos-loja`,
    tipoNotificacao: 'PEDIDO',
    icone: '✅',
    papeis: ['DONO', 'BALCAO'],
  },
  {
    tipoEvento: 'PEDIDO_RETIRADO',
    titulo: 'Pedido retirado',
    mensagem: (p) => `Pedido #${(p.payload as any)?.numero || '—'} foi retirado pelo cliente.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/pedidos-loja`,
    tipoNotificacao: 'PEDIDO',
    icone: '🏍️',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'PEDIDO_CANCELADO',
    titulo: 'Pedido cancelado',
    mensagem: (p) => `Pedido #${(p.payload as any)?.numero || '—'} foi cancelado.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/pedidos-loja`,
    tipoNotificacao: 'PEDIDO',
    icone: '❌',
    papeis: ['DONO'],
  },
  // Vendas
  {
    tipoEvento: 'VENDA_CRIADA',
    titulo: 'Nova venda realizada',
    mensagem: (p) => `Venda #${(p.payload as any)?.numero || '—'} — ${(p.payload as any)?.total ? `R$ ${Number((p.payload as any).total).toFixed(2)}` : ''}`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/financeiro`,
    tipoNotificacao: 'VENDA',
    icone: '💰',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'VENDA_PAGA',
    titulo: 'Pagamento recebido',
    mensagem: (p) => `Pagamento da Venda #${(p.payload as any)?.numero || '—'} confirmado.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/financeiro`,
    tipoNotificacao: 'VENDA',
    icone: '💳',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'VENDA_CANCELADA',
    titulo: 'Venda cancelada',
    mensagem: (p) => `Venda #${(p.payload as any)?.numero || '—'} foi cancelada.`,
    prioridade: 'ALTA',
    urlDestino: (p) => `/dono/financeiro`,
    tipoNotificacao: 'VENDA',
    icone: '⚠️',
    papeis: ['DONO'],
  },
  // Oficina
  {
    tipoEvento: 'OS_CRIADA',
    titulo: 'Nova OS registrada',
    mensagem: (p) => `OS #${(p.payload as any)?.numero || '—'} — ${(p.payload as any)?.nomeCliente || 'Cliente'}`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/balcao/oficina`,
    tipoNotificacao: 'OS',
    icone: '🔧',
    papeis: ['DONO', 'BALCAO'],
  },
  {
    tipoEvento: 'OS_ATRASADA',
    titulo: 'OS atrasada',
    mensagem: (p) => `OS #${(p.payload as any)?.numero || '—'} ultrapassou a previsão de entrega.`,
    prioridade: 'ALTA',
    urlDestino: (p) => `/balcao/oficina`,
    tipoNotificacao: 'OS',
    icone: '⏰',
    papeis: ['DONO', 'BALCAO'],
  },
  {
    tipoEvento: 'OS_PRONTA',
    titulo: 'OS pronta para entrega',
    mensagem: (p) => `OS #${(p.payload as any)?.numero || '—'} está pronta.`,
    prioridade: 'ALTA',
    urlDestino: (p) => `/balcao/oficina`,
    tipoNotificacao: 'OS',
    icone: '✅',
    papeis: ['DONO', 'BALCAO'],
  },
  {
    tipoEvento: 'OS_FINALIZADA',
    titulo: 'OS finalizada',
    mensagem: (p) => `OS #${(p.payload as any)?.numero || '—'} foi finalizada e entregue.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/financeiro`,
    tipoNotificacao: 'OS',
    icone: '🏁',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'OS_PAGA',
    titulo: 'OS paga',
    mensagem: (p) => `Pagamento da OS #${(p.payload as any)?.numero || '—'} recebido.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/financeiro`,
    tipoNotificacao: 'OS',
    icone: '💵',
    papeis: ['DONO'],
  },
  // Estoque
  {
    tipoEvento: 'ESTOQUE_CRITICO',
    titulo: 'Estoque crítico',
    mensagem: (p) => `"${(p.payload as any)?.nomePeca || 'Peça'}" atingiu o estoque mínimo (${(p.payload as any)?.quantidade || 0} un.).`,
    prioridade: 'ALTA',
    urlDestino: (p) => `/estoque`,
    tipoNotificacao: 'ESTOQUE',
    icone: '📉',
    papeis: ['DONO', 'ESTOQUE'],
  },
  {
    tipoEvento: 'ESTOQUE_ZERADO',
    titulo: 'Estoque zerado',
    mensagem: (p) => `"${(p.payload as any)?.nomePeca || 'Peça'}" está sem estoque.`,
    prioridade: 'CRITICA',
    urlDestino: (p) => `/estoque`,
    tipoNotificacao: 'ESTOQUE',
    icone: '🚨',
    papeis: ['DONO', 'ESTOQUE', 'BALCAO'],
  },
  {
    tipoEvento: 'TRANSFERENCIA_PENDENTE',
    titulo: 'Transferência pendente',
    mensagem: (p) => `Transferência de "${(p.payload as any)?.nomePeca || 'Peça'}" aguardando conclusão.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/estoque/transferencia`,
    tipoNotificacao: 'TRANSFERENCIA',
    icone: '🔄',
    papeis: ['DONO', 'ESTOQUE'],
  },
  {
    tipoEvento: 'TRANSFERENCIA_CONCLUIDA',
    titulo: 'Transferência concluída',
    mensagem: (p) => `Transferência de "${(p.payload as any)?.nomePeca || 'Peça'}" concluída com sucesso.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/estoque/transferencia`,
    tipoNotificacao: 'TRANSFERENCIA',
    icone: '✅',
    papeis: ['DONO', 'ESTOQUE'],
  },
  // Financeiro
  {
    tipoEvento: 'FINANCEIRO_CONTA_VENCENDO',
    titulo: 'Conta vencendo',
    mensagem: (p) => `"${(p.payload as any)?.descricao || 'Conta'}" vence ${(p.payload as any)?.dataFormatada || 'hoje'}.`,
    prioridade: 'ALTA',
    urlDestino: (p) => `/dono/financeiro`,
    tipoNotificacao: 'FINANCEIRO',
    icone: '📅',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'FINANCEIRO_CONTA_VENCIDA',
    titulo: 'Conta vencida',
    mensagem: (p) => `"${(p.payload as any)?.descricao || 'Conta'}" está vencida.`,
    prioridade: 'CRITICA',
    urlDestino: (p) => `/dono/financeiro`,
    tipoNotificacao: 'FINANCEIRO',
    icone: '🔴',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'FINANCEIRO_PAGAMENTO_RECEBIDO',
    titulo: 'Pagamento recebido',
    mensagem: (p) => `Recebimento de R$ ${Number((p.payload as any)?.valor || 0).toFixed(2)} registrado.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/financeiro`,
    tipoNotificacao: 'FINANCEIRO',
    icone: '✅',
    papeis: ['DONO'],
  },
  // Garantias / Revisões
  {
    tipoEvento: 'GARANTIA_PROXIMA_VENCIMENTO',
    titulo: 'Garantia próxima do vencimento',
    mensagem: (p) => `Garantia de "${(p.payload as any)?.nomePeca || 'produto'}" expira em breve.`,
    prioridade: 'BAIXA',
    urlDestino: (p) => `/dono/vitrine`,
    tipoNotificacao: 'GARANTIA',
    icone: '⏳',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'REVISAO_PROXIMA',
    titulo: 'Revisão agendada próxima',
    mensagem: (p) => `Revisão de veículo agendada para breve.`,
    prioridade: 'BAIXA',
    urlDestino: (p) => `/balcao/oficina`,
    tipoNotificacao: 'REVISAO',
    icone: '📋',
    papeis: ['DONO', 'BALCAO'],
  },
  // Sistema
  {
    tipoEvento: 'CLIENTE_CADASTRADO',
    titulo: 'Novo cliente cadastrado',
    mensagem: (p) => `"${(p.payload as any)?.nome || 'Cliente'}" se cadastrou no portal.`,
    prioridade: 'BAIXA',
    urlDestino: undefined,
    tipoNotificacao: 'SISTEMA',
    icone: '👤',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'CUPOM_USADO',
    titulo: 'Cupom utilizado',
    mensagem: (p) => `Cupom "${(p.payload as any)?.codigo || '—'}" foi utilizado.`,
    prioridade: 'BAIXA',
    urlDestino: (p) => `/dono/vitrine`,
    tipoNotificacao: 'SISTEMA',
    icone: '🎫',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'PRODUTO_NOVO',
    titulo: 'Novo produto cadastrado',
    mensagem: (p) => `"${(p.payload as any)?.nome || 'Produto'}" foi adicionado ao catálogo.`,
    prioridade: 'BAIXA',
    urlDestino: (p) => `/estoque`,
    tipoNotificacao: 'SISTEMA',
    icone: '🆕',
    papeis: ['DONO', 'ESTOQUE'],
  },
  {
    tipoEvento: 'SISTEMA_ALERTA',
    titulo: 'Alerta do sistema',
    mensagem: (p) => (p.payload as any)?.mensagem || 'Alerta gerado pelo sistema.',
    prioridade: 'NORMAL',
    urlDestino: undefined,
    tipoNotificacao: 'SISTEMA',
    icone: '⚙️',
    papeis: ['DONO'],
  },
  {
    tipoEvento: 'MENSAGEM_RECEBIDA',
    titulo: 'Nova mensagem',
    mensagem: (p) => `"${(p.payload as any)?.remetenteNome || 'Usuário'}" enviou uma mensagem.`,
    prioridade: 'NORMAL',
    urlDestino: (p) => `/dono/notificacoes`,
    tipoNotificacao: 'MENSAGEM',
    icone: '💬',
    papeis: ['DONO', 'BALCAO'],
  },
];

// ─── Core: Emitir Evento ─────────────────────────────────

export async function emitEvent(evento: EventoPayload): Promise<string | null> {
  try {
    // 1. Salvar EventoSistema
    const evt = await prisma.eventoSistema.create({
      data: {
        tipo: evento.tipo,
        origem: evento.origem,
        entidadeTipo: evento.entidadeTipo,
        entidadeId: evento.entidadeId || null,
        usuarioId: evento.usuarioId || null,
        payload: evento.payload ? JSON.stringify(evento.payload) : null,
      },
    });

    // 2. Processar notificações (assíncrono — não bloqueia a resposta)
    processEvent(evt.id).catch(err => {
      console.error('[EventBus] Erro ao processar evento:', err);
    });

    return evt.id;
  } catch (err) {
    console.error('[EventBus] Erro ao emitir evento:', err);
    return null;
  }
}

// ─── Processar Evento → Notificações ─────────────────────

export async function processEvent(eventoId: string): Promise<void> {
  const evento = await prisma.eventoSistema.findUnique({ where: { id: eventoId } });
  if (!evento) return;

  const payload: EventoPayload = {
    tipo: evento.tipo as TipoEvento,
    origem: evento.origem as OrigemEvento,
    entidadeTipo: evento.entidadeTipo,
    entidadeId: evento.entidadeId || undefined,
    usuarioId: evento.usuarioId || undefined,
    payload: evento.payload ? JSON.parse(evento.payload) : undefined,
  };

  // Encontrar regras aplicáveis
  const regras = REGRAS_NOTIFICACAO.filter(r => r.tipoEvento === payload.tipo);
  if (regras.length === 0) return;

  for (const regra of regras) {
    const titulo = typeof regra.titulo === 'function' ? regra.titulo(payload) : regra.titulo;
    const mensagem = typeof regra.mensagem === 'function' ? regra.mensagem(payload) : regra.mensagem;
    const urlDestino = typeof regra.urlDestino === 'function' ? regra.urlDestino(payload) : regra.urlDestino;

    // Buscar usuários que devem receber (por role)
    const usuarios = await prisma.user.findMany({
      where: {
        role: { in: regra.papeis as any[] },
        active: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const u of usuarios) {
      // Verificar configuração de notificação do usuário
      const config = await prisma.configuracaoNotificacao.findUnique({
        where: { usuarioId: u.id },
      });

      // Se não tem config, criar com defaults (permissivo)
      if (!config) {
        await createNotification(u.id, titulo, mensagem, regra.prioridade as Prioridade, urlDestino, regra.tipoNotificacao, payload.entidadeId, payload.entidadeTipo, regra.icone);
        continue;
      }

      // Verificar se categoria está habilitada
      const categoriaMap: Record<string, keyof typeof config> = {
        PEDIDO: 'pedidos',
        VENDA: 'vendas',
        OS: 'oficina',
        ESTOQUE: 'estoque',
        FINANCEIRO: 'financeiro',
        GARANTIA: 'sistema',
        REVISAO: 'oficina',
        SISTEMA: 'sistema',
        MENSAGEM: 'mensagens',
        TRANSFERENCIA: 'estoque',
      };

      const campo = categoriaMap[regra.tipoNotificacao] || 'sistema';
      if (config[campo as keyof typeof config] && config.interno) {
        await createNotification(u.id, titulo, mensagem, regra.prioridade as Prioridade, urlDestino, regra.tipoNotificacao, payload.entidadeId, payload.entidadeTipo, regra.icone);
      }
    }
  }

  // Marcar evento como processado
  await prisma.eventoSistema.update({
    where: { id: eventoId },
    data: { processado: true, processadoEm: new Date() },
  });
}

// ─── Criar Notificação para um usuário ────────────────────

export async function createNotification(
  usuarioId: string,
  titulo: string,
  mensagem: string,
  prioridade: Prioridade = 'NORMAL',
  urlDestino?: string | null,
  tipo: string = 'SISTEMA',
  entidadeId?: string | null,
  entidadeTipo?: string | null,
  icone?: string | null,
): Promise<void> {
  try {
    await prisma.notificacao.create({
      data: {
        usuarioId,
        tipo,
        titulo,
        mensagem,
        prioridade,
        urlDestino: urlDestino || null,
        entidadeTipo: entidadeTipo || null,
        entidadeId: entidadeId || null,
        icone: icone || null,
      },
    });
  } catch (err) {
    console.error('[EventBus] Erro ao criar notificação:', err);
  }
}

// ─── Notificar todos de uma role ──────────────────────────

export async function notifyRole(
  role: string,
  titulo: string,
  mensagem: string,
  prioridade: Prioridade = 'NORMAL',
  urlDestino?: string,
  tipo: string = 'SISTEMA',
): Promise<void> {
  const usuarios = await prisma.user.findMany({
    where: { role: role as any, active: true, deletedAt: null },
    select: { id: true },
  });

  for (const u of usuarios) {
    await createNotification(u.id, titulo, mensagem, prioridade, urlDestino, tipo);
  }
}

// ─── Processar fila de eventos pendentes ──────────────────

export async function processarFilaPendente(): Promise<number> {
  const pendentes = await prisma.eventoSistema.findMany({
    where: { processado: false },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  for (const evt of pendentes) {
    await processEvent(evt.id);
  }

  return pendentes.length;
}
