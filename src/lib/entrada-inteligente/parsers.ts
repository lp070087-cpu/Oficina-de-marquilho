// Parsers para cada formato de entrada de estoque
import { ProdutoExtraido } from './types';

let idCounter = 0;
function uid(): string { return `tmp_${Date.now()}_${++idCounter}_${Math.random().toString(36).slice(2, 8)}`; }

function emptyProduto(): ProdutoExtraido {
  return {
    id: uid(), codigo: '', codigoBarras: '', ean: '',
    nome: '', descricao: '', marca: '', categoria: '', subcategoria: '',
    compatibilidade: '', modelo: '', ano: '', aplicacao: '', fornecedor: '',
    precoCusto: '', precoVenda: '', quantidade: '0', quantidadeLoja: '0',
    estoqueMinimo: '5', unidade: 'UN', localizacao: '', observacoes: '',
    status: 'novo', selecionado: true,
  };
}

// ─── CSV PARSER ────────────────────────────────────────────────
export async function parseCSV(texto: string): Promise<Partial<ProdutoExtraido>[]> {
  const lines = texto.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Detecta delimitador (vírgula ou ponto-e-vírgula)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === delimiter && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map((h: string) => h.toLowerCase().replace(/["']/g, '').trim());
  const dataLines = lines.slice(1);

  const produtos: Partial<ProdutoExtraido>[] = [];

  for (const line of dataLines) {
    const cols = splitLine(line);
    if (cols.length === 0 || cols.every(c => !c)) continue;

    const get = (keys: string[]): string => {
      for (const k of keys) {
        const idx = headers.findIndex(h => h === k || h.includes(k));
        if (idx >= 0 && cols[idx]) return cols[idx].trim();
      }
      return '';
    };

    const nome = get(['nome', 'produto', 'descricao', 'desc', 'descrição', 'item']);
    const codigo = get(['codigo', 'cod', 'sku', 'código', 'ref', 'referencia']);

    produtos.push({
      codigo,
      codigoBarras: get(['barras', 'barcode', 'código de barras', 'codigo_barras', 'ean']),
      ean: get(['ean', 'gtin']),
      nome,
      descricao: get(['descricao', 'descrição', 'desc_completa', 'detalhes']),
      marca: get(['marca', 'brand', 'fabricante']),
      categoria: get(['categoria', 'grupo', 'tipo', 'cat']),
      subcategoria: get(['subcategoria', 'subgrupo', 'sub_categoria']),
      compatibilidade: get(['compatibilidade', 'aplicacao', 'aplicação', 'veiculo', 'veículo', 'modelo']),
      modelo: get(['modelo', 'moto']),
      ano: get(['ano', 'year']),
      fornecedor: get(['fornecedor', 'supplier', 'distribuidor']),
      precoCusto: get(['custo', 'preco_custo', 'preço_custo', 'pc']).replace(/[R$\s]/g, ''),
      precoVenda: get(['venda', 'preco_venda', 'preço_venda', 'pv', 'preco']).replace(/[R$\s]/g, ''),
      quantidade: get(['quantidade', 'qtd', 'estoque', 'saldo', 'qty']),
      quantidadeLoja: get(['loja', 'qtd_loja', 'quantidade_loja']),
      estoqueMinimo: get(['minimo', 'min', 'estoque_minimo', 'estoque_min']),
      unidade: get(['unidade', 'un', 'und', 'unit']),
      localizacao: get(['localizacao', 'localização', 'local', 'endereco']),
      observacoes: get(['obs', 'observacoes', 'observações', 'notas']),
    });
  }

  return produtos;
}

// ─── EXCEL PARSER ──────────────────────────────────────────────
export async function parseExcel(buffer: ArrayBuffer): Promise<Partial<ProdutoExtraido>[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const allData: any[][] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
    if (json.length >= 2) allData.push(...json);
  }

  if (allData.length < 2) return [];

  const headers = (allData[0] as string[]).map((h: string) => String(h || '').toLowerCase().trim());
  const rows = allData.slice(1);

  const getCol = (row: any[], keys: string[]): string => {
    for (const k of keys) {
      const idx = headers.findIndex(h => h === k || h.includes(k));
      if (idx >= 0 && row[idx] !== undefined && row[idx] !== '') {
        return String(row[idx]).trim();
      }
    }
    return '';
  };

  return rows.filter((row: any[]) => row.some(c => c !== '')).map((row: any[]) => ({
    codigo: getCol(row, ['codigo', 'cod', 'sku', 'código', 'ref']),
    codigoBarras: getCol(row, ['barras', 'barcode', 'ean', 'codigo_barras']),
    ean: getCol(row, ['ean', 'gtin']),
    nome: getCol(row, ['nome', 'produto', 'descricao', 'descrição', 'desc']),
    descricao: getCol(row, ['descricao', 'descrição', 'desc_completa', 'detalhes']),
    marca: getCol(row, ['marca', 'brand', 'fabricante']),
    categoria: getCol(row, ['categoria', 'grupo', 'tipo']),
    subcategoria: getCol(row, ['subcategoria', 'subgrupo']),
    compatibilidade: getCol(row, ['compatibilidade', 'aplicacao', 'aplicação', 'veiculo']),
    modelo: getCol(row, ['modelo', 'moto']),
    ano: getCol(row, ['ano', 'year']),
    fornecedor: getCol(row, ['fornecedor', 'supplier', 'distribuidor']),
    precoCusto: getCol(row, ['custo', 'preco_custo', 'pc']).replace(/[R$\s]/g, ''),
    precoVenda: getCol(row, ['venda', 'preco_venda', 'pv', 'preco']).replace(/[R$\s]/g, ''),
    quantidade: getCol(row, ['quantidade', 'qtd', 'estoque', 'saldo']),
    quantidadeLoja: getCol(row, ['loja', 'qtd_loja', 'quantidade_loja']),
    estoqueMinimo: getCol(row, ['minimo', 'min', 'estoque_minimo']),
    unidade: getCol(row, ['unidade', 'un', 'und']),
    localizacao: getCol(row, ['localizacao', 'localização', 'local']),
    observacoes: getCol(row, ['obs', 'observacoes', 'notas']),
  }));
}

// ─── PDF PARSER ────────────────────────────────────────────────
export async function parsePDF(file: File): Promise<Partial<ProdutoExtraido>[]> {
  // Tenta primeiro com pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Agrupa itens por posição Y (linhas)
    const byY = new Map<number, string[]>();
    for (const item of textContent.items) {
      const y = Math.round((item as any).transform?.[5] || 0);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push((item as any).str);
    }

    // Ordena linhas de cima para baixo
    const sortedYs = Array.from(byY.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const line = byY.get(y)!.join(' ').trim();
      if (line.length > 2) allLines.push(line);
    }
  }

  if (allLines.length === 0) return [];

  // Se o PDF parece ser escaneado (pouco texto), tenta OCR
  if (allLines.length < 20 && file.size > 50000) {
    return parsePDFcomOCR(file);
  }

  return extrairProdutosDeTexto(allLines.join('\n'), 'pdf');
}

// ─── OCR para PDF escaneado ou imagem ──────────────────────────
async function parsePDFcomOCR(file: File): Promise<Partial<ProdutoExtraido>[]> {
  try {
    // Converte PDF para imagem usando pdf.js e canvas
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    const Tesseract = await import('tesseract.js');
    let text = '';

    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 50); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      // Cria canvas no navegador
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imgUrl = canvas.toDataURL('image/png');

      const result = await Tesseract.recognize(imgUrl, 'por+eng', {
        logger: () => {},
      });

      text += result.data.text + '\n';
    }

    return extrairProdutosDeTexto(text, 'pdf-ocr');
  } catch {
    return [];
  }
}

// ─── IMAGEM / OCR PARSER ───────────────────────────────────────
export async function parseImagemOCR(
  file: File,
  onProgress?: (pct: number) => void,
  onStatusChange?: (status: string) => void,
): Promise<Partial<ProdutoExtraido>[]> {
  console.time('OCR_TOTAL');
  const inicio = performance.now();

  // Etapa 1: Otimizar imagem antes do OCR
  onStatusChange?.('Otimizando imagem...');
  console.time('OCR_OPTIMIZE');
  let imgUrl: string;

  try {
    const optimizedBlob = await otimizarImagem(file);
    imgUrl = URL.createObjectURL(optimizedBlob);
    const otimizadoKB = (optimizedBlob.size / 1024).toFixed(0);
    console.log(`[OCR] Imagem: ${(file.size/1024).toFixed(0)}KB → ${otimizadoKB}KB otimizada`);
  } catch {
    // Fallback: usa original se otimização falhar
    imgUrl = URL.createObjectURL(file);
    console.log('[OCR] Otimização falhou, usando imagem original');
  }
  console.timeEnd('OCR_OPTIMIZE');

  // Etapa 2: Carregar Tesseract (dynamic import do CDN)
  onStatusChange?.('Carregando OCR...');
  console.time('OCR_TESSERACT_LOAD');
  const Tesseract = await import('tesseract.js');
  console.timeEnd('OCR_TESSERACT_LOAD');

  // Etapa 3: Reconhecer texto
  onStatusChange?.('Reconhecendo texto...');
  console.time('OCR_RECOGNIZE');
  const { data } = await Tesseract.recognize(imgUrl, 'por+eng', {
    logger: (m: any) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  console.timeEnd('OCR_RECOGNIZE');

  URL.revokeObjectURL(imgUrl);

  console.timeEnd('OCR_TOTAL');
  console.log(`[OCR] Total: ${((performance.now() - inicio)/1000).toFixed(1)}s, texto extraído: ${(data.text?.length || 0)} caracteres`);

  if (!data.text || data.text.trim().length < 10) return [];

  return extrairProdutosDeTexto(data.text, 'ocr');
}

// ─── OTIMIZADOR DE IMAGEM (pré-OCR) ────────────────────────────
const MAX_DIM = 1200; // pixels na maior dimensão
const JPEG_QUALITY = 0.85;

async function otimizarImagem(file: File): Promise<Blob> {
  // Se já for uma imagem pequena, não mexe
  if (file.size < 100 * 1024) return file; // < 100KB

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Redimensiona apenas se exceder MAX_DIM
      if (width <= MAX_DIM && height <= MAX_DIM) {
        // Imagem já está em tamanho aceitável — mas converte pra JPEG se for PNG grande
        if (file.type.includes('png') && file.size > 300 * 1024) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(file); return; }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => blob ? resolve(blob) : resolve(file), 'image/jpeg', JPEG_QUALITY);
        } else {
          resolve(file);
        }
        return;
      }

      // Redimensiona mantendo proporção
      if (width > height) {
        height = Math.round(height * (MAX_DIM / width));
        width = MAX_DIM;
      } else {
        width = Math.round(width * (MAX_DIM / height));
        height = MAX_DIM;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG para OCR — menor que PNG, legibilidade preservada
      canvas.toBlob(blob => blob ? resolve(blob) : resolve(file), 'image/jpeg', JPEG_QUALITY);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback: usa original
    };

    img.src = url;
  });
}

// ─── IA TEXT PARSER ────────────────────────────────────────────
export async function parseIAText(
  texto: string,
  anexo?: File,
  onProgress?: (pct: number) => void,
  onStatusChange?: (status: string) => void,
): Promise<Partial<ProdutoExtraido>[]> {
  const produtos: Partial<ProdutoExtraido>[] = [];

  // Se tem anexo, processa conforme o tipo
  if (anexo) {
    if (anexo.type.includes('pdf') || anexo.name.endsWith('.pdf')) {
      return parsePDF(anexo);
    }
    if (anexo.type.includes('image')) {
      return parseImagemOCR(anexo, onProgress, onStatusChange);
    }
    if (anexo.name.endsWith('.csv')) {
      return parseCSV(await anexo.text());
    }
    if (anexo.name.endsWith('.xlsx') || anexo.name.endsWith('.xls')) {
      const buf = await anexo.arrayBuffer();
      return parseExcel(buf);
    }
  }

  // Processa texto descritivo
  if (texto.trim()) {
    return extrairProdutosDeTexto(texto, 'ia');
  }

  return [];
}

// ─── EXTRAÇÃO INTELIGENTE DE PRODUTOS DE TEXTO ─────────────────
function extrairProdutosDeTexto(texto: string, source: string): Partial<ProdutoExtraido>[] {
  const lines = texto.split('\n').filter(l => l.trim().length > 2);
  if (lines.length === 0) return [];

  const produtos: Partial<ProdutoExtraido>[] = [];

  // Estratégia 1: Detectar linhas com código + descrição (típico de catálogos/notas fiscais)
  const codDescPattern = /^(\d{4,})\s+(.+)$/; // "12345 DESCRIÇÃO DO PRODUTO"

  // Estratégia 2: Tabela com delimitadores
  const tablePattern = /\|?\s*(\S+)\s*\|\s*(.+?)\s*\|\s*(\d+)?\s*\|?\s*([\d.,]+)?\s*/;

  // Estratégia 3: Produto com quantidade e preço
  const qtdPrecoPattern = /(\d+)\s*(?:un|unidades?|litros?|L|kits?|pares?)\s+(?:de\s+)?(.+?)(?:\s+(?:por|a)\s+R\$\s*([\d.,]+))?/i;

  // Estratégia 4: Linhas com padrão de código de produto (letras+números)
  const skuPattern = /([A-Z0-9]{4,}[-_\/]?[A-Z0-9]{2,})/i;

  for (const line of lines) {
    let match;

    // Tenta padrão de código + descrição
    match = line.match(codDescPattern);
    if (match) {
      produtos.push({
        codigo: match[1],
        nome: extrairNome(match[2]),
        descricao: match[2],
        compatibilidade: extrairCompatibilidade(match[2]),
        marca: extrairMarca(match[2]),
      });
      continue;
    }

    // Tenta padrão de código de produto (SKU)
    match = line.match(skuPattern);
    if (match && match[1].length >= 5) {
      const restante = line.replace(match[1], '').trim();
      produtos.push({
        codigo: match[1].toUpperCase(),
        nome: extrairNome(restante || line),
        descricao: line,
        compatibilidade: extrairCompatibilidade(restante || line),
        marca: extrairMarca(restante || line),
      });
      continue;
    }

    // Tenta padrão de quantidade + nome
    match = line.match(qtdPrecoPattern);
    if (match) {
      const nome = extrairNome(match[2]);
      produtos.push({
        nome,
        descricao: match[2],
        quantidade: match[1],
        precoCusto: match[3] ? match[3].replace(',', '.') : '',
        compatibilidade: extrairCompatibilidade(match[2]),
        marca: extrairMarca(match[2]),
      });
      continue;
    }

    // Tenta padrão de tabela
    match = line.match(tablePattern);
    if (match) {
      produtos.push({
        codigo: match[1].replace(/\|/g, '').trim(),
        nome: extrairNome(match[2]),
        descricao: match[2].trim(),
        quantidade: match[3] || '1',
        precoVenda: match[4] || '',
        compatibilidade: extrairCompatibilidade(match[2]),
        marca: extrairMarca(match[2]),
      });
      continue;
    }

    // Fallback: linha genérica
    if (line.trim().length > 5) {
      produtos.push({
        nome: extrairNome(line),
        descricao: line,
        compatibilidade: extrairCompatibilidade(line),
        marca: extrairMarca(line),
      });
    }
  }

  // Calcular contagem de palavras para filtrar linhas que são certamente conteúdo
  return produtos.filter(p => p.nome || p.codigo);
}

// ─── HELPERS ───────────────────────────────────────────────────
function extrairNome(texto: string): string {
  const limpo = texto.replace(/^\W+|\W+$/g, '').trim();

  // Remove preço do final
  const semPreco = limpo.replace(/\s+R\$\s*[\d.,]+\s*$/i, '');

  // Remove quantidades do final
  const semQtd = semPreco.replace(/\s+\d+\s*(?:un|unidades?|litros?|L)$/i, '');

  return semQtd.slice(0, 120);
}

const MARCAS_MOTO = ['NGK', 'ProTork', 'Pirelli', 'Michelin', 'Metal Leve', 'Bosch', 'Vedamotors', 'Vedamotor', 'Tecfil', 'DID', 'RK', 'KMC', 'Dayco', 'Gates', 'Makita', '3M', 'Osram', 'Philips', 'Liqui Moly', 'Mobil', 'Castrol', 'Ipiranga', 'Yamaha', 'Honda', 'Suzuki', 'Kawasaki', 'IRON', 'Brose', 'Prol', 'Motospeed', 'Scud', 'Fox', 'Riffel', 'Vaz', 'Bieffe', 'LS2', 'Helt', 'Agv', 'Shoei', 'Nolan', 'Kbc', 'Norisk', 'Axxis', 'Taurus', 'Fris', 'Fly', 'Riffel', 'Tork', 'Pro Tork', 'Acerbis', 'Rtech', 'JT', 'Sunstar', 'Afam', 'Esjot', 'Vedamotors', 'Pioneer', 'Vedamotor', 'Power', 'Indusgrat', 'Magneti', 'Marelli', 'Denso', 'Keihin', 'Mikuni', 'Takasago', 'Excel', 'Mor', 'Viper', 'Dragão', 'Drag', 'ASW', 'Condor', 'Cofap', 'Nakata', 'Monroe', 'Sachs', 'Vedamotors', 'Sabó', 'Payen', 'Athena', 'Vertex', 'Wiseco', 'Prox', 'Wossner', 'JMP', 'Bardahl', 'Elf', 'Lubrax', 'Shell', 'Texaco', 'Petronas'];

function extrairMarca(texto: string): string {
  const upper = texto.toUpperCase();
  for (const m of MARCAS_MOTO) {
    if (upper.includes(m.toUpperCase())) return m;
  }
  return '';
}

// Removidos modelos de 1-2 letras (S, F, R, K, Z, GT, XT) — causam falsos positivos
const MODELOS_MOTO = ['CBR', 'XRE', 'NXR', 'CRF', 'FAN', 'BIZ', 'POP', 'TITAN', 'TWISTER', 'BROS', 'HORNET', 'PCX', 'LEAD', 'ELITE', 'XTZ', 'Fazer', 'Factor', 'Tenere', 'TDM', 'Tracer', 'Virago', 'Midnight', 'Boulevard', 'GSX', 'GSF', 'DRZ', 'Vanvan', 'Katana', 'Hayabusa', 'Ninja', 'Versys', 'Vulcan', 'GS', 'CG', 'CB', 'CBX', 'XL', 'NX', 'YS', 'MT', 'FZ', 'XJ', 'FJR', 'R1', 'R6', 'R3', 'DR', 'RM', 'RMZ', 'DL', 'ZR', 'ZRX', 'ER', 'KL', 'KLX', 'KLR', 'KX', 'ZX'];
// GS, CG, CB, MT, FZ, XJ etc kept because they're >= 2 chars and very common in motos

function extrairCompatibilidade(texto: string): string {
  const upper = texto.toUpperCase();
  const encontrados: string[] = [];

  for (const m of MODELOS_MOTO) {
    const idx = upper.indexOf(m);
    if (idx >= 0) {
      // Tenta capturar a designação completa (ex: CG 160, CB 500F)
      const after = upper.slice(idx + m.length);
      const numMatch = after.match(/^\s*(\d{1,4}\s*[A-Z]?[A-Z]?[A-Z]?)/);
      encontrados.push(numMatch ? `${m}${numMatch[1]}` : m);
    }
  }

  return encontrados.slice(0, 5).join(', ');
}
