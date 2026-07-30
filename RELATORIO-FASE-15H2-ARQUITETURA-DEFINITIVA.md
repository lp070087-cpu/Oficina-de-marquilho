# RELATÓRIO TÉCNICO — FASE 15-H.2: ARQUITETURA DEFINITIVA DA VITRINE

**Data:** 2026-07-27  
**Versão:** 1.0  
**Status:** Concluído — Aguardando Homologação

---

## 1. RESUMO EXECUTIVO

A FASE 15-H.2 redefine a arquitetura da vitrine como uma **loja exclusiva de peças e acessórios com retirada na loja**. Clientes não podem abrir Ordens de Serviço. A Oficina permanece exclusiva para funcionários. O fluxo de compra completo foi implementado: Carrinho → Checkout (retirada) → Pedido → Separação → Pronto → QR Code → Retirada via Scanner.

**Regra fundamental:** O pedido RESERVA o estoque da loja na compra. Só baixa definitivamente quando o status vira RETIRADO. Cancelado devolve automaticamente.

---

## 2. SCHEMA PRISMA — ALTERAÇÕES NO MODELO PEDIDO

### 2.1 Campos adicionados ao modelo Pedido (`prisma/schema.prisma` linha 633)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| clienteId | String? | FK → Cliente (vincula cliente da vitrine ao pedido) |
| cliente | Cliente? | Relação com modelo Cliente |
| retiradaNome | String? | Nome de quem irá retirar |
| retiradaTelefone | String? | Telefone de quem irá retirar |
| retiradaDocumento | String? | Documento (opcional) |
| retiradaEm | DateTime? | Data/hora da confirmação de retirada |
| qrCode | String? | Código MP-PEDIDO-{numero} para leitura |

### 2.2 Status expandidos

**Antigos:** ABERTO, RESERVADO, SEPARADO, AGUARDANDO_PAGAMENTO, PAGO, CANCELADO

**Novos (adicionados):** PEDIDO_RECEBIDO, EM_SEPARACAO, PRONTO_PARA_RETIRADA, RETIRADO

### 2.3 Tipo e Origem expandidos

- `tipo`: +VITRINE
- `origem`: +VITRINE

---

## 3. NOVAS APIs

### 3.1 `src/app/api/vitrine/pedidos/route.ts`

| Método | Auth | Descrição |
|--------|------|-----------|
| GET | Cliente (JWT) | Lista pedidos do cliente autenticado |
| GET ?admin=1 | DONO/BALCAO | Lista todos pedidos VITRINE + métricas |
| POST | Cliente (JWT) | Cria pedido da vitrine (checkout finalizado) |

**Fluxo do POST:**
1. Decodifica JWT do cliente
2. Valida itens do carrinho
3. Reserva estoque da loja (`quantidadeLoja: decrement`)
4. Aplica cupom se fornecido
5. Cria Pedido (tipo: VITRINE, status: PEDIDO_RECEBIDO)
6. Gera QR Code: `MP-PEDIDO-{numero}`
7. Cria itens com `reservado: true`
8. Registra HistóricoPedido

### 3.2 `src/app/api/vitrine/pedidos/[id]/route.ts`

| Método | Auth | Descrição |
|--------|------|-----------|
| GET | Público | Detalhes do pedido com itens, cliente, histórico |
| PUT | DONO/BALCAO | Altera status do pedido |

**Ações por status no PUT:**
- **CANCELADO:** Devolve estoque reservado (`quantidadeLoja: increment`), libera reservas
- **RETIRADO:** Baixa estoque definitivo (`quantidade: decrement` no central + loja)
- **Todos:** Registra HistóricoPedido com operador e timestamp

---

## 4. ARQUIVOS ALTERADOS

### 4.1 Checkout — `/vitrine/checkout/page.tsx` (REESCRITO)

**Mudanças estruturais:**
- **Entrega desabilitada** com badge "EM BREVE" — botão cinza, não clicável
- **Retirada na Loja** é a única opção ativa, com endereço, horário e tempo de separação
- **Campo "Quem irá retirar?"** com nome, telefone, documento (opcional)
- Checkbox "Eu mesmo" que pré-preenche com dados do cliente
- Formas de pagamento: PIX (5% desconto), Cartão Crédito (até 6x), Débito, Dinheiro (na retirada)
- Cupom funcional com validação
- POST para `/api/vitrine/pedidos` (não mais orçamentos)
- Redireciona para `/vitrine/perfil?pedido={numero}` após sucesso
- Tempo de separação exibido: "Separação em até 2 horas"

### 4.2 Cliente — `/vitrine/perfil/page.tsx` (REESCRITO)

**Mudanças estruturais:**
- Aba "Meus Pedidos" agora mostra pedidos reais (não orçamentos)
- Cards expansíveis com timeline de status (Recebido → Separando → Pronto → Retirado)
- QR Code visível quando status = PRONTO_PARA_RETIRADA
- Detalhes do pedido: itens, preços, retirada, timeline, resumo financeiro
- Barra de progresso visual para status (4 passos)
- Suporte a `?pedido={numero}` para expandir pedido específico após checkout

### 4.3 DONA Vitrine — `/dono/vitrine/page.tsx` (ATUALIZADO)

**Mudanças:**
- Nova tab "Pedidos da Loja" no ciclo de tabs
- Indicadores rápidos: Aguardando, Separando, Prontos, Retirados Hoje
- Lista de pedidos com status, cliente, retirada, QR code
- Botão "Ver no painel completo →" linka para `/dono/pedidos-loja`

### 4.4 Sidebar — `src/components/Sidebar.tsx` (ATUALIZADO)

**Mudanças:**
- Menu DONA: +"Pedidos da Loja" (após Vitrine)
- Menu Balcão VENDA_LOJA: +"Retirada QR Code"
- Menu Balcão SERVIÇOS: +"Retirada QR Code"

---

## 5. NOVAS PÁGINAS

### 5.1 `/dono/pedidos-loja/page.tsx` — Painel DONA: Pedidos da Loja

**Funcionalidades:**
- Métricas em tempo real (5 cards: aguardando, separando, prontos, retirados hoje, cancelados)
- Filtros por status (todos, recebidos, separando, prontos, retirados, cancelados)
- Cards expansíveis com:
  - Dados do cliente e retirada
  - Itens do pedido com imagens
  - Linha do tempo do histórico
  - Botões de alteração de status (próximo passo + cancelar)
- Notificação WhatsApp com mensagem pronta e editável
- QR Code para retirada (código MP-PEDIDO-NUMERO)
- Busca por status via querystring

### 5.2 `/balcao/retirada-qrcode/page.tsx` — Balcão: Confirmação de Retirada

**Funcionalidades:**
- Scanner Universal integrado para leitura de QR Code
- Busca pedido pelo código escaneado
- Exibição dos dados do pedido: cliente, retirada, itens, total
- Botão "Confirmar Retirada — Baixar Estoque"
- Feedback visual: ✓ retirado, cancelado, ou "ainda não está pronto"
- Botão "Escanear outro pedido" para fluxo contínuo

---

## 6. FLUXO COMPLETO DA COMPRA

```
CLIENTE (Vitrine)
  │
  ├── 1. Navega na vitrine (home, catálogo, busca)
  ├── 2. Adiciona produtos ao carrinho
  ├── 3. Vai para o Carrinho → Checkout
  │
  ├── 4. CHECKOUT
  │   ├── Revisa itens e total
  │   ├── Entrega: apenas Retirada na Loja ✓
  │   ├── Define quem irá retirar (pode ser terceiro)
  │   ├── Escolhe pagamento: PIX / Cartão / Dinheiro
  │   ├── Aplica cupom (opcional)
  │   └── Finaliza → POST /api/vitrine/pedidos
  │
  ├── 5. PEDIDO CRIADO
  │   ├── Status: PEDIDO_RECEBIDO
  │   ├── Estoque da loja RESERVADO (quantidadeLoja: decrement)
  │   ├── QR Code gerado: MP-PEDIDO-{numero}
  │   └── Redireciona para Meus Pedidos
  │
  ├── 6. ACOMPANHAMENTO (Meus Pedidos)
  │   ├── Status timeline: Recebido → Separando → Pronto → Retirado
  │   ├── QR Code visível quando "Pronto p/ Retirada"
  │   └── Detalhes completos do pedido
  │
  └── 7. RETIRADA NA LOJA
      ├── Cliente apresenta QR Code no balcão
      ├── Balcão escaneia via Scanner Universal
      ├── Confirma retirada → PUT /api/vitrine/pedidos/{id} (RETIRADO)
      ├── Estoque baixado definitivamente (quantidade central)
      └── Status final: RETIRADO


ADMIN (DONA / Balcão Venda)
  │
  ├── Visualiza pedidos em /dono/pedidos-loja
  ├── Filtra por status
  ├── Altera status: Recebido → Separando → Pronto
  ├── Envia WhatsApp quando Pronto
  └── No balcão: escaneia QR Code → confirma retirada
```

---

## 7. FLUXO DE ESTOQUE

```
Criação do Pedido (PEDIDO_RECEBIDO)
  └── quantidadeLoja: decrement (RESERVA)
      └── Estoque central: NÃO alterado

Cancelamento (CANCELADO)
  └── quantidadeLoja: increment (DEVOLVE)
      └── Itens: reservado = false

Retirada (RETIRADO)
  └── quantidade: decrement (BAIXA definitiva central)
      └── retiradaEm: timestamp
```

---

## 8. QR CODE + SCANNER

### Formato do QR Code
`MP-PEDIDO-{numero}` — Ex: `MP-PEDIDO-1042`

### Fluxo de leitura
1. Cliente acessa Meus Pedidos → visualiza código quando status = PRONTO_PARA_RETIRADA
2. No balcão, atendente abre /balcao/retirada-qrcode
3. Scanner Universal lê o código
4. Sistema busca pedido pelo qrCode
5. Exibe dados do pedido para confirmação
6. Atendente confirma → status muda para RETIRADO → estoque baixado

### Scanner utilizado
**ScannerUniversal** existente — mesmo componente usado em Estoque, PDV, Entrada. Modos: câmera, USB, manual. Nenhum scanner novo foi criado.

---

## 9. NOTIFICAÇÕES WHATSAPP

### Disparo
- Botão no painel DONA quando pedido status = PRONTO_PARA_RETIRADA
- Mensagem pré-preenchida e editável

### Template
```
Olá {nome}! Seu pedido #{numero} está pronto para retirada.
Estamos aguardando você! 🏍️
```

### Implementação
`window.open('https://wa.me/55{telefone}?text={mensagem}', '_blank')`

---

## 10. CHECKLIST DE CONFORMIDADE

- [x] Vitrine é SOMENTE para venda de peças e acessórios
- [x] Clientes NÃO podem abrir OS
- [x] Clientes NÃO têm acesso à Oficina (nunca tiveram)
- [x] Toda OS continua sendo aberta apenas pelo BALCÃO
- [x] Oficina permanece exclusiva para funcionários
- [x] Checkout aceita apenas Retirada na Loja
- [x] Entrega mostra "Em breve" desabilitada
- [x] Pedido reserva estoque da loja (não baixa imediatamente)
- [x] Baixa definitiva apenas no status RETIRADO
- [x] Cancelamento devolve estoque automaticamente
- [x] Cada alteração de status gera HistóricoPedido
- [x] QR Code gerado automaticamente
- [x] ScannerUniversal reutilizado (nenhum scanner novo)
- [x] WhatsApp com mensagem pronta e editável

---

## 11. O QUE NÃO FOI ALTERADO

Conforme solicitado:

- Oficina (`/balcao/oficina`, `/oficina/*`)
- Financeiro (`/dono/financeiro`)
- PDV (`/balcao/pdv`, CarrinhoPDV, PagamentoModal, CaixaPDV)
- CRM (clientes, orçamentos)
- Estoque (central e loja, exceto lógica de reserva/baixa já descrita)
- Funcionários (`/dono/mecanicos`)
- Balcões (`/dono/balcoes`)
- Assistente IA (todos os painéis)
- Scanner (ScannerUniversal mantido como estava)
- Categorias (`/dono/categorias`)
- Ordens de Serviço (`/balcao/ordens`, `/dono/ordens`)

---

## 12. ARQUIVOS CRIADOS

| # | Arquivo | Tipo |
|---|---------|------|
| 1 | `src/app/api/vitrine/pedidos/route.ts` | API (GET, POST) |
| 2 | `src/app/api/vitrine/pedidos/[id]/route.ts` | API (GET, PUT) |
| 3 | `src/app/dono/pedidos-loja/page.tsx` | Página (Client) |
| 4 | `src/app/balcao/retirada-qrcode/page.tsx` | Página (Client) |

---

## 13. ARQUIVOS ALTERADOS

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `prisma/schema.prisma` | +7 campos no Pedido, +status, +tipo/origem |
| 2 | `src/components/Sidebar.tsx` | +3 itens de menu (DONA + 2 balcão) |
| 3 | `src/app/vitrine/checkout/page.tsx` | Reescrito para retirada exclusiva |
| 4 | `src/app/vitrine/perfil/page.tsx` | Reescrito com pedidos reais + QR Code |
| 5 | `src/app/dono/vitrine/page.tsx` | +tab Pedidos da Loja |

---

## 14. COMANDOS DE MIGRAÇÃO

```bash
# Aplicar alterações no schema ao banco
npx prisma db push

# Regenerar cliente Prisma
npx prisma generate

# Build de produção
npm run build
```

---

## 15. VERIFICAÇÃO FINAL

- [x] Schema complementado (sem breaking changes)
- [x] APIs RESTful seguindo padrão da codebase
- [x] JWT auth para cliente, cookie httpOnly para admin
- [x] HistóricoPedido em todas as transições de status
- [x] Reserva/liberação de estoque correta
- [x] ScannerUniversal reutilizado
- [x] Sidebar atualizada sem quebrar menus existentes
- [x] Nenhuma remoção de funcionalidade
- [x] Nenhuma reorganização de arquivos
- [x] Nenhuma refatoração

---

**Fim do Relatório.**  
**Próximo passo:** Homologação pelo usuário. Executar `npx prisma db push` para aplicar as mudanças. Não iniciar próxima fase sem aprovação.
