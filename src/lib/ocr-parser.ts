// OCR Parser especializado para documentos de oficina de motopeças
// Suporta: listas de fornecedor, notas fiscais, pedidos

export interface LinhaExtraida {
  codigo: string;
  nome: string;
  quantidade: string;
  unidade: string;
  precoUnitario: string;
  precoTotal: string;
  codigoBarras?: string;
  ncm?: string;
  cfop?: string;
  categoriaId?: string;
  categoriaDetectada?: string;
  subcategoria?: string;
  confianca?: number;
}

export interface DocumentoExtraido {
  tipo: 'lista_fornecedor' | 'nota_fiscal' | 'pedido' | 'generico';
  fornecedor?: string;
  cnpj?: string;
  numeroNF?: string;
  serieNF?: string;
  dataEmissao?: string;
  chaveNF?: string;
  produtos: LinhaExtraida[];
}

// Padrões comuns de documentos de fornecedor de motopeças
const PADROES_LINHA = [
  // Padrão 1: CÓDIGO | DESCRIÇÃO | UN | QTD | VL_UNIT | VL_TOTAL
  /^(\d{3,})\s+([A-ZÀ-Ú][\w\sÀ-Ú\.\,\-\/\(\)]+?)\s+(UN|PC|KG|LT|CX|SC|JG|PR|MT)\s+(\d+[\.,]?\d*)\s+(\d+[\.,]\d{2})\s+(\d+[\.,]\d{2})/i,

  // Padrão 2: REF | PRODUTO | QTD | PREÇO
  /^([A-Z0-9\-\.\/]{4,})\s+([\w\sÀ-Ú\.\,\-\/\(\)]{5,})\s+(\d+[\.,]?\d*)\s+(\d+[\.,]\d{2})/i,

  // Padrão 3: CÓDIGO [TAB] DESCRIÇÃO [TAB] QTD [TAB] UNIT [TAB] TOTAL
  /^([A-Z0-9\-\.]{3,})\t([\w\sÀ-Ú\.\,\-\/\(\)]{3,})\t(\d+[\.,]?\d*)\t?(\d+[\.,]\d{2})?/i,

  // Padrão 4: Numérico - Descrição - Qtd
  /^(\d{4,})\s*[\-\s]\s*([\w\sÀ-Ú\.\,\-\/\(\)]{5,})\s+(\d+[\.,]?\d*)/i,
];

// Campos de fornecedor
const PADROES_FORNECEDOR = [
  /Fornecedor:?\s*([\w\sÀ-Ú\.\,\-\/\(\)]+)/i,
  /Raz[aã]o Social:?\s*([\w\sÀ-Ú\.\,\-\/\(\)]+)/i,
  /Emitente:?\s*([\w\sÀ-Ú\.\,\-\/\(\)]+)/i,
];

const PADROES_CNPJ = [
  /CNPJ:?\s*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}\-?\d{2})/i,
  /CPF\/CNPJ:?\s*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}\-?\d{2})/i,
];

const PADROES_NF = [
  /N[oº]\.?\s*N[oº]?F[-\se]?:?\s*(\d+)/i,
  /Nota Fiscal:?\s*[nN]?[oOº]?\.?\s*(\d+[\s\-\.\/]*\d*)/i,
  /NF[-\se]?:?\s*[nN]?[oOº]?\.?\s*(\d+)/i,
  /S[ée]rie:?\s*(\d+)/i,
];

const PADROES_DATA = [
  /Data:?\s*(\d{2}\/\d{2}\/\d{2,4})/i,
  /Emiss[ãa]o:?\s*(\d{2}\/\d{2}\/\d{2,4})/i,
  /(\d{2}\/\d{2}\/\d{4})/i,
  /(\d{2}\.\d{2}\.\d{4})/i,
];

const PADROES_CHAVE_NF = [
  /Chave(?:\s*de\s*Acesso)?:?\s*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/i,
  /(\d{44})/,
];

// Detecta tipo de documento
export function detectarTipoDocumento(texto: string): DocumentoExtraido['tipo'] {
  const t = texto.toLowerCase();

  if (PADROES_NF.some(p => p.test(texto)) && PADROES_CNPJ.some(p => p.test(texto))) {
    return 'nota_fiscal';
  }

  if (PADROES_FORNECEDOR.some(p => p.test(texto))) {
    if (/(pedido|ordem|compra)/i.test(t)) return 'pedido';
    return 'lista_fornecedor';
  }

  return 'generico';
}

// Extrai dados do cabeçalho (fornecedor, NF, etc)
export function extrairCabecalho(texto: string): Partial<DocumentoExtraido> {
  const cabecalho: Partial<DocumentoExtraido> = {};

  for (const padrao of PADROES_FORNECEDOR) {
    const m = texto.match(padrao);
    if (m) { cabecalho.fornecedor = m[1].trim(); break; }
  }

  for (const padrao of PADROES_CNPJ) {
    const m = texto.match(padrao);
    if (m) { cabecalho.cnpj = m[1].trim(); break; }
  }

  for (const padrao of PADROES_NF) {
    const m = texto.match(padrao);
    if (m) { cabecalho.numeroNF = m[1].trim(); break; }
  }

  for (const padrao of PADROES_DATA) {
    const m = texto.match(padrao);
    if (m) { cabecalho.dataEmissao = m[1].trim(); break; }
  }

  for (const padrao of PADROES_CHAVE_NF) {
    const m = texto.match(padrao);
    if (m) { cabecalho.chaveNF = m[1].replace(/\s/g, ''); break; }
  }

  return cabecalho;
}

// Extrai linhas de produto do texto
export function extrairProdutos(texto: string): LinhaExtraida[] {
  const linhas = texto.split('\n').filter(l => l.trim().length > 5);
  const produtos: LinhaExtraida[] = [];

  for (const linha of linhas) {
    for (const padrao of PADROES_LINHA) {
      const m = linha.match(padrao);
      if (m) {
        const produto: LinhaExtraida = {
          codigo: (m[1] || '').trim(),
          nome: (m[2] || '').trim(),
          quantidade: (m[4] || m[3] || '').replace(',', '.'),
          unidade: (m[3] || 'UN').trim(),
          precoUnitario: (m[5] || m[4] || '').replace(',', '.'),
          precoTotal: (m[6] || m[5] || '').replace(',', '.'),
        };
        produtos.push(produto);
        break;
      }
    }
  }

  return produtos;
}

// OCR completo: extrai tudo de um texto
export function processarDocumento(texto: string): DocumentoExtraido {
  const tipo = detectarTipoDocumento(texto);
  const cabecalho = extrairCabecalho(texto);
  const produtos = extrairProdutos(texto);

  return {
    tipo,
    ...cabecalho,
    produtos,
  };
}

// Tenta extrair texto de uma imagem via descrição visual
// Como não temos OCR real no browser, esta função analisa o texto que o usuário colar
export function analisarTextoCopiado(textoBruto: string): {
  produtos: LinhaExtraida[];
  fornecedor?: string;
  data?: string;
} {
  const texto = textoBruto.trim();
  const cabecalho = extrairCabecalho(texto);
  const produtos = extrairProdutos(texto);

  return {
    produtos,
    fornecedor: cabecalho.fornecedor,
    data: cabecalho.dataEmissao,
  };
}

// Valida se uma string parece ser um código de produto de motopeça
export function validarCodigoProduto(codigo: string): boolean {
  // Códigos típicos: 3+ caracteres alfanuméricos, pode ter hífen
  return /^[A-Z0-9]{1,3}[\-\.]?\d{2,}$/i.test(codigo.trim()) || /^\d{4,}$/.test(codigo.trim());
}

// Estima se uma linha é provavelmente um produto (vs cabeçalho/rodapé)
export function provavelmenteProduto(linha: string): boolean {
  const l = linha.trim();
  if (l.length < 10) return false;
  if (/^(página|page|total|subtotal|desconto|frete|icms|ipi|pis|cofins)/i.test(l)) return false;
  if (validarCodigoProduto(l.split(/[\s\t]+/)[0])) return true;
  if (/\d+[\.,]?\d*\s+(UN|PC|KG|LT|CX|SC)/i.test(l)) return true;
  return false;
}

// PENDENTE: definir fluxo real de compras da cliente
// Quando a cliente enviar as regras de negócio específicas de como ela faz pedidos,
// implementar aqui a lógica de:
// - Aprovação de pedidos
// - Recebimento parcial
// - Conferência de notas fiscais
// - Devolução de produtos
// - Atualização automática de estoque ao receber mercadoria
