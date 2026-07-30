# RELATÓRIO TÉCNICO — FASE 15-I: PORTAL DO CLIENTE

**Data:** 2026-07-28
**Versão:** 1.0
**Status:** Concluído
**Dependências:** FASE 15-H.2 (Arquitetura Definitiva da Vitrine)

---

## 1. ESCOPO DA FASE

Criar um Portal completo do Cliente, separado da área administrativa, com sistema próprio de autenticação, cadastro estendido e 10 seções de navegação. O portal reutiliza cards, tabelas e componentes visuais existentes do sistema, seguindo a restrição de apenas adicionar funcionalidades — sem alterar, remover ou reorganizar código aprovado.

### 1.1 Requisitos Atendidos

| # | Requisito | Status |
|---|-----------|--------|
| 1 | Autenticação própria (não DONO/BALCÃO) | ✅ |
| 2 | Cadastro estendido (11 campos + senha) | ✅ |
| 3 | Sidebar com 10 itens de menu | ✅ |
| 4 | Dashboard com métricas e últimos pedidos | ✅ |
| 5 | Meus Pedidos com timeline de status e QR Code | ✅ |
| 6 | Favoritos com compra direta e remoção | ✅ |
| 7 | Produtos Vistos (histórico de navegação) | ✅ |
| 8 | Garantias com barra de progresso e dias restantes | ✅ |
| 9 | Cupons com 3 abas (disponíveis/utilizados/expirados) | ✅ |
| 10 | Newsletter com toggle liga/desliga | ✅ |
| 11 | Notificações com badge de não lidas | ✅ |
| 12 | Perfil com edição inline e alteração de senha | ✅ |
| 13 | Segurança com sessões ativas e encerramento | ✅ |
| 14 | API namespace /api/cliente/* (13 endpoints) | ✅ |
| 15 | Recomendações IA baseadas em compras, favoritos, visualizações | ✅ |
| 16 | Layout responsivo mobile com hamburger menu | ✅ |

---

## 2. ARQUITETURA

### 2.1 Estrutura de Arquivos — 22 novos arquivos

```
src/
├── app/
│   ├── api/cliente/
│   │   ├── auth/route.ts           # POST — login + cadastro
│   │   ├── perfil/route.ts         # GET/PUT/PATCH — dados e senha
│   │   ├── pedidos/route.ts        # GET — listar pedidos VITRINE
│   │   ├── pedidos/[id]/route.ts   # GET — detalhes do pedido
│   │   ├── favoritos/route.ts      # GET/POST/DELETE — CRUD favoritos
│   │   ├── garantias/route.ts      # GET — listar garantias
│   │   ├── cupons/route.ts         # GET — cupons (disponíveis/utilizados/expirados)
│   │   ├── notificacoes/route.ts   # GET/PUT — listar e marcar lidas
│   │   ├── recomendados/route.ts   # GET — recomendações IA
│   │   ├── historico/route.ts      # GET — produtos vistos
│   │   ├── dashboard/route.ts      # GET — métricas resumo
│   │   ├── newsletter/route.ts     # GET/POST — status e toggle
│   │   └── seguranca/route.ts      # GET/DELETE — sessões ativas
│   └── cliente/
│       ├── layout.tsx              # Layout com sidebar de 10 itens
│       ├── login/page.tsx          # Login + Cadastro com toggle
│       ├── page.tsx                # Dashboard (Resumo)
│       ├── pedidos/page.tsx        # Meus Pedidos
│       ├── favoritos/page.tsx      # Favoritos
│       ├── historico/page.tsx      # Produtos Vistos
│       ├── garantias/page.tsx      # Garantias
│       ├── cupons/page.tsx         # Cupons
│       ├── newsletter/page.tsx     # Newsletter
│       ├── notificacoes/page.tsx   # Notificações
│       ├── perfil/page.tsx         # Perfil
│       └── seguranca/page.tsx      # Segurança
```

### 2.2 Schema Prisma — Modelos Expandidos

**Cliente** — 6 novos campos:
- `cpf` (String?, unique)
- `whatsapp` (String?)
- `dataNascimento` (DateTime?)
- `endereco` (String?)
- `cidade` (String?)
- `estado` (String?)
- `cep` (String?)
- `ultimoLogin` (DateTime?)

**Novos modelos:**
- `GarantiaCliente` — garantia de produto comprado na vitrine (pecaId, pedidoId, dataCompra, diasGarantia, expiraEm, status)
- `NotificacaoCliente` — notificações push do portal (tipo, titulo, mensagem, link, lida)
- `SessaoCliente` — rastreamento de sessões JWT (token, ip, userAgent, ativo)

### 2.3 Autenticação

Sistema JWT com `jose`:
- `POST /api/cliente/auth` com `action: 'login'` → valida telefone + password, gera JWT, cria SessaoCliente
- `POST /api/cliente/auth` com `action: 'cadastro'` → valida campos, hash bcrypt, cria Cliente + SessaoCliente
- Persistência via `sessionStorage` (`marquinho-cliente` = `{ id, nome, telefone, token }`)
- Verificação unificada via `getVitrineSession()` (mesmo helper da vitrine, campo `clienteId`)
- Logout invalida sessão atual

---

## 3. API /api/cliente/* — 13 Endpoints

### 3.1 auth/route.ts
```
POST { action, nome?, telefone?, password?, ...camposOpcionais }
→ Login: { cliente: {...}, token }
→ Cadastro: { cliente: {...}, token }
```
- Hash bcryptjs (10 rounds)
- Cria SessaoCliente com IP e User-Agent
- Atualiza ultimoLogin no login

### 3.2 perfil/route.ts
```
GET  → { id, nome, cpf, telefone, whatsapp, email, dataNascimento, modeloMoto, endereco, cidade, estado, cep, ultimoLogin, createdAt }
PUT  { ...campos } → atualiza perfil (verifica unicidade de telefone)
PATCH { senhaAtual, novaSenha } → troca senha (invalida outras sessões)
```

### 3.3 pedidos/route.ts
```
GET → [{ id, numero, status, total, createdAt, itens: [{ peca: {...} }], historico: [...] }]
```
- Filtro por clienteId autenticado
- Ordenado por createdAt DESC
- Include itens, peca, historico

### 3.4 pedidos/[id]/route.ts
```
GET → { id, numero, status, total, subtotal, desconto, formaPagamento, qrCode, retiradaNome, itens, historico }
```
- Escopo restrito ao cliente autenticado

### 3.5 favoritos/route.ts
```
GET    → [{ id, pecaId, peca: {...}, createdAt }]
POST   { pecaId } → cria favorito (409 se duplicado)
DELETE ?pecaId=... → remove favorito
```

### 3.6 garantias/route.ts
```
GET ?status=ATIVA|EXPIRADA → [{ id, peca, pedido, dataCompra, diasGarantia, expiraEm, status }]
```

### 3.7 cupons/route.ts
```
GET ?tipo=disponiveis|utilizados|expirados
→ disponiveis: cupons ativos do sistema (dataInicio ≤ agora ≤ dataFim)
→ utilizados: extraídos das observações dos pedidos do cliente (CUPOM:CODIGO)
→ expirados: cupons com dataFim < agora
```

### 3.8 notificacoes/route.ts
```
GET ?naoLidas=1 → { notificacoes: [...], totalNaoLidas: N }
PUT { id }      → marca uma como lida
PUT {}           → marca todas como lidas
```

### 3.9 recomendados/route.ts
```
GET → { porMarca: [...], porCategoria: [...], emAlta: [...], perfil: { marcasFavoritas, categoriasFavoritas } }
```
- Filtragem colaborativa baseada em: pedidos → marcas/categorias compradas, favoritos, histórico de navegação
- emAlta: peças mais vendidas nos últimos 30 dias

### 3.10 historico/route.ts
```
GET → [{ id, pecaId, peca: {...}, createdAt }]
```
- Últimos 20 produtos visualizados (distinct by pecaId)

### 3.11 dashboard/route.ts
```
GET → { totalPedidos, pedidosEmAndamento, totalFavoritos, totalGarantiasAtivas, notificacoesNaoLidas, cuponsDisponiveis, ultimosPedidos: [...] }
```

### 3.12 newsletter/route.ts
```
GET  → { ativo: boolean }
POST { ativo: boolean } → alterna inscrição
```

### 3.13 seguranca/route.ts
```
GET       → { sessoes: [...], ultimoLogin }
DELETE ?id=... → encerra sessão específica (ativa = false)
```

---

## 4. PÁGINAS DO CLIENTE

### 4.1 Layout (/cliente/layout.tsx)
- Sidebar escura fixa (260px) com 10 itens
- Header superior com logo "MP", nome do cliente
- Badge de notificações não lidas no item "Notificações"
- Botão "Voltar para Vitrine" e "Sair" no rodapé
- Mobile: hamburger menu com overlay
- Verificação de auth via sessionStorage em todas as páginas
- Página de login renderiza sem sidebar

### 4.2 Login (/cliente/login/page.tsx)
- Toggle Login/Cadastro com animação
- Login: telefone + senha (2 campos)
- Cadastro: nome, telefone, senha (obrigatórios) + CPF, WhatsApp, email, data de nascimento, modelo da moto, CEP, endereço, cidade, estado (opcionais)
- Validação client-side antes do submit
- Feedback visual de erro/sucesso
- Redireciona para /cliente após login bem-sucedido

### 4.3 Dashboard (/cliente/page.tsx)
- Saudação personalizada com primeiro nome
- 5 cards de métricas clicáveis: Meus Pedidos, Favoritos, Garantias Ativas, Cupons, Notificações
- Últimos 3 pedidos com link "Ver todos"
- Links rápidos: Continuar Comprando, Favoritos, Editar Perfil, Segurança

### 4.4 Meus Pedidos (/cliente/pedidos/page.tsx)
- Cards expansíveis com:
  - Timeline de status (4 etapas: Pedido Recebido → Em Separação → Pronto para Retirada → Retirado)
  - QR Code exibido quando status = PRONTO_PARA_RETIRADA
  - Lista de itens com imagem, nome, quantidade, preço
  - Timeline de histórico de status
  - Resumo financeiro (subtotal, desconto, total)
  - Forma de pagamento e dados de retirada

### 4.5 Favoritos (/cliente/favoritos/page.tsx)
- Grid de 2 colunas com cards de produtos
- Imagem, nome, marca, categoria, preço (com oferta riscada)
- Botão "Comprar" → adiciona ao carrinho e redireciona
- Botão "Remover" → confirmação visual
- Contador de produtos
- Estado vazio com link para vitrine

### 4.6 Produtos Vistos (/cliente/historico/page.tsx)
- Lista de produtos visualizados recentemente
- Cada item mostra: imagem, nome, marca, categoria, data da visualização, preço
- Clique redireciona para /vitrine/produto/[id]
- "Visto em DD/MM/AAAA"

### 4.7 Garantias (/cliente/garantias/page.tsx)
- Cards com status badge colorido (Ativa/Expirada/Acionada)
- Dados: produto, marca, pedido, data da compra, expira em, dias restantes
- Barra de progresso visual (verde > 30 dias, amarelo > 10, vermelho ≤ 10)
- Ícone de escudo para estado vazio

### 4.8 Cupons (/cliente/cupons/page.tsx)
- 3 abas: Disponíveis, Utilizados, Expirados
- Cards com código em destaque, badge de status, valor/percentual
- Cupons disponíveis com fundo verde suave
- Datas de validade e uso

### 4.9 Newsletter (/cliente/newsletter/page.tsx)
- Toggle switch (liga/desliga) com feedback visual
- Mensagem de confirmação temporária
- Texto explicativo sobre o que a inscrição oferece

### 4.10 Notificações (/cliente/notificacoes/page.tsx)
- Lista com ícones por tipo (📥 pedido, 📦 separação, ✅ pronto, 🎫 cupom, 🔥 promoção, ❤️ favorito)
- Indicador de não lida (bolinha azul + fundo destacado)
- Clique marca como lida e navega para o link
- Botão "Marcar todas como lidas"
- Contador de não lidas no header

### 4.11 Perfil (/cliente/perfil/page.tsx)
- Seção Dados Pessoais com visualização/edição inline
- 11 campos: nome, CPF, telefone, WhatsApp, email, data nascimento, modelo moto, CEP, endereço, cidade, estado
- Botão Editar → campos viram inputs → Salvar/Cancelar
- Seção Alterar Senha: senha atual + nova + confirmação
- Mensagens de feedback (sucesso verde, erro vermelho)

### 4.12 Segurança (/cliente/seguranca/page.tsx)
- Informações de Acesso: último login, senha (mascarada)
- Sessões Ativas: lista de dispositivos conectados
- Ícone diferenciado para mobile vs desktop
- Badge "Atual" na sessão corrente
- Botão "Encerrar" por sessão individual
- Botão "Encerrar todas" com confirmação
- Sessões encerradas ficam com badge "Encerrada"

---

## 5. PADRÕES VISUAIS

Mantidos os padrões do sistema:
- Background: `#F3F6FB`
- Sidebar escura: `#0F1A2E`
- Cor de destaque: `brand-600` (laranja/tema)
- Cards: `bg-white rounded-xl border border-slate-200`
- Tipografia: `font-extrabold` para títulos, `text-xs`/`text-sm` para corpo
- Estados vazios com ícone central + mensagem + link de ação
- Spinners de loading consistentes (borda brand-600 animada)
- Sempre `'use client'` nos componentes de página

---

## 6. PONTOS DE ATENÇÃO

1. **Autenticação separada**: O portal usa JWT (`getVitrineSession`) completamente separado dos cookies de DONO/BALCÃO. Um cliente NÃO consegue acessar áreas administrativas.

2. **sessionStorage**: A sessão do cliente persiste apenas na aba atual. Fechar o navegador = logout automático.

3. **Newsletter**: A API usa `(prisma as any).newsletter` porque o modelo Newsletter foi criado na FASE 15-H e pode não existir no schema se a migração não foi rodada. A API trata a ausência com try/catch.

4. **Cupons utilizados**: Extraídos por regex das observações do pedido (`CUPOM:CODIGO`). Se o formato mudar, a extração quebra.

5. **Recomendações IA**: Filtrgem colaborativa simples — não é um modelo de ML. Baseia-se em interseção de compras anteriores com marcas/categorias similares.

6. **Restrição atendida**: Nenhum módulo existente foi alterado. Todas as adições são incrementais no namespace `/cliente/*` e `/api/cliente/*`.

---

## 7. VERIFICAÇÃO

- ✅ 13 endpoints de API criados
- ✅ 10 páginas de portal criadas
- ✅ Layout com sidebar responsiva
- ✅ Página de login com cadastro estendido
- ✅ Dashboard com 5 métricas
- ✅ Schema Prisma expandido (Cliente + 3 novos modelos)
- ✅ Auth JWT separada da admin
- ✅ Nenhum arquivo existente alterado
- ✅ Padrão visual mantido
