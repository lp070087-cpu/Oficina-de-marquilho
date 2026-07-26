import type { FichaCadastro, CampoStatus } from '@/components/assistente-ia/Types/cadastro.types';

export function parseTextoParaFicha(texto: string): Partial<FichaCadastro> {
  const t = texto.trim();
  const result: Partial<FichaCadastro> = {};
  const nomeMatch = t.match(/^(.+?)(?:,|\.|\n|marca|pre[çc]o|valor|quantidade|categoria|aplica[çc][ãa]o|fornecedor|localiza[çc][ãa]o|obs)/i);
  if (nomeMatch && nomeMatch[1].trim().length > 2) { result.nome = nomeMatch[1].trim(); }
  const marcaMatch = t.match(/(?:marca|fabricante)\s*(?:[:\-]\s*)?([A-Za-zÀ-ÿ0-9\s]+?)(?:,|\.|\n|$|pre[çc]o|valor|quantidade|categoria|aplica)/i);
  if (marcaMatch) result.marca = marcaMatch[1].trim();
  const precoMatch = t.match(/(?:pre[çc]o|valor)\s*(?:[:\-]\s*)?(?:R\$?\s*)?(\d+[.,]?\d*)/i);
  if (precoMatch) result.preco = precoMatch[1].replace(',', '.');
  const qtdMatch = t.match(/(?:quantidade|qtd|estoque)\s*(?:[:\-]\s*)?(\d+)/i);
  if (qtdMatch) result.quantidade = qtdMatch[1];
  const catMatch = t.match(/(?:categoria|tipo)\s*(?:[:\-]\s*)?([A-Za-zÀ-ÿ\s]+?)(?:,|\.|\n|$|pre[çc]o|marca|valor|quantidade)/i);
  if (catMatch) result.categoria = catMatch[1].trim();
  const aplMatch = t.match(/(?:aplica[çc][ãa]o|compat[ií]vel\s+com|serve\s+(?:para|em))\s*(?:[:\-]\s*)?(.+?)(?:,|\.|\n|$|pre[çc]o|marca|valor)/i);
  if (aplMatch) result.aplicacao = aplMatch[1].trim();
  const fornMatch = t.match(/(?:fornecedor|distribuidor)\s*(?:[:\-]\s*)?([A-Za-zÀ-ÿ0-9\s]+?)(?:,|\.|\n|$)/i);
  if (fornMatch) result.fornecedor = fornMatch[1].trim();
  const locMatch = t.match(/(?:localiza[çc][ãa]o|prateleira|gaveta|corredor)\s*(?:[:\-]\s*)?([A-Za-zÀ-ÿ0-9\-]+)/i);
  if (locMatch) result.localizacao = locMatch[1].trim();
  return result;
}

export function obterCamposFicha(ficha: FichaCadastro): CampoStatus[] {
  return [
    { campo: 'codigo', label: 'Código', valor: ficha.codigo, status: ficha.codigo ? 'preenchido' : 'pendente', icon: '🏷️' },
    { campo: 'nome', label: 'Nome', valor: ficha.nome, status: ficha.nome ? 'preenchido' : 'pendente', icon: '📝' },
    { campo: 'categoria', label: 'Categoria', valor: ficha.categoria, status: ficha.categoria ? 'preenchido' : 'pendente', icon: '📂' },
    { campo: 'marca', label: 'Marca', valor: ficha.marca, status: ficha.marca ? 'preenchido' : 'pendente', icon: '🏭' },
    { campo: 'aplicacao', label: 'Aplicação', valor: ficha.aplicacao, status: ficha.aplicacao ? 'preenchido' : 'pendente', icon: '🔧' },
    { campo: 'preco', label: 'Preço', valor: ficha.preco, status: ficha.preco ? 'preenchido' : 'pendente', icon: '💰' },
    { campo: 'quantidade', label: 'Quantidade', valor: ficha.quantidade, status: ficha.quantidade && ficha.quantidade !== '0' ? 'preenchido' : 'pendente', icon: '📦' },
    { campo: 'fornecedor', label: 'Fornecedor', valor: ficha.fornecedor, status: ficha.fornecedor ? 'preenchido' : 'pendente', icon: '🚚' },
    { campo: 'localizacao', label: 'Localização', valor: ficha.localizacao, status: ficha.localizacao ? 'preenchido' : 'pendente', icon: '📍' },
    { campo: 'observacoes', label: 'Observações', valor: ficha.observacoes, status: ficha.observacoes ? 'preenchido' : 'pendente', icon: '📋' },
    { campo: 'imagem', label: 'Imagem', valor: ficha.imagemPreview ? '✔' : '', status: ficha.imagemPreview ? 'preenchido' : 'pendente', icon: '🖼️' },
  ];
}

export function calcularProgresso(ficha: FichaCadastro): number {
  const campos = obterCamposFicha(ficha);
  const preenchidos = campos.filter(c => c.status === 'preenchido').length;
  return Math.round((preenchidos / campos.length) * 100);
}
