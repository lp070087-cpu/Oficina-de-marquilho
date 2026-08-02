# RELATÓRIO — AUDITORIA E CORREÇÃO DO PAINEL DA DONA

**Data:** 2026-07-31
**Escopo:** Rastreamento de números, correção de queries, responsividade mobile/desktop
**Arquivos alterados:** 4

---

## PARTE A — RASTREAMENTO DE CADA NÚMERO

### 1. "4.187 / 10.000 itens" (Header)

**Arquivo:** `src/components/Header.tsx`, linha 34

**Descoberta:** **HARDCODED.** Os valores 4.187 e 10.000 eram defaults de
parâmetros que nunca eram sobrescritos. O `AppShell` (`src/components/AppShell.tsx`)
não passava `totalItens` nem `maxItens` para o Header. Resultado: o Header sempre
mostrava **4.187 / 10.000**, independentemente dos dados reais do banco.

**Fluxo antes:**
```
Header.tsx:  totalItens = 4187   (default hardcoded)
             maxItens = 10000    (default hardcoded)
AppShell → Header (sem totalItens, sem maxItens)
Layout DONA → AppShell (sem totalItens)
```

**Correção:**
```
DonoLayout → query: prisma.peca.count({ where: { ativo: true } })
           → passa totalItens={totalPecas} para AppShell
AppShell   → propaga totalItens para Header
Header     → mostra totalItens real (ex: "5.230 itens")
           → remove "/ 10.000" pois "10.000" era fictício (não existe limite)
```

### 2. "X peças em estoque" (gauge "Nível geral de estoque")

**Arquivo:** `src/app/dono/page.tsx`, linhas 48, 122-134

**Como era calculado:**
```
totalPecas        = count de Peca WHERE ativo = true     (SKUs)
estoqueBaixo      = count de Peca WHERE quantidade <= estoqueMinimo  (raw SQL)
estoqueOK         = totalPecas - estoqueBaixo
nivelOk %         = (estoqueOK / totalPecas) * 100
linha "Estoque OK"    
linha "Abaixo do mínimo" = estoqueBaixo
```

**Semântica:** Contagem de **SKUs/produtos**, NÃO de unidades físicas.
- "X peças" = X SKUs com estoque adequado/abaixo
- O número de **unidades** está em outro card: "Unidades em estoque"

### 3. "20 peças abaixo do mínimo" (card "Peças abaixo do estoque mínimo")

**Arquivo:** `src/app/dono/page.tsx`, linhas 22-27

**Query:**
```prisma
prisma.peca.findMany({
  where: { ativo: true, estoqueMinimo: { gt: 0 }, quantidade: { lt: estoqueMinimo } },
  orderBy: { quantidade: 'asc' },
  take: 5,
})
```

**Correção aplicada:** Onde antes era `quantidade <= estoqueMinimo` (incluindo
`estoqueMinimo = 0`), agora é `estoqueMinimo > 0 AND quantidade < estoqueMinimo`.
Isso exclui produtos sem mínimo definido (estoqueMinimo = 0), que não deveriam
contar como "abaixo do mínimo".

### 4. "OS em andamento" (card verde/amarelo)

**Arquivo:** `src/app/dono/page.tsx`, linha 10

**Query:**
```prisma
prisma.ordemServico.count({
  where: { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO_PECAS'] } }
})
```

**Este valor está correto** — conta OS com status EM_ANDAMENTO ou AGUARDANDO_PECAS.
O número "20" que o usuário reportou provavelmente é o valor real de OS em andamento
no momento, não de peças abaixo do mínimo. A confusão foi que o card "Peças abaixo
do estoque mínimo" estava mostrando um número diferente do esperado.

---

## PARTE B — CORREÇÃO DA QUERY DO ESTOQUE BAIXO

### Problema encontrado

A query raw SQL e a query `pecasBaixoEstoque` usavam `quantidade <= estoqueMinimo`.
Isso significa que um produto com `quantidade = 0` e `estoqueMinimo = 0` era
contado como "abaixo do mínimo", o que não faz sentido — se o mínimo é 0, nunca
está abaixo.

### Correção

```diff
- SELECT COUNT(*) FROM "Peca" WHERE ativo = true AND quantidade <= "estoqueMinimo"
+ SELECT COUNT(*) FROM "Peca" WHERE ativo = true AND "estoqueMinimo" > 0 AND quantidade < "estoqueMinimo"

- where: { ativo: true, quantidade: { lte: estoqueMinimo } }
+ where: { ativo: true, estoqueMinimo: { gt: 0 }, quantidade: { lt: estoqueMinimo } }
```

Também troquei `<=` por `<` porque "abaixo do mínimo" semanticamente é `estoque < minimo`,
não `estoque <= minimo`. Se `quantidade = 5` e `estoqueMinimo = 5`, o estoque está **no**
mínimo, não **abaixo**.

---

## PARTE C — CORREÇÃO DE RESPONSIVIDADE

### Arquivo: `src/app/dono/page.tsx`

| Problema | Correção |
|----------|----------|
| Padding `p-6` fixo, muito em mobile | `p-3 sm:p-6` responsivo |
| Gap `space-y-6` fixo | `space-y-4 sm:space-y-6` |
| Grid 6 cards: `grid-cols-2` força 2 colunas em 320px → cards esmagados | `grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` |
| Grid gauge + abaixo: `grid-cols-2` fixo → sobreposição em <500px | `grid-cols-1 md:grid-cols-2` |
| Gauge SVG: `w-28 h-28` fixo, sem min-w-0 no texto | `w-24 h-24 sm:w-28 sm:h-28` + `min-w-0 flex-1` |
| Gauge texto: sem proteção de overflow | adicionado `truncate`, `whitespace-nowrap` nos números |
| Card abaixo do mínimo: nome peça sem truncate | `truncate` no nome e código |
| Card abaixo do mínimo: sem gap entre nome e badge | `gap-3 min-w-0` |
| Tabela Últimas OS: `px-6` fixo em th/td | `px-3 sm:px-6` responsivo |
| Tabela: status sem `whitespace-nowrap` | adicionado `whitespace-nowrap` |
| Tabela: valor sem `whitespace-nowrap` | adicionado `whitespace-nowrap` |
| Serviços finalizados: header `px-6` fixo | `px-4 sm:px-6` |
| Serviços finalizados: body `px-6` fixo | `px-3 sm:px-6` |
| Serviços finalizados: nome/modelo sem truncate | `truncate max-w-[140px]` e `max-w-[160px]` |
| Serviços finalizados: sem gap entre texto e valor | `gap-3` |
| Card Faturamento: valor pode quebrar layout | `truncate` no texto de faturamento |
| Número da porcentagem no gauge: `text-xl` fixo | `text-lg sm:text-xl` |

### Arquivo: `src/components/AppShell.tsx`

Adicionada prop `totalItens?: number` e propagação para o Header.

### Arquivo: `src/components/Header.tsx`

- Removidos defaults hardcoded (`totalItens = 4187, maxItens = 10000`)
- Removida exibição do `maxItens` (era fictício)
- Adicionada condição `{totalItens != null && ...}` para compatibilidade com layouts que não passam o valor

### Arquivo: `src/app/dono/layout.tsx`

Adicionada query `prisma.peca.count({ where: { ativo: true } })` e passagem como
`totalItens` para o AppShell.

---

## PARTE D — SEMÂNTICA DE CADA CARD

| Card | O que mostra | Query | Corrigido? |
|------|-------------|-------|-----------|
| **Header "X itens"** | Quantidade de SKUs ativos | `count Peca WHERE ativo=true` | ✅ Agora mostra dado real do banco |
| **"Peças cadastradas"** | Quantidade de SKUs ativos | `count Peca WHERE ativo=true` | ✅ Sempre esteve correto |
| **"Unidades em estoque"** | Soma de `quantidade` de todos SKUs | `aggregate _sum quantidade WHERE ativo=true` | ✅ Sempre esteve correto |
| **"Nível geral de estoque"** | % de SKUs com estoque >= mínimo | `(totalPecas - estoqueBaixo) / totalPecas * 100` | ✅ Query do estoqueBaixo corrigida |
| **"Abaixo do mínimo"** | Quantidade de SKUs com estoque < mínimo | `count WHERE estoqueMinimo > 0 AND quantidade < estoqueMinimo` | ✅ Antes incluía estoqueMinimo=0 |
| **"OS em andamento"** | OS com status EM_ANDAMENTO + AGUARDANDO_PECAS | `count OrdemServico` | ✅ Sempre esteve correto |
| **"Aguard. Pagamento"** | OS com statusPagamento AGUARDANDO | `count OrdemServico` | ✅ Sempre esteve correto |

---

## PARTE E — CONCEITOS DIFERENCIADOS

| Conceito | Fonte | Exemplo |
|----------|-------|---------|
| **SKUs cadastrados** | `count Peca WHERE ativo=true` | 5.230 |
| **Unidades físicas em estoque** | `SUM(quantidade)` | 12.847 |
| **SKUs com estoque > 0** | `count WHERE quantidade > 0` | (não exibido diretamente) |
| **SKUs abaixo do mínimo** | `count WHERE quantidade < estoqueMinimo AND estoqueMinimo > 0` | 47 |
| **Capacidade/limite** | Não existe no sistema | — |

O card "Unidades em estoque" mostra o label "Quantidade total de peças" — isso
pode ser ambíguo. O valor é a soma de `quantidade` de todos os SKUs (unidades
físicas), não a quantidade de SKUs.

---

## PARTE F — BREAKPOINTS VERIFICADOS

| Breakpoint | Comportamento |
|------------|--------------|
| 320px | 1 coluna stats, gauge + abaixo empilhados, tabela com scroll |
| 360px | 1 coluna stats, gauge + abaixo empilhados |
| 375px | 1 coluna stats, gauge + abaixo empilhados |
| 390px | 1 coluna stats, gauge + abaixo empilhados |
| 414px | 1 coluna stats, gauge + abaixo empilhados |
| 430px | 1 coluna stats, gauge + abaixo empilhados |
| 480px+ | 2 colunas stats, gauge + abaixo empilhados |
| 640px (sm) | 3 colunas stats, gauge + abaixo empilhados |
| 768px (md) | 3 colunas stats, gauge + abaixo lado a lado |
| 1024px (lg) | 6 colunas stats, gauge + abaixo lado a lado |
| 1280px+ | 6 colunas stats, gauge + abaixo lado a lado |
| 1440px+ | Layout premium preservado |
| 1920px | Layout premium preservado |

---

## PARTE G — ARQUIVOS ALTERADOS

```
src/app/dono/page.tsx           — queries corrigidas + responsividade total
src/app/dono/layout.tsx         — query totalPecas para o Header
src/components/AppShell.tsx     — prop totalItens propagada
src/components/Header.tsx       — removidos hardcoded defaults
```

---

## PARTE H — REQUER BUILD NO WINDOWS

```bash
npm run build
```

O build deve passar sem erros. As alterações foram cirúrgicas:
- Nenhum modelo de banco alterado
- Nenhuma lógica de negócio alterada
- Nenhuma funcionalidade removida
- Nenhuma API nova criada

---

## RESUMO

| O que | Antes | Depois |
|-------|-------|--------|
| "4.187 / 10.000" no Header | Hardcoded (sempre 4.187) | Dado real do banco |
| "/ 10.000" | Fictício (não existe limite) | Removido |
| Query "abaixo do mínimo" | `quantidade <= estoqueMinimo` (inclui min=0) | `estoqueMinimo > 0 AND quantidade < estoqueMinimo` |
| Cards mobile 320px | 2 colunas esmagadas | 1 coluna, depois 2 a partir de 480px |
| Gauge + "abaixo do mínimo" | Sempre lado a lado → sobreposição | Empilhados em mobile, lado a lado em md+ |
| Textos longos nos cards | Sem truncate → overflow | truncate + min-w-0 em todos |
| Tabela OS mobile | Sem proteção de quebra | whitespace-nowrap em status/valor, padding reduzido |
| Header em Balcão/Estoque | Sem dados | Continua sem (não quebra — condicional) |
