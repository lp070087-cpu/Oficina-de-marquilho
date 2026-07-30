# RELATÓRIO TÉCNICO — FASE 15-H.1: VITRINE PREMIUM FINAL

**Data:** 2026-07-27  
**Versão:** 1.0  
**Status:** Concluído — Aguardando Homologação

---

## 1. RESUMO EXECUTIVO

A FASE 15-H.1 complementa a Vitrine Premium (FASE 15-H) com funcionalidades avançadas que equiparam a experiência de compra a marketplaces de referência (Mercado Livre, Amazon, KaBuM, PneuStore). Todas as adições seguem a política de **zero refatoração e zero reorganização** — cada arquivo existente foi apenas complementado, nunca substituído ou reestruturado.

**Estatísticas da FASE:**
- **5 novos modelos** no Prisma Schema
- **11 novas APIs** REST
- **1 API atualizada** com recursos expandidos
- **5 novos componentes** React
- **4 componentes atualizados** com novos recursos
- **3 páginas atualizadas** com novas seções
- **10 abas** no painel administrativo da vitrine

---

## 2. SCHEMA PRISMA — NOVOS MODELOS

### 2.1 ProdutoVisualizacao (`prisma/schema.prisma` linha 1298)
Analytics silencioso para tracking de visualizações de produtos. Usado para alimentar "Mais Vendidos" e "Recomendados".

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| pecaId | String | FK → Peca |
| clienteId | String? | Cliente logado (opcional) |
| sessao | String? | ID da sessão anônima |
| origem | String? | catalogo, busca, home, promocoes, marcas, related |
| createdAt | DateTime | Timestamp da visualização |

### 2.2 HistoricoNavegacao (`prisma/schema.prisma` linha 1312)
Registro persistente da navegação do cliente para "Continuar Comprando" e "Vistos Recentemente".

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| clienteId | String | FK → Cliente |
| pecaId | String | FK → Peca |
| createdAt | DateTime | Timestamp |

### 2.3 Pergunta (`prisma/schema.prisma` linha 1326)
Sistema de perguntas e respostas estilo Mercado Livre.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| pecaId | String | FK → Peca |
| clienteId | String | FK → Cliente |
| texto | String | Conteúdo da pergunta |
| aprovada | Boolean | Moderação (default: false) |
| createdAt | DateTime | Timestamp |

### 2.4 Resposta (`prisma/schema.prisma` linha 1344)
Respostas às perguntas dos clientes, vinculadas ao admin.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| perguntaId | String | FK → Pergunta |
| texto | String | Conteúdo da resposta |
| por | String | admin, dono, balcao |
| createdAt | DateTime | Timestamp |

### 2.5 VeiculoVitrine (`prisma/schema.prisma` linha 1367)
Estrutura de compatibilidade de veículos para busca avançada.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| marca | String | Marca (Honda, Yamaha, etc.) |
| modelo | String | Modelo (CG 160, XRE 300, etc.) |
| anoInicial | Int? | Ano inicial da faixa |
| anoFinal | Int? | Ano final da faixa |
| motor | String? | Motorização |
| versao | String? | Versão específica |
| ativo | Boolean | Status |

> **Migração necessária:** `npx prisma db push` (já executável, sem breaking changes)

---

## 3. APIs — NOVOS ENDPOINTS

### 3.1 `GET/POST /api/vitrine/perguntas`
- **GET:** Lista perguntas aprovadas de um produto (`?pecaId=...`), com respostas aninhadas e dados do cliente
- **POST:** Cria pergunta (requer JWT via Authorization header, extrai clienteId do token)
- **Auth:** GET público, POST requer cliente logado

### 3.2 `POST /api/vitrine/visualizacoes`
- Registra visualização de produto de forma silenciosa
- Body: `{ pecaId, clienteId?, sessao?, origem? }`
- Sempre retorna `{ ok: true }` — nunca lança erro para não quebrar UX

### 3.3 `GET /api/vitrine/mais-vendidos`
- Agrupa visualizações por pecaId, ordena por contagem decrescente
- Retorna até 12 produtos com dados da categoria
- Fallback: produtos aleatórios da vitrine se não houver dados

### 3.4 `GET /api/vitrine/recomendados`
- Filtragem colaborativa: encontra sessões/clientes que visualizaram o produto atual (`?pecaId=...`)
- Busca outros produtos visualizados pelas mesmas sessões
- Fallback: produtos da mesma categoria
- Deduplicação de pecaIds antes da query

### 3.5 `GET/POST /api/vitrine/cupons`
- **GET:** Lista cupons ativos/válidos (público) ou todos (`?admin=1`, DONO)
- **POST:** Cria cupom (DONO), auto-uppercase no código
- Trata P2002 (código duplicado) com mensagem amigável

### 3.6 `GET/PUT /api/vitrine/config-seo`
- **GET:** Retorna config por `?chave=...` ou todas como objeto key-value
- **PUT:** DONO only, aceita `{ chave: valor }` para upsert
- Valores em JSON no banco, desserializados no GET

### 3.7 `GET/POST /api/vitrine/banners`
- **GET:** Lista banners por `?tipo=...`, ordenados por ordem
- **POST:** DONO only, FormData com upload de imagens (imagemDesktop, imagemMobile)
- Arquivos salvos em `public/uploads/banners/` com timestamp

### 3.8 `GET/POST /api/vitrine/newsletter-admin`
- **GET:** DONO only, `{ assinantes[], total, ativos }`
- **POST:** DONO only, `{ id, ativo }` para toggle de status

### 3.9 `GET/POST /api/vitrine/historico`
- **GET:** Produtos vistos pelo cliente (`?clienteId=...`), últimos 8
- **POST:** Registra navegação `{ clienteId, pecaId }`
- Fallback silencioso (nunca quebra UX)

### 3.10 `PUT /api/vitrine/respostas`
- Responde pergunta (DONO only)
- Body: `{ perguntaId, texto, por? }`

### 3.11 `DELETE/PUT /api/vitrine/banners/[id]`
- **DELETE:** Remove banner por `?id=...`
- **PUT:** Atualiza banner existente (exceto arquivos)

---

## 4. API ATUALIZADA

### 4.1 `GET /api/vitrine/busca` (ATUALIZADO)
**Novos parâmetros e recursos:**
- `compatibilidade` — filtro por compatibilidade do produto
- `mais_vendidos` — nova opção de ordenação
- `maior_desconto` usa `nulls: 'last'` para precoOferta sort
- Retorna `categoriasSug` — categorias que batem com a query
- Retorna `marcasSug` — marcas que batem com a query
- `sugestoes` expandidas com campos de preço e marca

---

## 5. NOVOS COMPONENTES

### 5.1 CompartilharProduto.tsx
Modal de compartilhamento com:
- Botão WhatsApp com link pré-formatado
- Botão copiar link com feedback visual (tooltip "Copiado!")
- Props: `{ nome: string, url: string }`

### 5.2 PerguntasProduto.tsx
Sistema completo de Q&A:
- Lista perguntas aprovadas com respostas aninhadas
- Nome do autor, data formatada
- Respostas com label "Marquinho"
- Formulário de envio (requer login cliente via JWT)
- Estado vazio: "Nenhuma pergunta ainda. Seja o primeiro a perguntar!"
- Loading e error states

### 5.3 FormasPagamento.tsx
Display de formas de pagamento:
- PIX com 5% de desconto (destaque verde)
- Cartão de crédito em até 6x (1x = "à vista")
- Débito e Dinheiro lado a lado
- Props: `{ preco: number }`

### 5.4 FretePrazo.tsx
Calculadora de frete com:
- Input CEP com máscara de 8 dígitos
- Retirada na Loja (grátis, 2h para retirar)
- PAC e SEDEX (preparado para integração Correios)
- Estados: formulário vazio → calculando → resultados

### 5.5 ListaProdutoPremium.tsx
Card de produto em formato lista (horizontal):
- Imagem 112px, informações à direita com flex
- Badge de marca com cor, badge de desconto
- Nome (2 linhas), descrição curta, categoria + código
- Preço principal, PIX com desconto, parcelamento
- Botão Comparar + CTA "Ver Produto"
- Props: `{ p, onComparar?, comparado? }`

---

## 6. COMPONENTES ATUALIZADOS

### 6.1 BuscaPremium.tsx (ATUALIZADO)
**Novos recursos:**
- Histórico de buscas via localStorage (`marquinho-busca-historico`, últimos 10, mostra 5)
- Chips clicáveis para buscas recentes
- Seção "Populares" com top 4 produtos (busca /api/vitrine/mais-vendidos)
- Categorias sugeridas com label 📂
- Marcas sugeridas com label 🏭
- Botão "Ver todos os resultados" no rodapé
- Métodos: `salvarHistorico()`, `irProduto()`, `irCategoria()`, `irMarca()`

### 6.2 CardProdutoPremium.tsx (ATUALIZADO)
**Novos recursos:**
- Badge "Novo" (azul, produtos com <7 dias)
- Badge "Últimas X un." (âmbar, qty ≤ 5)
- Efeito hover na imagem (scale 110%)
- Preço PIX (5% desconto) em destaque verde
- Parcelamento (2-4x, mínimo R$20/parcela)
- Botão Comparar com estado visual (cor quando selecionado)
- Indicador de estoque: "Em estoque" ou "Apenas X un."
- Texto aprimorado: "Adicionar ao Carrinho"
- Badge de desconto formato "-X%"

### 6.3 FiltrosBarra.tsx (ATUALIZADO)
**Novos recursos:**
- Campo de compatibilidade (texto "Moto/Modelo")
- Dropdown de subcategoria (condicional à categoria com subcategorias)
- Toggle Grid/List com ícones SVG
- Layout em duas linhas para melhor organização
- Interface Filtros com `compatibilidade` e `subcategoria`

### 6.4 AdminVitrinePremium.tsx (EXPANDIDO)
De 4 para 10 abas:
1. **Visão Geral** — Dashboard com estatísticas da vitrine
2. **Banners** — Upload com FormData (desktop + mobile PNG), lista com preview
3. **Marcas** — CRUD de marcas
4. **Promoções** — Produtos em oferta com datas (datetime-local), tipo, status
5. **Cupons** — CRUD com validação, tratamento P2002, auto-uppercase
6. **Newsletter** — Contagem de assinantes, toggle ativo/inativo
7. **Depoimentos** — Aprovação/remoção
8. **SEO** — Title, description, keywords, ogImage
9. **Configurações** — Seções da vitrine com indicadores de ativo
10. **Seções** — Ordenação de seções da home

---

## 7. PÁGINAS ATUALIZADAS

### 7.1 `/vitrine/produto/[id]/page.tsx` (ATUALIZADO)
**Novas seções na página do produto:**
- Twitter Card no `generateMetadata`
- Botão Compartilhar ao lado do código do produto
- Preço PIX com destaque "5% de desconto"
- Garantia: "3 meses de garantia contra defeitos de fabricação"
- Especificações em grid 2 colunas (marca, categoria, código, código de barras, garantia, disponibilidade)
- Seção Frete e Prazo com componente FretePrazo
- Seção Formas de Pagamento com FormasPagamento
- Seção Perguntas e Respostas com PerguntasProduto
- Seção "Produtos da mesma marca" com grid de 4 cards

### 7.2 `/vitrine/catalogo/page.tsx` (ATUALIZADO)
**Novos recursos:**
- Modo de exibição: Grid ou Lista (com estado persistente)
- Comparador de produtos (até 4, com modal ComparadorVitrine)
- Botão "Comparar (N)" no cabeçalho
- Ordenação por "mais vendidos"
- Filtros com compatibilidade e subcategoria
- Renderização condicional: grid de CardProdutoPremium OU lista de ListaProdutoPremium

### 7.3 VitrineHomeClient.tsx (ATUALIZADO)
**Novas seções dinâmicas na home:**
- 📈 **Mais Vendidos** — dados de /api/vitrine/mais-vendidos
- 🎯 **Recomendados para Você** — filtragem colaborativa via /api/vitrine/recomendados
- 👁️ **Vistos Recentemente** — /api/vitrine/historico (requer login)
- 🆕 **Recém Adicionados** — últimos 8 produtos com badge "Novo"
- Favoritos do cliente carregados no useEffect
- Cada seção com link "Ver todos"

---

## 8. ESTRUTURA DE BANNERS

Cada banner (modelo `BannerCarrossel` existente) suporta:

| Campo | Tipo | Uso |
|-------|------|-----|
| titulo | String | Título do banner |
| subtitulo | String? | Subtítulo opcional |
| imagemDesktop | String (path) | PNG para desktop (upload admin) |
| imagemMobile | String (path) | PNG para mobile (upload admin) |
| tipo | String | categoria, promocao, marca, custom |
| link | String? | URL de destino |
| ordem | Int | Ordenação |
| ativo | Boolean | Visibilidade |
| corOverlay | String? | Cor da sobreposição |
| opacidade | String? | Opacidade do overlay |
| corTexto | String? | Cor do texto |
| ctaTexto | String? | Texto do botão |

**Fluxo:** Admin faz upload via painel (FormData) → arquivos salvos em `public/uploads/banners/` → vitrine exibe por tipo, ordenado por ordem.

---

## 9. ESTRUTURA DE GALERIA

Cada produto suporta até 7 imagens/vídeos (modelo `ImagemVitrine`):

| Campo | Descrição |
|-------|-----------|
| imagem1 (principal) | Primeira imagem do produto |
| imagem2 | Ângulo alternativo |
| imagem3 | Ângulo alternativo |
| imagem4 | Detalhe |
| tecnica | Imagem técnica/dimensional |
| video360 | URL do vídeo 360° |
| video | URL do vídeo de demonstração |

**Componente GaleriaPremium.tsx** implementa:
- Imagem principal com zoom on hover
- Thumbnails clicáveis (4 imagens + técnica)
- Botões para vídeo e 360° (abrem modais)
- Contador "1/7" no canto
- Navegação por setas

Todas as imagens e vídeos são carregados via painel administrativo — **nenhuma imagem está hardcoded**.

---

## 10. ESTRUTURA DE CARRINHO / CHECKOUT

O fluxo completo da vitrine mantido da FASE 15-H:

1. **Adicionar ao Carrinho** → dispatch no CartContext → atualiza sessionStorage
2. **Ícone do Carrinho** (CarrinhoIcone.tsx) → contador + dropdown com resumo
3. **Página do Carrinho** (`/vitrine/carrinho`) → lista de itens, quantidades, subtotais
4. **Checkout** (`/vitrine/checkout`) → formulário de dados, endereço, resumo
5. **Finalizar** → cria Pedido (tipo: VITRINE) no banco

**Persistência:** Carrinho em sessionStorage (sobrevive a page reloads, não a abas separadas).

---

## 11. SEO — ESTRUTURA COMPLETA

Configurável via `/api/vitrine/config-seo` (painel admin, aba SEO):

| Config | Descrição |
|--------|-----------|
| title | `<title>` da vitrine |
| description | `<meta name="description">` |
| keywords | `<meta name="keywords">` |
| ogImage | Open Graph image (URL) |
| twitterCard | summary_large_image |
| canonical | URL canônica da vitrine |
| robots | index, follow |

**Por página:**
- **Home:** Configuração geral da vitrine
- **Produto:** Nome + marca + preço (dinâmico)
- **Catálogo:** Categoria atual + vitrine
- **Busca:** "Resultados para: [query]"

**Structured Data (JSON-LD):**
- Home: `WebSite` + `Organization`
- Produto: `Product` com oferta, preço, disponibilidade

**Sitemap e Robots:** Preparados via `/sitemap.xml` e `/robots.txt` (Next.js built-in).

---

## 12. PERFORMANCE

| Técnica | Implementação |
|---------|---------------|
| Lazy Loading | Next.js Image com `loading="lazy"` em componentes de produto |
| Image Optimization | `next/image` com tamanhos otimizados |
| Prefetch | `<Link prefetch>` nas navegações principais |
| Suspense | Server Components com `Suspense` para loading states |
| Cache | `fetch` com `next: { revalidate }` nas APIs públicas |
| Code Split | App Router com code splitting automático por rota |

---

## 13. RESPONSIVIDADE

| Breakpoint | Largura | Comportamento |
|------------|---------|---------------|
| Desktop | ≥1024px | Grid 4 colunas, sidebar completa |
| Notebook | 768-1023px | Grid 3 colunas, sidebar compacta |
| Tablet | 640-767px | Grid 2 colunas, filtros colapsáveis |
| Celular | <640px | Grid 1-2 colunas, menu mobile, busca full-width |

---

## 14. FLUXO COMPLETO DA VITRINE

```
CLIENTE
  ├── Entra na Home
  │   ├── Carrossel de banners
  │   ├── Produtos em destaque (ofertas)
  │   ├── Mais vendidos ✨ NOVO
  │   ├── Recomendados ✨ NOVO
  │   ├── Vistos recentemente ✨ NOVO
  │   ├── Recém adicionados ✨ NOVO
  │   ├── Categorias populares
  │   ├── Marcas
  │   └── Newsletter + Rodapé
  │
  ├── Busca (BuscaPremium)
  │   ├── Resultados instantâneos
  │   ├── Histórico de buscas ✨ NOVO
  │   ├── Sugestões de categorias ✨ NOVO
  │   ├── Sugestões de marcas ✨ NOVO
  │   └── Produtos populares ✨ NOVO
  │
  ├── Catálogo
  │   ├── Modo Grid ou Lista ✨ NOVO
  │   ├── Filtros (categoria, subcategoria, marca, compatibilidade) ✨ NOVO
  │   ├── Ordenação (mais vendidos, desconto, preço, recentes)
  │   ├── Comparador (até 4 produtos) ✨ NOVO
  │   └── Cards de produto premium
  │
  ├── Produto (página)
  │   ├── Galeria premium (zoom, vídeo, 360°) ✨ NOVO
  │   ├── Preço PIX com desconto ✨ NOVO
  │   ├── Parcelamento ✨ NOVO
  │   ├── Badges (novo, mais vendido, últimas unidades) ✨ NOVO
  │   ├── Compartilhar (WhatsApp, link) ✨ NOVO
  │   ├── Frete e prazo ✨ NOVO
  │   ├── Formas de pagamento ✨ NOVO
  │   ├── Especificações ✨ NOVO
  │   ├── Compatibilidade completa
  │   ├── Avaliações com estrelas
  │   ├── Perguntas e respostas ✨ NOVO
  │   ├── Produtos relacionados
  │   └── Produtos da mesma marca ✨ NOVO
  │
  ├── Login / Cadastro
  │   ├── Meus pedidos
  │   ├── Favoritos
  │   ├── Produtos vistos ✨ NOVO
  │   └── Dados pessoais
  │
  └── Carrinho → Checkout → Pedido

ADMIN (DONO)
  ├── Dashboard da vitrine
  ├── Gerenciar produtos na vitrine
  ├── Gerenciar banners desktop/mobile ✨ NOVO
  ├── Gerenciar promoções ✨ NOVO
  ├── Gerenciar cupons ✨ NOVO
  ├── Gerenciar newsletter ✨ NOVO
  ├── Gerenciar SEO ✨ NOVO
  ├── Gerenciar marcas
  ├── Gerenciar depoimentos
  └── Configurar seções da home
```

---

## 15. ARQUIVOS CRIADOS

### APIs (11 novos arquivos)

| # | Arquivo | Métodos |
|---|---------|---------|
| 1 | `src/app/api/vitrine/perguntas/route.ts` | GET, POST |
| 2 | `src/app/api/vitrine/visualizacoes/route.ts` | POST |
| 3 | `src/app/api/vitrine/mais-vendidos/route.ts` | GET |
| 4 | `src/app/api/vitrine/recomendados/route.ts` | GET |
| 5 | `src/app/api/vitrine/cupons/route.ts` | GET, POST |
| 6 | `src/app/api/vitrine/config-seo/route.ts` | GET, PUT |
| 7 | `src/app/api/vitrine/banners/route.ts` | GET, POST |
| 8 | `src/app/api/vitrine/newsletter-admin/route.ts` | GET, POST |
| 9 | `src/app/api/vitrine/historico/route.ts` | GET, POST |
| 10 | `src/app/api/vitrine/respostas/route.ts` | PUT |
| 11 | `src/app/api/vitrine/banners/[id]/route.ts` | DELETE, PUT |

### Componentes (5 novos arquivos)

| # | Arquivo | Tipo |
|---|---------|------|
| 1 | `src/components/vitrine/CompartilharProduto.tsx` | Client |
| 2 | `src/components/vitrine/PerguntasProduto.tsx` | Client |
| 3 | `src/components/vitrine/FormasPagamento.tsx` | Client |
| 4 | `src/components/vitrine/FretePrazo.tsx` | Client |
| 5 | `src/components/vitrine/ListaProdutoPremium.tsx` | Client |

---

## 16. ARQUIVOS ALTERADOS

### APIs (1 arquivo)

| Arquivo | Mudanças |
|---------|----------|
| `src/app/api/vitrine/busca/route.ts` | +compatibilidade, +categoriasSug, +marcasSug, +mais_vendidos, fix maior_desconto nulls |

### Componentes (4 arquivos)

| Arquivo | Mudanças |
|---------|----------|
| `src/components/vitrine/BuscaPremium.tsx` | +histórico localStorage, +populares, +categorias, +marcas, +footer |
| `src/components/vitrine/CardProdutoPremium.tsx` | +badges (novo/últimas), +hover zoom, +PIX preço, +parcelamento, +comparar, +estoque |
| `src/components/vitrine/FiltrosBarra.tsx` | +compatibilidade, +subcategoria, +grid/list toggle, +layout 2 linhas |
| `src/components/vitrine/AdminVitrinePremium.tsx` | +6 abas (banners, promoções, cupons, newsletter, SEO, config) |

### Páginas (3 arquivos)

| Arquivo | Mudanças |
|---------|----------|
| `src/app/vitrine/produto/[id]/page.tsx` | +PerguntasProduto, +FormasPagamento, +FretePrazo, +CompartilharProduto, +especificações, +garantia, +mesma marca, +Twitter Card |
| `src/app/vitrine/catalogo/page.tsx` | +ListaProdutoPremium, +ComparadorVitrine, +grid/list, +comparar, +mais_vendidos |
| `src/app/vitrine/VitrineHomeClient.tsx` | +maisVendidos, +recomendados, +vistos, +recentes, +useEffect hooks |

### Schema (1 arquivo)

| Arquivo | Mudanças |
|---------|----------|
| `prisma/schema.prisma` | +5 novos modelos após ContatoVitrine |

---

## 17. INTEGRAÇÕES

### Frontend ↔ Backend

| Componente | API Chamada | Método |
|------------|-------------|--------|
| BuscaPremium (popular) | /api/vitrine/mais-vendidos | GET |
| VitrineHomeClient (mais vendidos) | /api/vitrine/mais-vendidos | GET |
| VitrineHomeClient (recomendados) | /api/vitrine/recomendados | GET |
| VitrineHomeClient (vistos) | /api/vitrine/historico | GET |
| CardProdutoPremium (comparar) | Estado local + ComparadorVitrine | — |
| PerguntasProduto | /api/vitrine/perguntas | GET, POST |
| AdminVitrinePremium (banners) | /api/vitrine/banners | GET, POST |
| AdminVitrinePremium (promoções) | /api/vitrine/promocoes | GET, POST |
| AdminVitrinePremium (cupons) | /api/vitrine/cupons | GET, POST |
| AdminVitrinePremium (newsletter) | /api/vitrine/newsletter-admin | GET, POST |
| AdminVitrinePremium (SEO) | /api/vitrine/config-seo | GET, PUT |

### Autenticação

| Perfil | Mecanismo | Escopo |
|--------|-----------|--------|
| DONO (admin) | Cookie httpOnly + jose verify | Acesso total ao painel admin |
| Cliente (vitrine) | JWT Bearer token + sessionStorage | Favoritos, perguntas, perfil |

---

## 18. COMANDOS DE MIGRAÇÃO

```bash
# Aplicar novos modelos ao banco (sem perda de dados)
npx prisma db push

# Regenerar cliente Prisma
npx prisma generate

# Verificar compilação
npx tsc --noEmit

# Build de produção
npm run build
```

---

## 19. O QUE NÃO FOI ALTERADO

Conforme solicitado, **nenhum** dos seguintes módulos foi modificado:

- PDV (/balcao/pdv, componentes CarrinhoPDV, PagamentoModal, CaixaPDV)
- Financeiro (/dono/financeiro, modelos Financas*, Caixa*)
- Oficina (/oficina, componentes Agenda, Checklist, Fotos, Assinatura)
- Scanner (ScannerUniversal em todos os pontos)
- Categorias do PDV (/dono/categorias, estrutura de categorias)
- Funcionários (/dono/funcionarios)
- Balcões (/dono/balcoes)
- Assistente IA (todos os painéis)
- Estoque (/estoque, modelos Peca* exceto novo campo)
- Layouts aprovados de qualquer página existente

---

## 20. VERIFICAÇÃO

- [x] Schema Prisma sem breaking changes (apenas adições)
- [x] APIs seguem padrão REST da codebase
- [x] Componentes seguem padrão React 19 + TypeScript
- [x] Server Components para data fetching, Client Components para interatividade
- [x] Autenticação DONO via cookie httpOnly + jose (admin)
- [x] Autenticação cliente via JWT Bearer (vitrine)
- [x] FormData para upload de banners
- [x] SessionStorage para estado do cliente
- [x] localStorage para histórico de busca
- [x] Nenhuma imagem hardcoded — estrutura preparada para upload
- [x] Nenhum arquivo reorganizado ou refatorado

---

**Fim do Relatório.**  
**Próximo passo:** Homologação pelo usuário. Não iniciar FASE 16 sem aprovação.
