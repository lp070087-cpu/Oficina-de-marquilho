# RELATÓRIO FASE C — OTIMIZAÇÃO OCR / IMAGEM

**Data:** 2026-07-31
**Escopo:** Corrigir lentidão no processamento de imagem/OCR na Entrada Inteligente
**Arquivos alterados:** 2

---

## DIAGNÓSTICO

### Problema original

Ao enviar uma imagem pela opção "Imagem / OCR", a interface ficava congelada em
"Analisando com IA..." por tempo excessivo (30-90 segundos para uma foto comum
de celular). Três causas raiz foram identificadas:

1. **OCR em resolução nativa** — O Tesseract.js recebia a imagem original sem
   nenhum redimensionamento. Uma foto de celular típica (4000×3000 pixels, ~4MB)
   era enviada direto para reconhecimento. Isso é ~12 megapixels processados
   pixel a pixel pelo Tesseract, que é O(n²) em relação às dimensões.

2. **Sem compressão** — PNGs enviados direto ao OCR sem conversão para JPEG.
   PNG é lossless e muito maior que JPEG para fotos. O Tesseract carrega a
   imagem descomprimida em memória, então o formato do arquivo importa menos que
   as dimensões — mas o tempo de decode do PNG é maior.

3. **Feedback enganoso** — O texto "Analisando com IA..." sugeria que uma API
   externa de IA estava sendo chamada, quando na verdade o Tesseract.js roda
   100% no navegador (client-side). O usuário não tinha visibilidade da etapa
   real (otimizando, carregando OCR, reconhecendo).

### O que NÃO é o problema

- O OCR **não** chama nenhuma API externa de IA — roda localmente no browser
- O problema **não** está relacionado ao timeout dos 3.000 produtos (Fase A)
- O OCR é single-image — não há processamento em lote aqui

---

## CORREÇÕES

### Arquivo 1: `src/lib/entrada-inteligente/parsers.ts`

#### 1.1 Nova função `otimizarImagem()` (linhas 278-335)

Helper que otimiza a imagem **antes** de enviar ao Tesseract:

```
Entrada: File (qualquer tamanho/resolução)
    │
    ├─ < 100KB? → skip (já é pequena)
    │
    ├─ Dentro de 1200px + PNG > 300KB? → converte para JPEG (quality 0.85)
    │
    ├─ Excede 1200px em qualquer dimensão? → redimensiona mantendo aspect ratio
    │   └─ 4000×3000 → 1200×900 (~90% redução de pixels)
    │   └─ Salva como JPEG (quality 0.85)
    │
    └─ Saída: Blob otimizado
```

**Constantes:**
- `MAX_DIM = 1200` — pixels na maior dimensão (adequado para OCR, texto legível)
- `JPEG_QUALITY = 0.85` — equilibra tamanho vs legibilidade

**Fallback:** Se otimização falhar (ex: browser não suporta canvas), usa imagem original.

#### 1.2 Nova `parseImagemOCR()` (linhas 221-272)

Substitui completamente a versão anterior (17 linhas → 97 linhas).

**Nova assinatura:**
```typescript
parseImagemOCR(file: File, onProgress?, onStatusChange?)
```

**Etapas com feedback:**
1. `onStatusChange('Otimizando imagem...')` — resize/compress
2. `onStatusChange('Carregando OCR...')` — dynamic import do Tesseract
3. `onStatusChange('Reconhecendo texto...')` — Tesseract.recognize()
4. `onProgress(pct)` — progresso 0-100% durante reconhecimento

**Diagnóstico:** `console.time` em cada etapa (OCR_TOTAL, OCR_OPTIMIZE,
OCR_TESSERACT_LOAD, OCR_RECOGNIZE). Loga tamanho antes/depois e tempo total.

#### 1.3 `parseIAText()` atualizada (linhas 338-369)

Novos parâmetros opcionais `onProgress?` e `onStatusChange?`. Quando o anexo é
imagem, delega para `parseImagemOCR()` passando os callbacks.

### Arquivo 2: `src/app/estoque/importar/page.tsx`

#### 2.1 Novo estado `statusOCR` (linha 36)

```typescript
const [statusOCR, setStatusOCR] = useState('');
```

#### 2.2 `processarArquivo()` — caminho imagem (linhas 178-182)

```typescript
setStatusOCR('Preparando...');
raw = await parseImagemOCR(file, pct => setProgressoOCR(pct), status => setStatusOCR(status));
setProgressoOCR(0);
setStatusOCR('');
```

#### 2.3 `processarIA()` — caminho IA com anexo (linhas 217-220)

```typescript
setStatusOCR('Analisando...');
const raw = await parseIAText(textoIA, anexoIA || undefined, pct => setProgressoOCR(pct), status => setStatusOCR(status));
setProgressoOCR(0);
setStatusOCR('');
```

#### 2.4 Tela "processando" atualizada (linhas 513-556)

**Antes:** Texto genérico "Pode levar alguns segundos para arquivos grandes..."

**Depois:** Três níveis de feedback:

| Estado | O que o usuário vê |
|--------|-------------------|
| `statusOCR` definido | Texto animado (pulse) com a etapa atual: "Otimizando imagem...", "Carregando OCR...", "Reconhecendo texto..." |
| `progressoOCR > 0` | Barra de progresso + "Reconhecendo texto: 45%" |
| Ambos vazios (fallback) | "Otimizando imagem e extraindo texto..." (imagem) ou texto genérico (PDF/outros) |

---

## IMPACTO ESPERADO

### Redução de processamento

| Cenário | Antes | Depois | Redução |
|---------|-------|--------|---------|
| Foto 4000×3000 (12MP) | 12 MP processados | ~1.1 MP (1200×900) | **~91%** |
| PNG 5MB screenshot | PNG direto ao OCR | JPEG ~300KB | **~94%** |
| Imagem pequena (< 100KB) | Sem alteração | Sem alteração | — |
| JPEG 800×600 | Sem alteração | Sem alteração | — |

### Tempo estimado (OCR + otimização)

| Imagem | Antes (estimado) | Depois (estimado) |
|--------|-----------------|-------------------|
| Pequena (800×600, 50KB) | 2-5s | 2-5s (sem alteração) |
| Média (1920×1080, 500KB) | 15-30s | 5-10s |
| Grande (4000×3000, 4MB) | 45-90s | 8-15s |
| PNG enorme (4000×3000, 8MB) | 60-120s | 10-18s |

*Tempos estimados — variam conforme hardware do browser e velocidade da rede para download do Tesseract worker.*

---

## O QUE NÃO FOI ALTERADO

- Layout geral da página de importação
- Fluxo de extração de produtos (parser de texto)
- Salvamento em lotes (Fase A)
- Batch lookup (Fase A)
- Log de importação (Fase A)
- Comportamento do botão "SALVAR NO ESTOQUE"
- Zero auto-save mantido
- Formatos CSV, Excel, PDF — sem alteração

---

## CHECKLIST PENDENTE

### Para executar na máquina Windows:

```bash
# 1. Verificar TypeScript
npx tsc --noEmit

# 2. Build completo
npm run build
```

### Para testar manualmente no browser (localhost:3000/estoque/importar):

- [ ] Imagem pequena (ex: screenshot 800×600)
- [ ] Imagem média (ex: foto de catálogo 1920×1080)
- [ ] Imagem grande (ex: foto de celular 4000×3000)
- [ ] Medir tempo antes/depois (abrir console F12 para ver logs)
- [ ] Confirmar que produtos são encontrados
- [ ] Confirmar que revisão aparece
- [ ] Confirmar que usuário consegue editar
- [ ] Confirmar que nada é salvo automaticamente
- [ ] Confirmar que SALVAR NO ESTOQUE funciona
- [ ] Confirmar que batch lookup funciona
- [ ] Confirmar que salvamento em lotes funciona
- [ ] Confirmar que log é criado

### Console esperado (F12):

```
[OCR] Imagem: 4230KB → 145KB otimizada
OCR_OPTIMIZE: 45.2ms
OCR_TESSERACT_LOAD: 1230.5ms
OCR_RECOGNIZE: 3420.8ms
OCR_TOTAL: 4710.3ms
[OCR] Total: 4.7s, texto extraído: 1240 caracteres
```

---

## ARQUIVOS ALTERADOS

```
src/lib/entrada-inteligente/parsers.ts  — otimizador de imagem + novo parseImagemOCR + callbacks parseIAText
src/app/estoque/importar/page.tsx       — statusOCR state + tela processando com feedback real
```

---

## RESUMO

| Ponto | Status |
|-------|--------|
| Otimizador de imagem (resize + compress) | ✅ Implementado |
| Feedback de etapa real (não "Analisando com IA...") | ✅ Implementado |
| Barra de progresso do OCR | ✅ Implementado |
| Console.time diagnóstico | ✅ Implementado |
| Callbacks propagados (parsers → page) | ✅ Implementado |
| Build (npm run build) | ⚠️ Requer Windows |
| Teste com imagens reais | ⚠️ Pendente |
