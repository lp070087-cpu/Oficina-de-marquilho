# Relatório de Análise — Módulo ESTOQUE CENTRAL

**Projeto:** Marquinho Moto Peças  
**Versão:** PAINEL 2026  
**Data da análise:** 2026-07-21  
**Stack:** Next.js 15.1 (App Router) + React 19 + Prisma 6.1 + PostgreSQL + TailwindCSS 3.4  
**Analista:** Claude (Opus 4.8)

---

## 1. Estrutura Completa do Módulo

### 1.1 Árvore de arquivos

```
src/app/estoque/
├── layout.tsx                         # Layout com AppShell + EstoqueProvider
├── page.tsx                           # Dashboard / Painel do Estoque
├── assistente/page.tsx                # Chatbot IA para estoque
├── central/page.tsx                   # ★ ESTOQUE CENTRAL (CRUD completo)
├── importar/page.tsx                  # Entrada inteligente (CSV/Excel/PDF/OCR/IA)
├── loja/page.tsx                      # Visualização do estoque da loja
├── relatorios/page.tsx                # Relatórios de saídas (por OS)
├── scanner/page.tsx                   # Entrada via scanner de código de barras
└── transferencia/page.tsx             # Transferência Central → Loja

src/components/estoque/
└── EstoqueCategorias.tsx              # Filtro de categorias (hardcoded 12 categorias)

src/components/scanner/
└── BarcodeScanner.tsx                 # Scanner de código de barras (câmera)

src/lib/
├── auth.ts                            # Autenticação JWT + getSession/requireAuth
├── prisma.ts                          # Singleton do Prisma Client
├── estoque-events.tsx                  # Contexto de refresh (EstoqueProvider/useEstoqueRefresh)
├── classificador.ts                   # Motor de classificação automática de peças
└── ocr-parser.ts                      # Parser de OCR (não utilizado diretamente nas páginas)

src/app/api/
├── pecas/route.ts                     # GET (listar/buscar) + POST (criar)
├── pecas/[id]/route.ts                # PUT (atualizar) + DELETE (soft-delete)
├── categorias/route.ts                # GET (listar categorias)
├── transferencia/route.ts             # POST (transferir entre CENTRAL ↔ LOJA)
├── relatorios/route.ts                # GET (relatório de saídas por OS)
├── relatorios/movimentacao/route.ts   # GET (listar) + POST (criar movimentação)
├── importar/route.ts                  # POST (importação em lote — acesso somente DONO)
├── auth/login/route.ts                # Login
├── auth/logout/route.ts               # Logout
├── auth/almoco/route.ts               # Toggle almoço (mecânico)
├── upload/route.ts                    # Upload de arquivos
└── ...
```

### 1.2 Páginas do módulo (8 páginas + layout)

| Rota | Título | Propósito | Acesso |
|------|--------|-----------|--------|
| `/estoque` | Painel do Estoque | Dashboard com métricas e últimas movimentações | ESTOQUE |
| `/estoque/central` | Estoque Central | CRUD completo de peças, busca, filtro por categoria, exportação | ESTOQUE |
| `/estoque/loja` | Estoque da Loja | Visualização do estoque disponível na loja física | ESTOQUE |
| `/estoque/transferencia` | Transferir p/ Loja | Interface de transferência Central→Loja com scanner | ESTOQUE |
| `/estoque/scanner` | Entrada Scanner | Leitura de código de barras + cadastro rápido | ESTOQUE |
| `/estoque/importar` | Entrada Inteligente | CSV, Excel, PDF, OCR de imagem, Assistente IA | ESTOQUE |
| `/estoque/relatorios` | Relatórios de Saídas | Peças usadas em OS por período | ESTOQUE |
| `/estoque/assistente` | Assistente IA | Chatbot para busca e cadastro de produtos | ESTOQUE |

---

## 2. Fluxo Atual

### 2.1 Autenticação e Layout

```
Login → requireAuth(['ESTOQUE']) → EstoqueLayout
  ├── AppShell (Sidebar + Header)
  │   └── Sidebar com menu ESTOQUE (8 itens)
  └── EstoqueProvider (contexto de refresh global)
      └── children (página ativa)
```

O layout (`layout.tsx`) é **Server Component**. Ele:
- Verifica autenticação via `requireAuth(['ESTOQUE'])` — somente usuários role=ESTOQUE
- Busca o nome do usuário no banco
- Renderiza `AppShell` (sidebar + header) + `EstoqueProvider` (contexto React para refresh)

### 2.2 Dashboard (page.tsx)

```
Carrega /api/pecas + /api/relatorios/movimentacao
→ Calcula métricas: total produtos, unidades, estoque mínimo, sem estoque,
  entradas hoje, transferências hoje
→ Exibe cards + tabela de últimas 10 movimentações
→ Reage a refreshKey do contexto
```

### 2.3 Estoque Central (central/page.tsx)

```
1. Busca categorias via /api/categorias
2. Busca peças via /api/pecas (com filtros q=busca, categoria=catId)
3. Renderiza tabela paginada (20 por página)
4. Modal de cadastro/edição:
   - Valida campos obrigatórios (nome, sku, categoria)
   - Verifica duplicidade de código de barras
   - POST /api/pecas (novo) ou PUT /api/pecas/[id] (edição)
5. Exportação:
   - Lista de compras completa (abre popup com HTML imprimível)
   - Lista só de estoque baixo
6. Exclusão: DELETE /api/pecas/[id] (soft-delete → ativo=false)
7. Reage a refreshKey do contexto (atualiza ao receber refresh)
```

### 2.4 Transferência (transferencia/page.tsx)

```
1. Carrega todas as peças + categorias + histórico de transferências
2. Busca por nome/SKU/barcode com filtros
3. Scanner de código de barras integrado
4. Ao selecionar peça:
   - Mostra detalhes (central, loja)
   - Input de quantidade
   - POST /api/transferencia com validação de saldo
5. Atualiza contagem após transferência
6. Exibe histórico das últimas 8 transferências
```

### 2.5 Scanner (scanner/page.tsx)

```
1. Câmera (BarcodeDetector API nativa) ou upload de etiqueta
2. Entrada manual de código de barras
3. Busca peça via /api/pecas?barcode=
4. Se encontrada: formulário de entrada (qtd central + qtd loja + custo)
   - PUT /api/pecas/[id] (atualiza quantidades)
   - POST /api/relatorios/movimentacao (registra ENTRADA)
5. Se não encontrada: formulário de cadastro rápido
   - POST /api/pecas (cria produto)
   - POST /api/relatorios/movimentacao (registra ENTRADA)
```

### 2.6 Importar (importar/page.tsx)

```
1. Tela de seleção de método (CSV, Excel, PDF, Imagem/OCR, Assistente IA)
2. CSV: parse manual de colunas (codigo, sku, nome, preco, custo, quantidade, barras)
3. Excel: usa lib xlsx (SheetJS) para parse
4. PDF: usa pdfjs-dist para extrair texto
5. Imagem: usa tesseract.js para OCR
6. IA: parse de texto livre ("10 litros de oleo 20W50")
7. Para cada linha: verifica se peça já existe (por barcode ou SKU)
8. Tabela editável para revisão antes de confirmar
9. Abastecimento em lote:
   - Produtos existentes: PUT /api/pecas/[id] (incrementa quantidade)
   - Produtos novos: POST /api/pecas (cria)
   - Para cada: POST /api/relatorios/movimentacao (ENTRADA)
```

### 2.7 Relatórios (relatorios/page.tsx)

```
1. Seletor de período (Hoje, 7 dias, 30 dias, 12 meses, Tudo)
2. GET /api/relatorios?inicio=&fim=
3. API consulta OrdemServico + ItemOS + peca
4. Exibe tabela: OS, Data, Cliente, Peça, Qtd, Valor
5. Métricas: total de peças saídas, valor total, itens diferentes
```

### 2.8 Assistente IA (assistente/page.tsx)

```
1. Chatbot com interface de mensagens
2. Parse de texto: regex para identificar "SKU nome quantidade preço"
3. Busca de produtos: GET /api/pecas?q=texto
4. Confirmação de cadastro automático
5. Upload de imagem (referência visual apenas, sem OCR funcional)
```

### 2.9 Fluxo de Refresh

```
EstoqueProvider (contexto)
  ├── refreshKey: number (incrementado a cada triggerRefresh)
  └── useEstoqueRefresh() → { refreshKey, triggerRefresh }

Páginas que consomem: dashboard, central, loja, transferencia
Páginas que disparam: central (ao salvar), transferencia (ao transferir)
Limitação: Somente páginas dentro do mesmo layout compartilham o contexto.
           Páginas de outros módulos (dono/estoque, balcao/estoque) NÃO recebem o refresh.
```

---

## 3. Arquivos Envolvidos

### 3.1 Páginas (8 arquivos)

| Arquivo | Linhas (aprox.) | Complexidade |
|---------|-----------------|--------------|
| `estoque/layout.tsx` | 16 | Baixa |
| `estoque/page.tsx` | 62 | Média |
| `estoque/central/page.tsx` | 180 | **Alta** |
| `estoque/loja/page.tsx` | 60 | Média |
| `estoque/transferencia/page.tsx` | 150 | **Alta** |
| `estoque/scanner/page.tsx` | 160 | **Alta** |
| `estoque/importar/page.tsx` | 260 | **Muito Alta** |
| `estoque/relatorios/page.tsx` | 65 | Média |
| `estoque/assistente/page.tsx` | 115 | Média |

### 3.2 Componentes (2 arquivos)

| Arquivo | Propósito |
|---------|-----------|
| `components/estoque/EstoqueCategorias.tsx` | Filtro de 12 categorias hardcoded |
| `components/scanner/BarcodeScanner.tsx` | Scanner via BarcodeDetector API |

### 3.3 Lib (5 arquivos)

| Arquivo | Propósito |
|---------|-----------|
| `lib/auth.ts` | JWT auth, getSession, requireAuth, roleToPath |
| `lib/prisma.ts` | Singleton PrismaClient |
| `lib/estoque-events.tsx` | Contexto React de refresh |
| `lib/classificador.ts` | Motor de classificação de produtos (~370 linhas) |
| `lib/ocr-parser.ts` | Parser OCR (não referenciado nas páginas) |

### 3.4 APIs (8 rotas relevantes)

| Rota | Métodos | Autenticação |
|------|---------|--------------|
| `/api/pecas` | GET, POST | DONO, BALCAO, MECANICO, ESTOQUE (GET) / DONO, BALCAO, ESTOQUE (POST) |
| `/api/pecas/[id]` | PUT, DELETE | DONO, BALCAO, ESTOQUE (PUT) / qualquer logado (DELETE) |
| `/api/categorias` | GET | Sem autenticação |
| `/api/transferencia` | POST | DONO, ESTOQUE |
| `/api/relatorios` | GET | DONO, ESTOQUE |
| `/api/relatorios/movimentacao` | GET, POST | DONO, ESTOQUE (GET) / DONO, BALCAO, ESTOQUE (POST) |
| `/api/importar` | POST | Somente DONO |
| `/api/auth/login` | POST | Público |

---

## 4. APIs Utilizadas

### 4.1 GET /api/pecas

**Parâmetros de query:**
- `q` — busca textual em nome (contains, case-insensitive)
- `categoria` — filtra por categoriaId
- `baixo=1` — filtra produtos com quantidade ≤ estoqueMinimo
- `modelo` — filtra por compatibilidade com modelo de moto
- `todas=1` — ignora filtro de compatibilidade
- `barcode` — busca exata por código de barras

**Retorno:** Array de peças com categoria aninhada `{ nome }`

**Roles:** DONO, BALCAO, MECANICO, ESTOQUE

**Observação:** A busca textual (`q`) só busca no campo `nome`, não em `codigo`, `codigoBarras`, `marca`, etc. As páginas de frontend fazem filtro adicional no cliente.

### 4.2 POST /api/pecas

**Body:** nome*, codigo*, codigoBarras, precoVenda, precoCusto, custoMedio, quantidade, quantidadeLoja, estoqueMinimo, subcategoria, marca, compatibilidade, localizacao, descricao, categoriaId*

**Retorno:** Peça criada com categoria

**Roles:** DONO, BALCAO, ESTOQUE

### 4.3 PUT /api/pecas/[id]

**Body:** Mesmos campos do POST (todos opcionais, atualização parcial)

**Retorno:** Peça atualizada

**Roles:** DONO, BALCAO, ESTOQUE

### 4.4 DELETE /api/pecas/[id]

**Comportamento:** Soft-delete (seta `ativo = false`)

**Roles:** Qualquer usuário autenticado ⚠️ (sem restrição de role)

### 4.5 POST /api/transferencia

**Body:** `{ pecaId, quantidade, de, para }`

**Comportamento:** Transação Prisma:
1. Verifica saldo
2. Atualiza `quantidade` (central) e `quantidadeLoja` (loja)
3. Cria `TransferenciaEstoque`
4. Cria `MovimentacaoEstoque`

**Roles:** DONO, ESTOQUE

### 4.6 GET /api/relatorios

**Parâmetros:** `inicio`, `fim` (ISO strings)

**Comportamento:** Consulta `OrdemServico` com `itens.peca` e `balcao`, agrega itens como saídas

**Roles:** DONO, ESTOQUE

### 4.7 Movimentação (GET/POST /api/relatorios/movimentacao)

**GET:** Lista movimentações (filtro por pecaId, tipo), últimas 100
**POST:** Cria movimentação (tipo: ENTRADA, SAIDA, TRANSFERENCIA, VENDA, USO_OS, AJUSTE, DEVOLUCAO)

---

## 5. Componentes Compartilhados

### 5.1 AppShell e Sidebar

O layout de estoque usa o `AppShell` genérico, que renderiza a `Sidebar` com o menu específico do módulo ESTOQUE:

```
estoqueMenu = [
  Painel, Estoque Central, Estoque da Loja, Transferir p/ Loja,
  Entrada Scanner, Entrada Intel. Estoque, Assistente IA, Relatórios
]
```

### 5.2 EstoqueCategorias

Componente específico do módulo estoque. Renderiza 12 categorias hardcoded como botões de filtro. Usado por: `central`, `loja`, `transferencia`.

### 5.3 BarcodeScanner

Componente de scanner usando `BarcodeDetector` API nativa do navegador (Chrome). Usado por: `transferencia`, `scanner`.

### 5.4 EstoqueProvider / useEstoqueRefresh

Contexto React que permite que páginas irmãs se comuniquem. Quando uma página faz uma alteração, chama `triggerRefresh()`, e outras páginas que usam `refreshKey` como dependência de useEffect são recarregadas.

### 5.5 Classificador (lib/classificador.ts)

Motor de classificação automática com ~15 categorias e dezenas de palavras-chave/subcategorias. Usa heurística de pontuação. **Não está sendo chamado diretamente pelas páginas do módulo estoque atual** — parece ser usado por outros fluxos (importação do dono).

---

## 6. Dependências

### 6.1 Runtime

| Pacote | Versão | Uso no módulo |
|--------|--------|---------------|
| next | ^15.1.0 | Framework |
| react/react-dom | ^19.0.0 | UI |
| @prisma/client | ^6.1.0 | ORM |
| jose | ^5.9.0 | JWT (auth.ts) |
| bcryptjs | ^2.4.3 | Hash de senha |
| tesseract.js | ^5.1.0 | OCR na página importar |
| pdfjs-dist | ^4.6.82 | Extração de PDF na página importar |
| xlsx | ^0.18.5 | Leitura de Excel na página importar |

### 3.2 Dev

| Pacote | Uso |
|--------|-----|
| tailwindcss | Estilização |
| typescript | Tipagem |
| prisma | Migrations |
| tsx | Execução de seed |

---

## 7. Integração com Outros Módulos

### 7.1 Com o módulo DONO (`/dono/estoque`)

**Arquivo:** `src/app/dono/estoque/page.tsx`

- Acessa as mesmas APIs: `/api/pecas`, `/api/categorias`
- Tem seu próprio layout (não compartilha EstoqueProvider)
- Oferece funcionalidades similares: CRUD de peças, visualização por categoria/subcategoria
- **Não recebe refresh automático** de alterações feitas no módulo ESTOQUE
- Tem interface própria com ícones por categoria e navegação hierárquica (categoria → subcategoria → peças)

### 7.2 Com o módulo BALCÃO (`/balcao/estoque`)

**Arquivo:** `src/app/balcao/estoque/page.tsx`

- Praticamente idêntico ao `dono/estoque` (código duplicado)
- Acessa as mesmas APIs
- Layout e sidebar diferentes (menu de Balcão)
- **Não recebe refresh automático**

### 7.3 Com o módulo MECÂNICO (`/mecanico/estoque`)

**Arquivo:** `src/app/mecanico/estoque/page.tsx`

- Versão somente-leitura (consulta)
- Não tem botões de editar/remover/adicionar
- Mostra apenas: SKU, Nome, Marca, Compatibilidade, Preço, Disponível, Status
- Acessa APIs: `/api/pecas`, `/api/categorias`

### 7.4 Diagrama de integração

```
                    ┌──────────────────┐
                    │   PostgreSQL DB  │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │   Prisma ORM     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────┴──────┐ ┌────┴──────┐ ┌─────┴──────┐
     │  /api/pecas   │ │ /api/trans│ │ /api/relat │
     │  /api/categ   │ │  ferencia │ │  orios     │
     └────────┬──────┘ └────┬──────┘ └─────┬──────┘
              │              │              │
    ┌─────────┼──────────────┼──────────────┼──────────┐
    │         │              │              │          │
┌───┴───┐ ┌───┴───┐  ┌──────┴──────┐ ┌────┴────┐ ┌───┴──────┐
│ DONO  │ │ESTOQUE│  │   BALCÃO   │ │ MECÂNICO│ │ VITRINE  │
│/dono/ │ │/esto- │  │  /balcao/  │ │/mecani- │ │ /vitrine │
│estoque│ │que/*  │  │  estoque   │ │ co/esto │ │          │
└───────┘ └───────┘  └────────────┘ └─────────┘ └──────────┘
```

---

## 8. Possíveis Melhorias

### 8.1 Duplicação de código (ALTA prioridade)

As páginas `dono/estoque`, `balcao/estoque` e `mecanico/estoque` compartilham ~80% do código (visualização por categoria/subcategoria/peças, ícones, busca). Isso significa que qualquer alteração na lógica de exibição de peças precisa ser replicada em 3 arquivos.

**Solução sugerida:** Extrair componentes compartilhados:
- `PecaCard` / `PecaTable`
- `CategoriaGrid`
- `SubcategoriaGrid`
- `PecaFormModal`

### 8.2 Categorias hardcoded (MÉDIA prioridade)

O componente `EstoqueCategorias` tem 12 categorias fixas no código. As categorias vêm do banco (`/api/categorias`) mas o filtro usa slugs hardcoded. Se uma categoria for renomeada ou adicionada no banco, o filtro não reflete.

### 8.3 Busca limitada no backend (MÉDIA prioridade)

A API `/api/pecas?q=` só busca no campo `nome`. O frontend faz filtro adicional no cliente, o que é ineficiente para catálogos grandes. O ideal seria buscar em múltiplos campos (nome, codigo, codigoBarras, marca, compatibilidade) diretamente na query SQL.

### 8.4 Refresh entre módulos (MÉDIA prioridade)

O `EstoqueProvider` só funciona dentro do layout `/estoque`. Alterações feitas pelo dono ou balcão não notificam o módulo de estoque, e vice-versa. Seria ideal usar um evento global (ex: CustomEvent no window) ou Server-Sent Events.

### 8.5 DELETE sem restrição de role (ALTA prioridade)

A rota `DELETE /api/pecas/[id]` aceita qualquer usuário autenticado (linha 15 do arquivo). Deveria ser restrita a DONO e ESTOQUE.

### 8.6 Validação e tratamento de erros (MÉDIA prioridade)

As APIs têm validação básica. Não há:
- Validação de tipos com Zod ou similar
- Tratamento consistente de erros do Prisma (ex: unique constraint violation no código ou código de barras)
- Logs de auditoria para operações sensíveis

### 8.7 Código de importação complexo (MÉDIA prioridade)

A página `importar/page.tsx` tem ~260 linhas com 5 métodos de importação diferentes. Cada método poderia ser extraído para um hook ou módulo separado.

### 7.8 Assistente IA limitado (BAIXA prioridade)

O assistente (`assistente/page.tsx`) usa apenas regex simples, sem integração real com IA. É mais um protótipo/prova de conceito.

---

## 9. Riscos de Alteração

### 9.1 Risco ALTO

- **Alterar o schema do Prisma (model Peca):** Impacta todas as APIs, todas as páginas de todos os módulos (estoque, dono, balcão, mecânico, vitrine), e potencialmente quebra o build do Next.js.
- **Alterar autenticação/autorização:** `getSession` e `requireAuth` são usados em TODAS as APIs e layouts.
- **Alterar a API de transferência:** A transação Prisma é crítica para integridade dos dados. Qualquer erro pode causar inconsistência entre `quantidade` e `quantidadeLoja`.

### 9.2 Risco MÉDIO

- **Alterar layout do módulo:** Afeta a navegação de todos os usuários ESTOQUE.
- **Migrar de Server para Client Components:** Pode quebrar a autenticação que depende de cookies no servidor.
- **Alterar os contratos das APIs (/api/pecas, /api/transferencia):** Outros módulos (dono, balcão, mecânico) dependem dos mesmos endpoints.

### 9.3 Risco BAIXO

- **Alterar páginas individuais (central, loja, scanner, etc):** Cada página é relativamente independente.
- **Adicionar novas páginas ou APIs:** Baixo risco de regressão.
- **Melhorias de UI/CSS:** Apenas impacto visual.
- **Refatoração de componentes internos:** Desde que os contratos de props sejam mantidos.

---

## 10. Plano de Implementação em Etapas

### Etapa 1 — Correções de segurança e bugs (1-2 horas)

1. **Restringir DELETE /api/pecas/[id]:** Adicionar verificação de role (DONO, ESTOQUE)
2. **Melhorar busca na API /api/pecas:** Buscar em múltiplos campos (nome, codigo, codigoBarras, marca)
3. **Adicionar validação de unicidade:** Tratar erros de código/códigoBarras duplicados com mensagens amigáveis

### Etapa 2 — Refatoração de componentes compartilhados (3-4 horas)

1. **Criar `PecaTable` component:** Extrair a tabela de peças usada em central, loja, dono, balcão
2. **Criar `PecaFormModal` component:** Extrair o modal de cadastro/edição
3. **Criar `CategoriaFilter` component:** Usar categorias do banco em vez de hardcoded
4. **Criar `EstoqueStats` component:** Cards de métricas reutilizáveis
5. **Unificar `dono/estoque`, `balcao/estoque`, `mecanico/estoque`:** Usar os componentes extraídos

### Etapa 3 — Melhorias no Estoque Central (3-4 horas)

1. **Adicionar listagem com ordenação:** Por nome, SKU, quantidade, preço
2. **Melhorar filtro de busca:** Busca combinada com debounce no backend
3. **Adicionar indicador visual de estoque:** Gráfico de barras ou indicador de nível
4. **Histórico de alterações por peça:** Tab com movimentações ao selecionar uma peça
5. **Ações em lote:** Selecionar múltiplas peças para ações (ex: ajuste de preço, transferência em lote)

### Etapa 4 — Sincronização entre módulos (2-3 horas)

1. **Implementar evento global de refresh:** `window.dispatchEvent(new CustomEvent('estoque:refresh'))`
2. **Todos os módulos escutam o evento:** DONO, BALCÃO, ESTOQUE, MECÂNICO
3. **Substituir EstoqueProvider atual** ou complementar com o evento global

### Etapa 5 — Melhorias na importação (2-3 horas)

1. **Refatorar importar/page.tsx:** Extrair cada método para um módulo/hook
2. **Adicionar preview de resultados:** Antes de confirmar a importação
3. **Melhorar detecção de duplicatas:** Usar similaridade de nomes (não só barcode/SKU exato)
4. **Integrar com classificador.ts:** Auto-classificar produtos importados

### Etapa 6 — Dashboard e relatórios avançados (2-3 horas)

1. **Dashboard com gráficos:** Entradas/saídas por período, top produtos, valor em estoque
2. **Relatório de giro de estoque:** Produtos parados vs. alta rotatividade
3. **Relatório de transferências:** Central → Loja por período
4. **Exportação em PDF/Excel:** Além do HTML imprimível atual

### Etapa 7 — Assistente IA real (3-4 horas)

1. **Integrar com API de IA:** Usar OpenAI/Claude para interpretar linguagem natural
2. **OCR avançado:** Melhorar extração de notas fiscais com IA multimodal
3. **Sugestões de compra:** Baseado em histórico de consumo e sazonalidade

---

## Resumo da análise

O módulo de Estoque Central é o coração da gestão de inventário do sistema Marquinho Moto Peças. Ele é composto por 8 páginas, 2 componentes específicos, 5 arquivos de biblioteca e consome 8 endpoints de API.

**Pontos fortes:**
- Arquitetura de módulo bem isolada com layout e autenticação dedicados
- Contexto de refresh para consistência entre páginas do módulo
- Múltiplas formas de entrada de estoque (manual, scanner, CSV, Excel, PDF, OCR)
- Transações Prisma para integridade nas transferências

**Pontos fracos:**
- Duplicação significativa de código entre os módulos DONO e BALCÃO
- Categorias hardcoded no componente de filtro
- Busca limitada no backend (só nome)
- DELETE sem restrição adequada de role
- Sem sincronização de refresh entre módulos diferentes
- Sem validação robusta de entrada (Zod ou similar)

**Recomendação:** Começar pelas Etapas 1 (segurança) e 2 (refatoração de componentes) antes de adicionar novas funcionalidades. Isso reduzirá o débito técnico e facilitará as etapas seguintes.
