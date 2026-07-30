# RELATÓRIO FINAL — FASE 15-E.1: AJUSTES FINAIS DA ARQUITETURA DO PDV

**Data:** 27 de Julho de 2026
**Status:** CONCLUÍDA
**Dependência:** FASE 15-E

---

## 1. RESUMO EXECUTIVO

A FASE 15-E.1 complementa a arquitetura do PDV implementada na FASE 15-E com 7 ajustes estruturais que unificam o sistema em um único fluxo de Pedido → Venda, garantindo que Venda Avulsa, Ordem de Serviço e Orçamentos compartilhem a mesma base de código e modelo de dados. Nenhum layout foi alterado, nenhuma funcionalidade foi removida, nenhum componente foi reorganizado.

---

## 2. AJUSTES APLICADOS

### 2.1 UNIFICAÇÃO DE PEDIDOS POR TIPO ✅

**Adicionado campo `tipo` ao modelo Pedido:**
- `VENDA` — Venda avulsa no balcão (default)
- `ORDEM_SERVICO` — Pagamento de OS gera Pedido → Venda
- `ORCAMENTO` — Preparado para orçamentos futuros

**Adicionado campo `origem`:**
- `PDV`, `SCANNER`, `ORDEM_SERVICO`, `ORCAMENTO`, `MANUAL`

**Adicionado campo `ordemServicoId`:**
- Referência opcional à OS original quando o Pedido é do tipo ORDEM_SERVICO

**Impacto:** O mesmo fluxo `Pedido → Carrinho → Pagamento → Venda → Histórico` atende Venda Avulsa, Ordem de Serviço e Orçamentos. Nenhum sistema paralelo foi criado.

### 2.2 RESERVA DE PEÇAS — STATUS SEPARADO ✅

**Status do Pedido expandido:**
- `ABERTO` — Pedido em construção
- `RESERVADO` — Peças bloqueadas para outros clientes (impede venda, mas NÃO baixa estoque)
- `SEPARADO` — Itens fisicamente separados (ainda sem baixa de estoque)
- `AGUARDANDO_PAGAMENTO` — Aguardando conclusão financeira
- `PAGO` — Pagamento recebido, Venda gerada, estoque baixado
- `CANCELADO` — Pedido cancelado, reservas liberadas

**Regra de negócio:** Quando RESERVADO, as peças continuam aparecendo no estoque com indicação "Reservado", mas ficam indisponíveis para venda a outro cliente. Baixa definitiva só ocorre quando o status muda para PAGO (via criação da Venda).

### 2.3 OPERADOR DA VENDA ✅

**Campos adicionados ao modelo Venda:**
- `operadorNome` — Nome do operador que realizou a venda
- `operadorId` — ID do operador (referência ao usuário)
- `origem` — Origem da venda (VENDA_AVULSA, ORDEM_SERVICO, ORCAMENTO, PDV, SCANNER)

**Campos preparatórios para relatórios futuros:**
- Vendas por Operador (`operadorId` indexado)
- Quem vendeu mais (agregação por `operadorNome`)
- Comissão (necessário `operadorId` + `lucroTotal`)
- Produtividade (contagem por `operadorId` × período)
- Vendas por Origem (`origem` indexado)
- Ticket Médio, Produtos Mais Vendidos, Cancelamentos (todos deriváveis dos modelos existentes)

### 2.4 ORDEM DE SERVIÇO VIA PEDIDO UNIFICADO ✅

**Fluxo implementado no `DetalheOSBalcao.tsx`:**
```
Cliente → Ordem de Serviço → Adicionar peças → Finalizar Serviço
→ "RECEBER PAGAMENTO" → Cria Pedido (tipo=ORDEM_SERVICO)
→ Cria Venda (via fluxo unificado POST /api/vendas)
→ Atualiza OS (statusPagamento=PAGO) → Moto Liberada → Finalizada
```

O botão "RECEBER PAGAMENTO" agora:
1. Cria um Pedido com `tipo: "ORDEM_SERVICO"` e `ordemServicoId: dados.id`
2. Envia para `/api/vendas` (mesmo fluxo de venda avulsa)
3. A Venda gerada contém `origem: "ORDEM_SERVICO"` e `operadorNome`
4. Atualiza a OS para PAGO

**Nunca foi criado um fluxo paralelo.** OS e Venda Avulsa compartilham exatamente a mesma API.

### 2.5 HISTÓRICO DE PEDIDO ✅

**Novo modelo `HistoricoPedido`:**
```prisma
model HistoricoPedido {
  id          String   @id @default(cuid())
  pedidoId    String
  tipo        String   // CRIADO, RESERVADO, SEPARADO, CANCELADO, PAGO, ENTREGUE, LIBERADO, BAIXA
  descricao   String?
  usuario     String?
  usuarioId   String?
  createdAt   DateTime @default(now())
}
```

**Registros gerados automaticamente:**
- `CRIADO` — Ao criar qualquer Pedido
- `RESERVADO` — Ao reservar itens
- `SEPARADO` — Ao separar itens fisicamente
- `CANCELADO` — Ao cancelar (com motivo)
- `AGUARDANDO_PAGAMENTO` — Ao iniciar checkout
- `PAGO` — Ao concluir venda (contém referência ao número da Venda)

**Nunca apagar histórico.** Todos os registros são append-only.

### 2.6 SCANNER UNIVERSAL ✅

**Verificação completa de todos os pontos de uso:**

| Local | Componente | Status |
|-------|-----------|--------|
| PDV (`/balcao/pdv`) | `ScannerUniversal` | ✅ Já estava correto |
| Cadastro Inteligente | `ScannerUniversal` | ✅ Já estava correto |
| Estoque Central Scanner (`/estoque/scanner`) | `ScannerUniversal` | ✅ Já estava correto |
| Transferência (`/estoque/transferencia`) | `ScannerUniversal` | ✅ **Corrigido** (usava `BarcodeScanner`, agora usa `ScannerUniversal`) |
| Assistente IA (`/estoque/assistente`) | Painel auxiliar | ✅ Não é um scanner — é um painel de UI |

**Correção aplicada:** A página de transferência de estoque substituiu `BarcodeScanner` por `ScannerUniversal`, unificando todos os scanners do sistema. Não existe mais nenhum outro scanner no projeto.

### 2.7 PREPARAÇÃO PARA RELATÓRIOS ✅

**Estrutura do banco pronta para suportar (sem implementar os relatórios):**

| Relatório | Campos/Fontes |
|-----------|--------------|
| Vendas por Operador | `Venda.operadorId`, `Venda.operadorNome` (indexados) |
| Vendas por Dia | `Venda.createdAt` (indexado) |
| Vendas por Mês | Agregação sobre `Venda.createdAt` |
| Vendas por Forma de Pagamento | `PagamentoVenda.tipo` + `PagamentoVenda.valor` |
| Ticket Médio | `Venda.total` / `Venda.count` por período |
| Produtos Mais Vendidos | `VendaItem.pecaId` + `VendaItem.quantidade` agrupado |
| Produtos Reservados | `PedidoItem.reservado = true` + `Pedido.status = RESERVADO` |
| Pedidos Cancelados | `Pedido.status = CANCELADO` (com `canceladoPor` e `canceladoEm`) |
| Comissão | `Venda.operadorId` × `VendaItem.lucroTotal` |

---

## 3. RESTRIÇÕES RESPEITADAS

- ✅ **NÃO alterar layout aprovado** — Nenhum componente visual foi modificado
- ✅ **NÃO remover funcionalidades** — Apenas adições
- ✅ **NÃO reorganizar componentes** — Estrutura mantida
- ✅ **NÃO alterar:** Estoque Central, Funcionários, Balcões, Categorias, Vitrine, Assistente Gerencial, Financeiro, Scanner Universal, Dashboard Premium

---

## 4. ARQUIVOS ALTERADOS

| Arquivo | Alteração | Linhas |
|---------|-----------|--------|
| `prisma/schema.prisma` | +`tipo`, +`origem`, +`ordemServicoId`, +`criadoPorId` em Pedido; +status `SEPARADO`; +`HistoricoPedido`; +`operadorNome`, +`operadorId`, +`origem` em Venda | ~30 adições |
| `src/app/api/pedidos/route.ts` | Suporte a `tipo`, `origem`, `ordemServicoId` no POST; status `SEPARADO` no PUT; `HistoricoPedido` em todas as transições | Reescrito (185 linhas) |
| `src/app/api/vendas/route.ts` | `operadorNome`, `operadorId`, `origem` no POST; `HistoricoPedido` ao criar Venda | ~15 adições |
| `src/components/DetalheOSBalcao.tsx` | `receberPagamento` agora cria Pedido → Venda pelo fluxo unificado | ~30 adições |
| `src/app/balcao/pdv/page.tsx` | POST do pedido inclui `tipo: 'VENDA'` e `origem: 'PDV'` | 2 linhas |
| `src/app/estoque/transferencia/page.tsx` | Substituído `BarcodeScanner` por `ScannerUniversal` | 3 linhas |

---

## 5. MODELO DE DADOS FINAL (FASE 15-E + 15-E.1)

```
Pedido ──────────── PedidoItem ──────────── Peca
  │                     │
  │ (1:1)               │ reservado (boolean)
  │                     │ precoOriginal, descontoPercent, descontoReais
  ▼                     │ precoVendido, subtotal
Venda ◄─────────────────┤
  │                     │
  │ operadorNome        │
  │ operadorId          │
  │ origem              │
  │                     │
  ├── VendaItem ────────┤ (precoCusto, lucroUnitario, lucroTotal)
  │                     │
  └── PagamentoVenda    │
                        │
HistoricoPedido ────────┘ (CRIADO, RESERVADO, SEPARADO, CANCELADO, PAGO)

Caixa ── SessaoCaixa ── MovimentacaoCaixa
              │
              │ operador
              │ saldoInicial, saldoDinheiro
              │ totalVendas, totalSangrias, totalSuprimentos
```

---

## 6. CONCLUSÃO

A FASE 15-E.1 está concluída. Todos os 7 ajustes estruturais foram aplicados sem modificar o layout ou remover funcionalidades. O sistema agora possui:

1. **Arquitetura unificada** — Venda, OS e Orçamento compartilham o mesmo fluxo Pedido → Venda
2. **Reserva de estoque** — Status SEPARADO adicionado, sem baixa antes do pagamento
3. **Rastreabilidade de operador** — Toda Venda registra quem vendeu
4. **Histórico imutável** — Toda transição de Pedido gera registro no HistoricoPedido
5. **Scanner único** — BarcodeScanner removido, todo o sistema usa ScannerUniversal
6. **Base para relatórios** — Estrutura pronta para Vendas por Operador, Comissão, Ticket Médio, etc.

**FASE 15-E ENCERRADA DEFINITIVAMENTE.** Aguardando aprovação para a FASE 15-F.
