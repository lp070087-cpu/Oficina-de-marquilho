# RELATÓRIO TÉCNICO — FASE 15-J: CENTRAL DE AUTOMAÇÃO, NOTIFICAÇÕES E COMUNICAÇÃO

**Data:** 2026-07-28
**Versão:** 1.0
**Status:** Concluído
**Dependências:** FASE 15-I (Portal do Cliente)

---

## 1. ESCOPO DA FASE

Criar um sistema centralizado de notificações, eventos e comunicação interna conectando todos os módulos do ERP (DONA, BALCÃO, ESTOQUE, OFICINA, CLIENTE, VITRINE). O sistema utiliza arquitetura pub/sub com Event Bus, 6 modelos Prisma, 10+ endpoints de API, 8 componentes React e integração com APIs existentes via `emitEvent()`.

### 1.1 Requisitos Atendidos

| # | Requisito | Status |
|---|-----------|--------|
| 1 | 6 modelos Prisma (Notificacao, EventoSistema, MensagemInterna, ConfiguracaoNotificacao, LembreteSistema, FilaProcessamento) | ✅ |
| 2 | Event Bus com arquitetura pub/sub | ✅ |
| 3 | 25+ regras de notificação mapeando TipoEvento → notificação | ✅ |
| 4 | API /api/notificacoes com filtros e paginação | ✅ |
| 5 | API /api/notificacoes/unread (contagem + últimas 3) | ✅ |
| 6 | API /api/notificacoes/[id] (marcar lida, excluir) | ✅ |
| 7 | API /api/notificacoes/read-all (marcar todas lidas) | ✅ |
| 8 | API /api/eventos (POST criar, GET listar com filtros) | ✅ |
| 9 | API /api/mensagens (GET listar, POST enviar) | ✅ |
| 10 | API /api/lembretes (GET listar, POST criar, PATCH, DELETE) | ✅ |
| 11 | API /api/configuracoes/notificacoes (GET/PATCH preferências) | ✅ |
| 12 | NotificationBell no Header com badge e dropdown | ✅ |
| 13 | NotificationCenter com 3 abas e filtros | ✅ |
| 14 | NotificationToast com sistema global de listeners | ✅ |
| 15 | TimelineEventos com visualização cronológica | ✅ |
| 16 | HistoricoEventos com tabela filtrável e paginada | ✅ |
| 17 | Sidebar: "Notificações" com badge + "Eventos do Sistema" | ✅ |
| 18 | Página /dono/notificacoes com métricas e central | ✅ |
| 19 | Página /dono/eventos com toggle tabela/timeline | ✅ |
| 20 | Integração com Vitrine Pedidos (criação + status) | ✅ |
| 21 | Integração com Vendas (VENDA_PAGA) | ✅ |
| 22 | Integração com Ordens de Serviço (criação + status) | ✅ |
| 23 | Preferências por usuário (ConfiguracaoNotificacao) | ✅ |
| 24 | 4 níveis de prioridade (BAIXA, NORMAL, ALTA, CRITICA) | ✅ |
| 25 | Zero alterações em módulos existentes — apenas adições | ✅ |

---

## 2. ARQUITETURA

### 2.1 Diagrama de Fluxo

```
Módulo (Vitrine/Vendas/Oficina/Estoque)
    │
    ├── emitEvent({ tipo, origem, entidadeTipo, entidadeId, payload })
    │       │
    │       ▼
    │   EventoSistema (salvo no banco)
    │       │
    │       ▼ (async)
    │   processEvent()
    │       │
    │       ├── Match REGRAS_NOTIFICACAO por TipoEvento
    │       ├── Check ConfiguracaoNotificacao por usuário
    │       └── Cria Notificacao para cada papel (role)
    │
    ▼
Notificação → NotificationBell (polling 30s) → NotificationCenter
```

### 2.2 Estrutura de Arquivos — 22 novos arquivos, 6 modificados

```
src/
├── lib/
│   └── event-bus.ts                          # NOVO — Central de Eventos
├── app/api/
│   ├── notificacoes/
│   │   ├── route.ts                          # NOVO — GET listar
│   │   ├── unread/route.ts                   # NOVO — GET contagem
│   │   ├── read-all/route.ts                 # NOVO — PATCH marcar todas
│   │   └── [id]/route.ts                     # NOVO — PATCH/DELETE
│   ├── eventos/
│   │   └── route.ts                          # NOVO — GET/POST
│   ├── mensagens/
│   │   ├── route.ts                          # NOVO — GET/POST
│   │   └── [id]/route.ts                     # NOVO — PATCH
│   ├── lembretes/
│   │   ├── route.ts                          # NOVO — GET/POST
│   │   └── [id]/route.ts                     # NOVO — PATCH/DELETE
│   └── configuracoes/notificacoes/
│       └── route.ts                          # NOVO — GET/PATCH
├── components/notificacoes/
│   ├── NotificationBell.tsx                  # NOVO — Sino + badge + dropdown
│   ├── NotificationCenter.tsx                # NOVO — Lista completa com abas
│   ├── NotificationCard.tsx                  # NOVO — Card individual
│   ├── NotificationToast.tsx                 # NOVO — Sistema de toast
│   ├── NotificationBadge.tsx                 # NOVO — Contador (99+)
│   ├── TimelineEventos.tsx                   # NOVO — Timeline vertical
│   ├── FiltroEventos.tsx                     # NOVO — Barra de filtros
│   └── HistoricoEventos.tsx                  # NOVO — Tabela com paginação
├── app/dono/
│   ├── notificacoes/page.tsx                 # NOVO — Central de Notificações
│   └── eventos/page.tsx                      # NOVO — Eventos do Sistema
└── prisma/
    └── schema.prisma                         # MODIFICADO — 6 modelos + relações
```

### 2.3 Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `prisma/schema.prisma` | 6 relações no model User + 6 novos models |
| `src/components/Sidebar.tsx` | useEffect + polling + 2 itens de menu com badge |
| `src/components/Header.tsx` | NotificationBell + títulos novas páginas |
| `src/app/api/vitrine/pedidos/route.ts` | import emitEvent + PEDIDO_CRIADO |
| `src/app/api/vitrine/pedidos/[id]/route.ts` | import emitEvent + status→evento |
| `src/app/api/vendas/route.ts` | import emitEvent + VENDA_PAGA |
| `src/app/api/ordens/route.ts` | import emitEvent + OS_CRIADA |
| `src/app/api/ordens/[id]/status/route.ts` | import emitEvent + OS_FINALIZADA/OS_PAGA |

---

## 3. MODELOS PRISMA

### 3.1 Relações adicionadas ao User

```prisma
notificacoes          Notificacao[]
eventos               EventoSistema[]
mensagensEnviadas     MensagemInterna[] @relation("Remetente")
mensagensRecebidas    MensagemInterna[] @relation("Destinatario")
configNotificacoes    ConfiguracaoNotificacao?
lembretes             LembreteSistema[]
```

### 3.2 Novos Modelos

**Notificacao** — Notificação individual para um usuário
- Campos: id, usuarioId, tipo, titulo, mensagem, detalhes (Json?), prioridade (BAIXA/NORMAL/ALTA/CRITICA), lida, lidaEm, urlDestino, entidadeTipo, entidadeId, icone, originadoEm, createdAt, updatedAt

**EventoSistema** — Registro de auditoria de cada evento disparado
- Campos: id, tipo, origem, entidadeTipo, entidadeId, usuarioId, payload (Json?), processado, processadoEm, createdAt

**MensagemInterna** — Comunicação entre usuários do sistema
- Campos: id, remetenteId, destinatarioId, assunto, mensagem, lida, lidaEm, createdAt

**ConfiguracaoNotificacao** — Preferências de notificação por usuário
- Campos: id, usuarioId (@unique), pedidos/vendas/oficina/estoque/financeiro/sistema/mensagens (Boolean, default true), interno/whatsapp/email/push (Boolean, default false), createdAt, updatedAt

**LembreteSistema** — Lembretes pessoais com data/hora
- Campos: id, usuarioId, titulo, descricao, dataHora, concluido, concluidoEm, entidadeTipo, entidadeId, createdAt

**FilaProcessamento** — Fila para reprocessamento de eventos falhos
- Campos: id, tipo, payload (Json?), status (PENDENTE/PROCESSANDO/CONCLUIDO/FALHA), tentativas (default 0), proximaTentativa, processadoEm, erro, createdAt

---

## 4. EVENT BUS (src/lib/event-bus.ts)

### 4.1 Tipos

```typescript
type TipoEvento = 28 valores literais
type OrigemEvento = 'VITRINE' | 'PDV' | 'OFICINA' | 'ESTOQUE' | 'FINANCEIRO' | 'SISTEMA' | 'MANUAL'
type Prioridade = 'BAIXA' | 'NORMAL' | 'ALTA' | 'CRITICA'
```

### 4.2 Funções Principais

- `emitEvent(evento)` — Cria EventoSistema + dispara processEvent() async
- `processEvent(eventoId)` — Match com REGRAS_NOTIFICACAO, respeita ConfiguracaoNotificacao, cria Notificacao
- `createNotification(usuarioId, titulo, mensagem, prioridade, urlDestino, tipo, entidadeId, entidadeTipo, icone)` — Inserção direta no banco
- `notifyRole(role, titulo, mensagem, prioridade, urlDestino, tipo)` — Notifica todos os usuários de um papel
- `processarFilaPendente()` — Reprocessa EventoSistema não processados

### 4.3 Regras de Notificação (25 regras)

| # | TipoEvento | Prioridade | Papéis |
|---|-----------|-----------|--------|
| 1 | PEDIDO_CRIADO | ALTA | DONO, BALCAO |
| 2 | PEDIDO_EM_SEPARACAO | NORMAL | DONO, BALCAO |
| 3 | PEDIDO_PRONTO_RETIRADA | ALTA | DONO, BALCAO |
| 4 | PEDIDO_RETIRADO | NORMAL | DONO, BALCAO |
| 5 | PEDIDO_CANCELADO | ALTA | DONO, BALCAO |
| 6 | VENDA_CRIADA | NORMAL | DONO |
| 7 | VENDA_PAGA | ALTA | DONO |
| 8 | VENDA_CANCELADA | ALTA | DONO |
| 9 | OS_CRIADA | NORMAL | DONO, BALCAO |
| 10 | OS_ATUALIZADA | NORMAL | DONO |
| 11 | OS_ATRASADA | ALTA | DONO, BALCAO |
| 12 | OS_PRONTA | ALTA | DONO, BALCAO |
| 13 | OS_FINALIZADA | NORMAL | DONO |
| 14 | OS_PAGA | ALTA | DONO |
| 15 | ESTOQUE_CRITICO | ALTA | DONO, ESTOQUE |
| 16 | ESTOQUE_ZERADO | CRITICA | DONO, ESTOQUE |
| 17 | TRANSFERENCIA_PENDENTE | NORMAL | ESTOQUE |
| 18 | TRANSFERENCIA_CONCLUIDA | NORMAL | DONO |
| 19 | FINANCEIRO_CONTA_VENCENDO | ALTA | DONO |
| 20 | FINANCEIRO_CONTA_VENCIDA | CRITICA | DONO |
| 21 | FINANCEIRO_PAGAMENTO_RECEBIDO | NORMAL | DONO |
| 22 | GARANTIA_PROXIMA_VENCIMENTO | NORMAL | DONO |
| 23 | REVISAO_PROXIMA | NORMAL | DONO |
| 24 | MENSAGEM_RECEBIDA | NORMAL | DONO, BALCAO, ESTOQUE |
| 25 | RESUMO_DIARIO | BAIXA | DONO |

---

## 5. ENDPOINTS DE API

### 5.1 Notificações

**GET /api/notificacoes**
- Auth: getSession() (DONO, BALCAO, ESTOQUE)
- Query: `?filtro=todas|naoLidas|lidas&prioridade=ALTA&tipo=pedido&page=1&limit=20`
- Response: `{ notificacoes, total, naoLidas, page, totalPages }`

**GET /api/notificacoes/unread**
- Auth: getSession()
- Response: `{ count, ultimas: [...] }` — contagem + últimas 3

**PATCH /api/notificacoes/[id]**
- Auth: getSession() + scoped ao usuário
- Body: `{ lida: true }`
- Response: notificação atualizada

**DELETE /api/notificacoes/[id]**
- Auth: getSession() + scoped ao usuário
- Remove a notificação

**PATCH /api/notificacoes/read-all**
- Auth: getSession() + scoped ao usuário
- Marca todas as não lidas como lidas

### 5.2 Eventos

**GET /api/eventos**
- Auth: getSession() (DONO apenas)
- Query: `?tipo=PEDIDO_CRIADO&origem=VITRINE&processado=true&page=1&limit=50`
- Response: `{ eventos, total, page, totalPages }`

**POST /api/eventos**
- Auth: getSession() (DONO apenas, origem MANUAL)
- Body: `{ tipo, entidadeTipo, entidadeId, payload }`
- Dispara via emitEvent()

### 5.3 Mensagens

**GET /api/mensagens**
- Auth: getSession()
- Query: `?caixa=recebidas|enviadas`
- Response: `{ mensagens, total }`

**POST /api/mensagens**
- Auth: getSession()
- Body: `{ destinatarioId, assunto?, mensagem }`
- Cria mensagem + emite MENSAGEM_RECEBIDA

**PATCH /api/mensagens/[id]**
- Auth: getSession() + scoped ao destinatário
- Body: `{ lida: true }`

### 5.4 Lembretes

**GET /api/lembretes**
- Auth: getSession() + scoped ao usuário
- Query: `?status=pendentes|concluidos|todos`
- Response: `{ lembretes, total }`

**POST /api/lembretes**
- Auth: getSession() + scoped ao usuário
- Body: `{ titulo, descricao?, dataHora, entidadeTipo?, entidadeId? }`

**PATCH /api/lembretes/[id]**
- Auth: getSession() + scoped ao usuário
- Body: `{ titulo?, descricao?, dataHora?, concluido? }`

**DELETE /api/lembretes/[id]**
- Auth: getSession() + scoped ao usuário

### 5.5 Configurações

**GET /api/configuracoes/notificacoes**
- Auth: getSession() + scoped ao usuário
- Auto-cria config com defaults se não existir
- Response: `{ config }` com todos os booleanos

**PATCH /api/configuracoes/notificacoes**
- Auth: getSession() + scoped ao usuário
- Body parcial com quaisquer campos booleanos
- Usa upsert para criar se não existir

---

## 6. COMPONENTES

### 6.1 NotificationBell.tsx
- Ícone de sino no Header
- Badge com contagem de não lidas (99+)
- Dropdown com últimas 3 notificações
- Polling a cada 30 segundos via `/api/notificacoes/unread`
- Click marca como lida individualmente
- Botões "Marcar todas" e "Ver todas"

### 6.2 NotificationCenter.tsx
- Lista completa com 3 abas: Todas, Não lidas, Alta prioridade
- Filtro dropdown por tipo (pedido, venda, os, estoque, etc.)
- Paginação (20 por página)
- Ações: marcar lida, excluir
- Estados: loading, empty, error

### 6.3 NotificationCard.tsx
- Card individual com:
  - Badge de prioridade colorido
  - Indicador de não lida (bolinha azul)
  - Ícone por tipo
  - Título, mensagem, timestamp relativo
  - Link para urlDestino quando aplicável

### 6.4 NotificationToast.tsx
- Sistema global de toast:
  - `mostrarToast(notificacao)` — função exportada
  - `useToastListener()` — hook para componentes
- Auto-dismiss após 5 segundos
- Posicionamento bottom-right
- Cores por prioridade

### 6.5 NotificationBadge.tsx
- Componente simples: número com formatação 99+
- Classes condicionais por cor

### 6.6 TimelineEventos.tsx
- Timeline vertical com borda esquerda colorida
- Cores por categoria: verde=vendas, azul=pedidos, laranja=oficina, roxo=estoque, vermelho=financeiro
- Loading skeleton
- Estado vazio

### 6.7 FiltroEventos.tsx
- Dropdown Tipo (todos os 28 tipos)
- Dropdown Origem (VITRINE, PDV, OFICINA, ESTOQUE, FINANCEIRO, SISTEMA, MANUAL)
- Inputs de data início/fim
- Botão Limpar Filtros

### 6.8 HistoricoEventos.tsx
- Tabela com colunas: Data/Hora, Tipo, Origem, Entidade, Status
- Ordenação por coluna
- Filtro integrado com FiltroEventos
- Paginação
- Estados: loading, empty, error

---

## 7. PÁGINAS

### 7.1 /dono/notificacoes
- 4 cards de métricas: Total, Não lidas, Alta prioridade, Hoje
- NotificationCenter completo abaixo
- Título: "Central de Notificações"

### 7.2 /dono/eventos
- Toggle entre visualização Tabela e Timeline
- Tabela: HistoricoEventos com filtros
- Timeline: TimelineEventos cronológica
- Título: "Eventos do Sistema"

---

## 8. INTEGRAÇÕES COM MÓDULOS EXISTENTES

### 8.1 Vitrine Pedidos (POST /api/vitrine/pedidos)
- Após criação do pedido: `emitEvent({ tipo: 'PEDIDO_CRIADO', origem: 'VITRINE', ... })`

### 8.2 Vitrine Pedidos Status (PUT /api/vitrine/pedidos/[id])
- Status EM_SEPARACAO → `PEDIDO_EM_SEPARACAO`
- Status PRONTO_PARA_RETIRADA → `PEDIDO_PRONTO_RETIRADA`
- Status RETIRADO → `PEDIDO_RETIRADO`
- Status CANCELADO → `PEDIDO_CANCELADO`

### 8.3 Vendas (POST /api/vendas)
- Após venda concluída: `emitEvent({ tipo: 'VENDA_PAGA', origem: 'VENDA', ... })`

### 8.4 Ordens de Serviço (POST /api/ordens)
- Após criação da OS: `emitEvent({ tipo: 'OS_CRIADA', origem: 'OFICINA', ... })`

### 8.5 Ordens de Serviço Status (PUT /api/ordens/[id]/status)
- StatusPagamento AGUARDANDO_PAGAMENTO → `OS_FINALIZADA`
- StatusPagamento PAGO → `OS_PAGA`

---

## 9. SIDEBAR E HEADER

### 9.1 Sidebar.tsx
- Adicionado `useEffect` para polling de `/api/notificacoes/unread` (30s)
- Novo item: "Notificações" com badge de contagem (apenas DONO)
- Novo item: "Eventos do Sistema" (apenas DONO)
- Renderização de badge no item de menu

### 9.2 Header.tsx
- Adicionado NotificationBell (apenas para rotas não-/cliente)
- Títulos para novas páginas no pageTitles

---

## 10. COMANDOS PRISMA NECESSÁRIOS

```bash
# Criar as 6 novas tabelas no banco de dados
npx prisma db push

# Regenerar Prisma Client com os novos modelos
npx prisma generate

# Build de verificação
npm run build
```

---

## 11. VERIFICAÇÃO

- TypeScript (`npx tsc --noEmit`): ✅ Zero erros
- Prisma schema: ✅ 6 novos modelos + 6 relações adicionadas
- Event Bus: ✅ 28 tipos de evento, 25 regras de notificação
- APIs: ✅ 10 endpoints criados
- Componentes: ✅ 8 componentes React
- Páginas: ✅ 2 páginas DONA
- Integrações: ✅ 4 módulos (Vitrine Pedidos, Vitrine Status, Vendas, Ordens)
- Sidebar/Header: ✅ Menu com badge + NotificationBell
- Restrição: ✅ Nenhum módulo aprovado alterado — apenas adições

---

## 12. RESUMO FINAL

| Métrica | Quantidade |
|---------|-----------|
| Modelos Prisma | 6 novos |
| Relações User | 6 novas |
| Endpoints API | 10 novos |
| Componentes React | 8 novos |
| Páginas | 2 novas |
| Regras de Notificação | 25 |
| Tipos de Evento | 28 |
| Arquivos criados | 22 |
| Arquivos modificados | 8 |
| Módulos integrados | 4 (Vitrine, Vendas, Oficina, Sidebar/Header) |
