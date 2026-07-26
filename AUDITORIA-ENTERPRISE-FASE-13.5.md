# AUDITORIA COMPLETA DE ARQUITETURA — NÍVEL ENTERPRISE

**Projeto:** Marquinho Moto Peças (ERP para autopeças de motos)
**Stack:** Next.js 15.1 + React 19 + TypeScript 5.7 + Prisma 6.1 + PostgreSQL + TailwindCSS
**Data:** 24 de Julho de 2026
**Escopo:** 109 arquivos TS/TSX (~11.000 linhas de código)
**Auditor:** Software Architect Staff Engineer — React, Next.js, TypeScript, Tailwind, Performance, Clean Architecture, UX, ERP

---

## SUMÁRIO EXECUTIVO

O projeto é funcional e entrega um ERP completo — dashboard de estoque, multi-tenant por role (dono, balcão, mecânico, estoque), assistente IA integrada, scanner de código de barras, cadastro inteligente, vitrine pública, ordens de serviço. A Fase 13.5 modularizou com sucesso o monólito de 3789 linhas do Assistente IA em 22 arquivos com page.tsx de apenas 31 linhas.

No entanto, a arquitetura tem problemas estruturais sérios que limitam escalabilidade: **God Hook de 1456 linhas**, **zero memoização de componentes**, **nenhuma divisão de código**, **tipagem any generalizada**, **22+ definições duplicadas de formatador de moeda**, **sem ESLint**, **vulnerabilidade XSS confirmada**, e **secrets hardcoded em 2 arquivos**.

---

# 🔴 CRÍTICO (15 problemas)

Problemas que podem quebrar o sistema em produção.

### CR-1: God Hook useAssistenteIA (1456 linhas, ~200 valores no return)
**Arquivo:** `src/components/assistente-ia/Hooks/useAssistenteIA.ts`  
**Gravidade:** Altíssima  
**SOLID violado:** Single Responsibility, Interface Segregation, Dependency Inversion

59 useStates, 47 useMemos, 7 useEffects, ~20 handlers de negócio, scanner, cadastro, voz, compras, fornecedores, automação — tudo em um único hook. Isso torna o código impossível de testar unitariamente, impossível de dar manutenção incremental, e gera cascatas de re-renderização sempre que qualquer estado muda.

**Impacto:** Qualquer alteração futura no módulo de "compras" precisa passar por um hook que também gerencia voz, scanner e cadastro. Risco altíssimo de regressão.

### CR-2: XSS via dangerouslySetInnerHTML sem sanitização
**Arquivo:** `src/components/assistente-ia/ScannerCadastro.tsx:234`
```tsx
dangerouslySetInnerHTML={{ __html: formatarMarkdown(m.content) }}
```
A função `formatarMarkdown` apenas converte `**bold**` e `` `code` `` para HTML. Qualquer tag HTML no conteúdo da mensagem passa sem filtro. Se um usuário mal-intencionado registrar um produto com nome `<img src=x onerror=alert(1)>` e a IA mencionar esse produto no chat, o script executa.

### CR-3: JWT fallback secret hardcoded em 2 arquivos
**Arquivos:** `src/middleware.ts:6` e `src/lib/auth.ts:6`
```ts
process.env.JWT_SECRET || 'marquinho-motopecas-jwt-secret-key-2026-super-segura'
```
Se `JWT_SECRET` não estiver definido no ambiente, qualquer pessoa com acesso ao código fonte pode forjar tokens JWT e assumir qualquer role (DONO inclusive). Deve-se remover o fallback e lançar erro se a env var não existir.

### CR-4: useEffect com dependência [messages] causa re-fetch em toda interação
**Arquivo:** `useAssistenteIA.ts:884`
```ts
useEffect(() => { fetch('/api/pecas').then(...) }, [messages])
```
A cada tecla enviada no chat, TODOS os produtos são re-buscados da API. Com 10.000+ produtos, isso significa transferir megabytes de dados a cada mensagem. O array de dependência deveria ser `[]` ou usar um trigger explícito como `[refreshTrigger]`.

### CR-5: Nenhum React.memo em componentes que recebem ctx de 200 valores
**Arquivos:** Todos os 9 painéis do assistente-IA

O hook `useAssistenteIA` retorna ~200 valores. Quando qualquer setState é chamado (ex: `setScannerFlashVerde(true)`), todos os 9 painéis re-renderizam — mesmo que só o scanner use aquele estado. Sem React.memo, cada interação do usuário dispara re-render de 9 componentes pesados.

### CR-6: `handleAjuda` exportada no return mas nunca definida
**Arquivo:** `useAssistenteIA.ts:1453`
```ts
handleAjuda,  // <- exportada mas função não existe no arquivo
```
Qualquer painel que tente chamar `ctx.handleAjuda()` receberá `undefined is not a function` em runtime. A intent "ajudar" é tratada inline em `processarMensagem`, não como handler separado.

### CR-7: SpeechRecognition sem cleanup em unmount — memory leak
**Arquivo:** `useAssistenteIA.ts:1050, 1162`

`iniciarGravacaoAudio()` e `toggleVoz()` criam instâncias de `SpeechRecognition` que nunca são paradas no unmount do componente. Se o usuário sair da página durante uma gravação, o microfone continua capturando e o reconhecimento continua rodando.

### CR-8: BarcodeScanner — stale closure no cleanup (câmera não para)
**Arquivo:** `src/components/scanner/BarcodeScanner.tsx:18-34`
```ts
useEffect(() => {
  // ...
  return () => { stream.getTracks().forEach(t => t.stop()) }
}, []) // <- stream capturado do render inicial = null
```
O `stream` na closure de cleanup é sempre `null` porque foi capturado no primeiro render (antes do `getUserMedia` resolver). A câmera NUNCA é desligada quando o componente desmonta. Correção: usar ref para armazenar o stream.

### CR-9: formatMoney/fm definida em 22+ arquivos — zero código compartilhado
A função `const fm = (v:number) => v.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})` e `const formatMoney = ...` está definida independentemente em 22 arquivos diferentes. É o caso mais extremo de violação DRY no projeto. Se a formatação precisar mudar (ex: outro locale), são 22 arquivos para editar.

### CR-10: Fornecedores API — body inteiro passado direto ao Prisma
**Arquivo:** `src/app/api/fornecedores/route.ts:19-20`
```ts
const body = await req.json();
const f = await prisma.fornecedor.create({ data: body });
```
Sem whitelist de campos, um cliente pode injetar campos arbitrários no banco (ex: `{ nome: 'test', role: 'DONO', passwordHash: '...' }`). Campos sensíveis sem relação com fornecedor seriam persistidos se existirem na tabela.

### CR-11: Sem validação de input em API routes
**Arquivos:** `pecas/route.ts`, `transferencia/route.ts`, `upload/route.ts`, `usuarios/route.ts`

Nenhum uso de Zod, Yup ou validação manual na maioria das rotas. `POST /api/pecas` recebe o body e passa direto ao Prisma sem verificar tipos, ranges ou campos obrigatórios. `POST /api/transferencia` faz `parseInt(body.quantidade)` sem validar números negativos.

### CR-12: Rota de upload sem validação de tipo/tamanho de arquivo
**Arquivo:** `src/app/api/upload/route.ts:13-15`

Não verifica extensão, MIME type, nem tamanho do arquivo. A extração de extensão via `.pop()` pode causar path traversal. Um atacante pode fazer upload de um arquivo de 500MB ou um executável.

### CR-13: Sem ESLint no projeto
Não existe configuração de ESLint em lugar nenhum. Com TypeScript strict mode ativo, muitos problemas seriam pegos em tempo de compilação — mas ESLint pegaria: hooks rules (exhaustive-deps), unused imports, any usage warnings, a11y rules.

### CR-14: `useState` usado como `useEffect` — anti-padrão React
**Arquivo:** `src/app/estoque/scanner/page.tsx:32`
```ts
useState(() => { fetch('/api/categorias').then(r => r.json()).then(setCategorias) })
```
`useState` aceita lazy initializer que deve retornar o valor do estado. Aqui o retorno do fetch é descartado e `setCategorias` é chamado assincronamente. Funciona por coincidência (setCategorias roda como side-effect), mas quebra a semântica do React e pode causar problemas com Strict Mode ou Concurrent Features.

### CR-15: Tipos PecaResult incompletos — 25+ casts `as any`
**Arquivos:** `Types/assistente.types.ts`, `useAssistenteIA.ts`

O tipo `PecaResult` não declara `createdAt`, `fornecedor`, `localizacao` — campos que existem na resposta da API e são usados em 25+ lugares via `(p as any).createdAt`. O tipo está mentindo para o TypeScript.

---

# 🟠 IMPORTANTE (16 problemas)

Problemas que devem ser corrigidos, mas não quebram o sistema imediatamente.

### IM-1: 9 painéis tipados como `{ ctx: any }` — zero type safety
**Correção trivial:** adicionar uma linha ao hook:
```ts
export type AssistenteContext = ReturnType<typeof useAssistenteIA>;
```
Depois substituir `{ ctx: any }` por `{ ctx: AssistenteContext }` nos 9 painéis.

### IM-2: Unused imports massivos em todos os painéis
Todos os 7 painéis (Dashboard, Gerente, Central, Copiloto, Automação, Compras, Voice) importam o mesmo bloco de 9 itens (`IconeCategoria`, `CATEGORIAS_SIDEBAR`, `ACOES_RAPIDAS`, `COMANDOS_GRUPOS`, `corConfianca`, `textoConfianca`, `corStatusScanner`, `bolinhaStatus`, `labelStatus`) — mas cada painel usa no máximo 3 desses. É copy-paste de template.

### IM-3: Zero divisão de código — bundle único
Nenhum uso de `next/dynamic`, `React.lazy()`, ou `Suspense`. Todos os 9 painéis do assistente IA são carregados juntos no bundle inicial da página.

### IM-4: Zero Suspense boundaries
Nenhum componente usa Suspense para carregamento assíncrono. Fetch de dados bloqueia renderização sem fallback visual.

### IM-5: 4 layouts de role virtualmente idênticos
`estoque/layout.tsx`, `dono/layout.tsx`, `balcao/layout.tsx`, `mecanico/layout.tsx` são o mesmo template com o role trocado. Deveriam ser um layout parametrizado.

### IM-6: Duas páginas de scanner com ~80% de lógica compartilhada
`estoque/scanner/page.tsx` (218 linhas) e `dono/scanner/page.tsx` (259 linhas) definem interfaces `Peca`, `Categoria` e funções `buscarPorCodigo`, `cadastrarProduto` duplicadas. Deveriam compartilhar um hook `useScanner`.

### IM-7: 3 componentes órfãos nunca importados
- `TopBar.tsx` (59 linhas)
- `BalcaoSidebar.tsx` (49 linhas)
- `MecanicoSidebar.tsx` (62 linhas)

Nenhum arquivo no projeto importa estes componentes. São código morto.

### IM-8: Sidebar monolítica com todos os menus de todos os roles
`Sidebar.tsx` (170 linhas) contém arrays de menus para DONO, BALCAO-SERVIÇOS, BALCAO-VENDA, ESTOQUE, MECÂNICO — todos no mesmo componente. Se um role ganhar um novo menu, todos os outros passam por code review.

### IM-9: DetalheOSBalcao — 445 linhas, múltiplas responsabilidades
`DetalheOSBalcao.tsx` mistura UI de modal, fetch de peças, fetch de mecânicos, autocomplete, adicionar/remover itens, revisão, finalizar serviço, liberar moto, WhatsApp link. Deveria ser dividido em subcomponentes.

### IM-10: Cálculos de preço baixo duplicados 6 vezes
A filtragem `Number(p.precoVenda) > 0 && Number(p.precoVenda) < precoMedio * 0.7` aparece em 6 useMemos diferentes no `useAssistenteIA.ts` (linhas 149, 192, 207, 340, 356, 664). Deveria ser uma função `produtosAbaixoDaMedia(produtos, media)`.

### IM-11: Filtros semFornecedor/semLocalizacao duplicados 3-5 vezes
`(p as any).fornecedor` e `(p as any).localizacao` são filtrados em 5 useMemos diferentes. Funções utilitárias evitariam a repetição e os casts `as any`.

### IM-12: `/api/categorias` sem autenticação
`src/app/api/categorias/route.ts` não verifica sessão. Embora categorias sejam metadados de baixa sensibilidade, qualquer pessoa na internet pode enumerar a estrutura de categorias do estoque.

### IM-13: Pasta `{auth}` com chaves literais
`src/app/api/{auth}/` — nome de pasta contém chaves `{}` literais. Provável erro de digitação. Não é uma rota dinâmica válida do Next.js (que usaria `[auth]`).

### IM-14: Cadastro "Foto" é simulado — sem OCR real
O modo Foto do Cadastro Inteligente mostra preview da imagem mas não processa OCR. A mensagem exibida diz "Aguardando análise da IA" mas nenhuma análise ocorre. A biblioteca `lib/ocr-parser.ts` existe mas não é integrada.

### IM-15: Scanner BarcodeDetector sem fallback para navegadores sem suporte
`BarcodeScanner.tsx` usa a API `BarcodeDetector` (Chrome-only). Em Firefox e Safari, o scanner abre a câmera mas nunca detecta códigos — sem aviso ao usuário.

### IM-16: Nenhuma estratégia de cache para API calls
`/api/pecas` e `/api/categorias` são chamadas repetidamente sem `cache: 'force-cache'`, sem SWR/React Query, sem stale-while-revalidate. Cada navegação entre páginas refaz os mesmos fetches.

---

# 🟡 MÉDIO (16 problemas)

Melhorias recomendadas para qualidade e manutenibilidade.

### MD-1: `next.config.js` usa API depreciada
```js
experimental: { serverActions: { bodySizeLimit: '5mb' } }
```
Em Next.js 15, deve ser `serverActions: { bodySizeLimit: '5mb' }` no nível raiz.

### MD-2: `tsconfig.json` com target ES2017 desatualizado
Deveria ser `ES2020` ou `ESNext` para suportar optional chaining, nullish coalescing e outras features modernas.

### MD-3: Sem `noUnusedLocals` / `noUnusedParameters` no tsconfig
Permite acumulação de código morto. Com 22+ definições de `fm` e imports não usados, essa flag pegaria dezenas de problemas em tempo de compilação.

### MD-4: Sem `forceConsistentCasingInFileNames` no tsconfig
Em Windows (case-insensitive), imports com casing errado funcionam mas quebram em Linux/CI. Ex: `import from './Utils'` vs `import from './utils'`.

### MD-5: Sem script `lint` ou `type-check` no package.json
Build não verifica types nem lint. `tsc --noEmit` deveria rodar antes do build. ESLint deveria rodar em pre-commit.

### MD-6: Nomes de pastas inconsistentes (PascalCase vs lowercase)
`assistente-ia/Hooks/`, `Types/`, `Utils/`, `Voice/` usam PascalCase. `estoque/`, `scanner/`, `vitrine/` usam lowercase. Sem padrão definido.

### MD-7: Sidebar com arrays de menus específicos por role duplicados
Cada role tem seu próprio array de menu items no `Sidebar.tsx`. Itens comuns (Dashboard, Estoque) são repetidos em cada array ao invés de usar herança/composição de menus.

### MD-8: `useSugestoes` hook exportado mas nunca usado
Apenas `obterSugestoes` (função pura) é importada. O hook `useSugestoes` é exportado mas nenhum arquivo o importa.

### MD-9: `AppShellProps.user.email` — prop nunca usada
A interface `AppShellProps` declara `email` e `emAlmoco` no objeto `user`, mas `AppShell.tsx` não usa esses campos.

### MD-10: Falta de uso de Prisma-generated types nas API routes
Em vez de `const where: any = {}`, as rotas deveriam usar `Prisma.PecaWhereInput`, `Prisma.OrdemWhereInput`, etc.

### MD-11: `converterNumerosExtenso` importado mas nunca usado no hook
O hook importa `converterNumerosExtenso` de parser.ts mas ele é usado apenas dentro de `parseComando`. O import no hook é desnecessário.

### MD-12: Sem feedback de erro para o usuário em falhas de API
Múltiplos `.catch(() => {})` e `.catch(() => null)` silenciam erros. O usuário nunca sabe se uma operação falhou — ou pior, vê dados stale sem saber.

### MD-13: Exceção: vitrine usa sessionStorage para autenticação de cliente
O login da vitrine salva `{id, nome, telefone, modeloMoto}` em sessionStorage. É um anti-padrão para autenticação — tokens deveriam estar em httpOnly cookies, não acessíveis via JavaScript. (Aceitável para MVP, risco médio para produção.)

### MD-14: Timeout de 50ms para detecção de scanner HID é arbitrário
Alguns scanners Bluetooth ou modelos mais lentos podem digitar com intervalo >50ms entre caracteres, fazendo o sistema interpretar como digitação manual.

### MD-15: Cálculo de progresso do cadastro (30%) é frágil
`calcularProgresso` conta campos preenchidos e divide pelo total. Mas não valida o conteúdo dos campos — um campo "preenchido" com valor inválido conta como progresso.

### MD-16: Fallback de busca do parser é muito agressivo
Qualquer texto >3 caracteres sem padrão reconhecido dispara `buscar` com 60% de confiança (parser.ts:94). "hello world" ou "xyz abc" acionam busca de produtos.

---

# 🟢 BAIXO (10 problemas)

Boas práticas e melhorias cosméticas.

### BX-1: Sem `next/image` — imagens sem otimização
Nenhum uso de `next/image`. Imagens carregadas com `<img>` não têm lazy loading, redimensionamento ou formato WebP automático.

### BX-2: Sem virtualização de listas longas
Tabelas de produtos, leituras de scanner e histórico renderizam todos os itens. Para 10.000+ produtos, a performance degrada. Recomendado: `@tanstack/react-virtual` ou `react-window`.

### BX-3: Textos com tamanhos extremamente granulares
`text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]` são usados inconsistentemente. Não há design tokens de tipografia. Em dispositivos móveis, texto de 8px é ilegível.

### BX-4: Sem acessibilidade — zero aria-labels, zero roles, zero focus trap
Nenhum `aria-label`, `aria-live`, `aria-modal`, `role="dialog"`. O scanner full-screen não tem trap de foco. O leitor de tela não consegue navegar no assistente IA.

### BX-5: Sem skeleton screens para carregamento inicial
Apenas o chat tem skeleton (3 linhas pulsando). Dashboard, Gerente, Central e demais painéis abrem sem indicador de carregamento.

### BX-6: Cores hardcoded inconsistentes
`bg-brand-600`, `bg-indigo-600`, `bg-rose-600`, `bg-cyan-600`, `bg-teal-600`, `bg-amber-600` são usados arbitrariamente. Não há paleta de cores definida por contexto semântico.

### BX-7: Animações com `animationDelay` inline
As ondas de voz no ScannerCadastro.tsx usam `style={{ animationDelay: '0ms' }}`, `'150ms'`, etc. inline ao invés de classes CSS.

### BX-8: `SameSite: 'lax'` no cookie de auth (não 'strict')
Oferece proteção parcial contra CSRF. Para aplicações financeiras/ERP, `strict` é recomendado.

### BX-9: Checkboxes sem `<label>` associado
Alguns switches e toggles não têm label com `htmlFor`, reduzindo a área clicável e quebrando acessibilidade.

### BX-10: Comentários de seção (Banners como `// ===== DASHBOARD =====`) são úteis mas não padronizados
Alguns painéis têm esses comentários, outros não. Útil manter, mas inconsistente.

---

# 🔵 OPORTUNIDADES (14 sugestões)

Melhorias futuras — não bloqueiam nada, mas elevariam o nível técnico do projeto.

### OP-1: Extrair hook `useAssistenteIA` em 10 hooks especializados
- `useMensagens` — chat, input, loading
- `useConversas` — sidebar de histórico
- `useEstoqueData` — fetch de produtos e categorias
- `useDashboardIA` — dashboardData, analisesIA, alertasIA
- `useGerenteIA` — prioridades, sugestões, pontuação
- `useCopilotoData` — simulações, diagnóstico, ranking
- `useComprasData` — compras, fornecedores, curva ABC
- `useScanner` — HID, dispositivos, leituras
- `useCadastro` — ficha, modos, progresso, OCR
- `useVoz` — speech recognition, speech synthesis
- Criar `AssistenteContext` tipado com `ReturnType<typeof useAssistenteIA>`

### OP-2: Adotar React Context + useReducer para estado global
Com hooks divididos, um Context central evitaria o props drilling de 200 valores. Cada painel consumiria apenas o slice que precisa via `useContext`.

### OP-3: Implementar React Query (TanStack Query) para caching
Eliminaria: fetches duplicados, race conditions, cache invalidation manual, loading/error states inconsistentes. Todos os `fetch('/api/...')` virariam `useQuery(['pecas'], fetchPecas)` com cache automático.

### OP-4: Adotar `next/dynamic` para lazy loading dos painéis
```tsx
const DashboardPanel = dynamic(() => import('@/components/assistente-ia/Dashboard/DashboardPanel'))
```
Cada painel seria carregado sob demanda, reduzindo o bundle inicial em ~80%.

### OP-5: Unificar scanners em um módulo `useScanner` compartilhado
As duas páginas de scanner (estoque e dono) compartilhariam hook, tipos, e handlers. O `BarcodeScanner.tsx` seria o componente de câmera injetado como estratégia.

### OP-6: Criar utilitário `formatCurrency` em `src/lib/format.ts`
Eliminaria 22 definições duplicadas de `fm`/`formatMoney`. Uma única função, importada onde necessário.

### OP-7: Integrar OCR real no cadastro por foto
A biblioteca `lib/ocr-parser.ts` existe mas não é usada. Tesseract.js ou API de visão computacional transformariam o modo Foto de simulação para funcional.

### OP-8: Adicionar validação com Zod em todas as API routes
```ts
const schema = z.object({ nome: z.string().min(2), quantidade: z.number().int().positive() })
const body = schema.parse(await req.json())
```
Eliminaria: falta de validação, injeção de campos, erros de tipo em runtime.

### OP-9: Implementar Virtual Scroll para listas grandes
Para tabelas com 10.000+ produtos, virtualização reduziria nós do DOM de ~10.000 para ~20 visíveis.

### OP-10: Substituir `formatarMarkdown` por `react-markdown` + `rehype-sanitize`
Eliminaria XSS e permitiria markdown real (listas, links, código) no chat da IA.

### OP-11: Adicionar Error Boundary global
```tsx
<ErrorBoundary fallback={<ErroPanel />}>
  <AssistenteIAPage />
</ErrorBoundary>
```
Preveniria crash total da página em erros de renderização.

### OP-12: Unificar layouts de role
Um `RoleLayout` parametrizado substituiria os 4 layouts idênticos:
```tsx
export default function Layout({ children, role }: { children: React.ReactNode, role: string })
```

### OP-13: Configurar ESLint + Prettier + Husky
- `eslint-config-next` para regras específicas do Next.js
- `eslint-plugin-react-hooks` para regras de exhaustive-deps
- `prettier` para formatação consistente
- `husky` + `lint-staged` para pre-commit hooks

### OP-14: Adotar `next/image` para otimização de imagens
Substituir `<img>` por `<Image>` com lazy loading, WebP, e redimensionamento automático.

---

# ESTIMATIVAS DE PERFORMANCE

## Por volume de produtos

| Cenário | 10.000 produtos | 50.000 produtos | 100.000 produtos |
|---------|----------------|-----------------|------------------|
| **Fetch inicial /api/pecas** | ~2-5 MB (aceitável) | ~10-25 MB (lento) | ~20-50 MB (crítico) |
| **Dashboard (useMemo cascade)** | ~50ms (OK) | ~250ms (perceptível) | ~500ms (bloqueante) |
| **Busca (filtro em memória)** | <10ms (OK) | ~50ms (OK) | ~100ms (aceitável) |
| **Chat por mensagem** | Re-fetch 2-5MB a cada msg | Re-fetch 10-25MB a cada msg | Re-fetch 20-50MB a cada msg |
| **Scroller sem virtualização** | ~10.000 nós DOM (OK) | ~50.000 nós (lento) | ~100.000 nós (crash) |

**Recomendação para >10.000 produtos:**
- Paginação server-side na API `/api/pecas` (já parcialmente implementada com `?q=`)
- Remover `[messages]` do array de dependências do fetch
- Virtualização nas tabelas
- Cache com React Query (staleTime: 30s)

## Por usuários simultâneos

| Cenário | 10 usuários | 50 usuários | 100 usuários |
|---------|------------|------------|-------------|
| **Banco PostgreSQL** | OK (conexão simples) | OK se pool >20 | Precisa pool 50+ e/ou PgBouncer |
| **API /api/pecas** | OK | OK com cache | Risco de sobrecarga sem cache |
| **Assistente IA** | OK | Alto uso de memória do cliente | Cada cliente com fetch de 50MB = inviável |
| **JWT httpOnly** | OK | OK | OK |
| **Next.js server** | OK (single instance) | OK com 2+ instâncias | Precisa load balancer |

**Gargalo principal:** Cada cliente faz fetch completo de `/api/pecas` SEM paginação e SEM cache. Com 100 usuários fazendo fetch de 20-50MB cada, o servidor Next.js e o banco colapsariam.

---

# NOTA FINAL DE ARQUITETURA

## **52 / 100**

### Breakdown por dimensão:

| Dimensão | Peso | Nota | Justificativa |
|----------|------|------|---------------|
| Estrutura de pastas | 10% | 7/10 | App Router bem organizado, mas inconsistência de nomenclatura |
| Componentização | 15% | 5/10 | Modularização do assistente IA foi bem feita, mas componentes órfãos e falta de memoização |
| Hooks | 15% | 2/10 | God Hook de 1456 linhas; é o maior problema da arquitetura |
| TypeScript | 10% | 4/10 | Strict mode ativo, mas 25+ `as any`, `ctx: any` em 9 painéis, tipos incompletos |
| Performance | 10% | 3/10 | Zero memoização, zero code splitting, re-fetch desnecessário, sem virtualização |
| Segurança | 10% | 5/10 | Auth funciona bem, mas XSS confirmado, fallback secret hardcoded, sem validação |
| DRY / Reuso | 5% | 2/10 | 22+ definições de formatMoney, 6+ filtros duplicados, layouts duplicados |
| UX / Acessibilidade | 5% | 4/10 | Visual consistente, mas zero acessibilidade, sem skeletons, sem error boundaries |
| APIs | 10% | 4/10 | Rotas funcionais, mas sem validação, sem cache, sem retry, sem tipagem Prisma |
| Build / Tooling | 10% | 4/10 | Sem ESLint, target ES2017, next.config com API depreciada, sem script de type-check |
| **TOTAL** | **100%** | **52** | |

---

# PRONTO PARA PRODUÇÃO?

### Pequena escala (< 5.000 produtos, < 10 usuários)
**SIM, com ressalvas.** O sistema funciona para o caso de uso atual (uma loja de autopeças de motos). As correções críticas de segurança (XSS, JWT fallback) devem ser feitas antes de expor na internet.

### Média escala (5.000-50.000 produtos, 10-50 usuários)
**NÃO sem refatoração.** O fetch completo de `/api/pecas` a cada mensagem e a ausência de cache tornariam o sistema inutilizável. O God Hook precisa ser dividido. Precisa de paginação server-side e React Query.

### Grande escala (50.000+ produtos, 50+ usuários)
**NÃO.** O sistema precisaria de re-arquitetura significativa: divisão do monólito em micro-serviços, cache Redis, fila de mensagens para o assistente IA, virtualização de listas, code splitting agressivo, edge caching para a vitrine.

---

# PRÓXIMOS PASSOS SUGERIDOS

**Fase 14 (urgente):** Corrigir CR-1 a CR-7 (problemas críticos de segurança e estabilidade)  
**Fase 15:** Separar o God Hook em hooks especializados  
**Fase 16:** Adotar React Query + React Context para estado global  
**Fase 17:** Implementar lazy loading com `next/dynamic`  
**Fase 18:** Adicionar ESLint + validação Zod + testes

---

*Relatório gerado por auditoria automatizada de 13 fases em 109 arquivos.*
*Nenhuma alteração foi feita nos arquivos durante esta auditoria.*
