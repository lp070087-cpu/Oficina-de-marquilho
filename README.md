# Marquinho Moto Pecas - Sistema de Gestao

Sistema completo para gestao de oficina mecanica e estoque de pecas.

## Tecnologias

- **Next.js 15** - Framework React com renderizacao hibrida
- **Prisma** - ORM para banco de dados
- **Neon** - Postgres serverless
- **Tailwind CSS** - Estilizacao
- **Vercel** - Hospedagem e deploy

## Perfis de acesso

| Perfil    | Email                        | Senha          |
|-----------|------------------------------|----------------|
| Dono      | dono@marquinho.com.br        | marquinho123   |
| Balcao 1  | balcao1@marquinho.com.br     | marquinho123   |
| Balcao 2  | balcao2@marquinho.com.br     | marquinho123   |
| Balcao 3  | balcao3@marquinho.com.br     | marquinho123   |
| Mecanico  | mecanico@marquinho.com.br    | mecanico123    |

## Como rodar localmente

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar o .env
O arquivo `.env` ja esta configurado com a connection string do Neon.
Verifique se a string esta correta.

### 3. Criar as tabelas no banco
```bash
npx prisma db push
```

### 4. Popular o banco (seed)
```bash
npm run db:seed
```

### 5. Rodar o projeto
```bash
npm run dev
```

Acessar: http://localhost:3000

## Deploy na Vercel

### Opcao 1: Conectar GitHub a Vercel (recomendado)

1. Va em https://vercel.com/dashboard
2. Clique em "Add New" > "Project"
3. Selecione o repositorio do GitHub com este codigo
4. A Vercel vai detectar que e Next.js automaticamente
5. Adicione as variaveis de ambiente:
   - `DATABASE_URL` = connection string do Neon
   - `JWT_SECRET` = marquinho-motopecas-jwt-secret-key-2026-super-segura
6. Clique em "Deploy"

Toda vez que fizer push no GitHub, a Vercel faz deploy automatico.

### Opcao 2: Deploy via CLI

```bash
npm install -g vercel
vercel login
vercel
```

## Estrutura de pastas

```
src/
  app/
    page.tsx               # Tela de login
    layout.tsx             # Layout raiz
    globals.css            # Estilos globais
    dono/                  # Area do Dono
      layout.tsx           # Layout com sidebar
      page.tsx             # Dashboard
    balcao/                # Area do Balcao
      layout.tsx
      page.tsx
    mecanico/              # Area do Mecanico
      layout.tsx
      page.tsx
    api/auth/              # API de autenticacao
  components/
    Sidebar.tsx            # Menu lateral
  lib/
    prisma.ts              # Cliente Prisma
    auth.ts                # Autenticacao JWT
  middleware.ts            # Protecao de rotas
prisma/
  schema.prisma            # Modelo do banco de dados
  seed.ts                  # Dados iniciais
```

## Fases do projeto

- [x] **Fase 1** - Estrutura, banco de dados e login por perfil
- [x] **Fase 2** - Ordens de servico, lancamento de pecas e nota fiscal
- [ ] **Fase 3** - Vitrine de produtos e integracao WhatsApp
- [ ] **Fase 4** - Relatorios, dashboard avancado e ajustes finais
