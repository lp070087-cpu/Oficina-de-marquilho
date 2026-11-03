// Busca de peças para Atendimento/OS: sem diferenciar maiúsculas, tolerante a acentos e a
// pequenos erros de digitação (letras trocadas, m/n, letra a mais ou a menos).
// Funções puras — a rota /api/pecas/busca aplica sobre o catálogo ativo do banco.

export const normalizar = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const palavras = (s: unknown) => normalizar(s).split(/[^a-z0-9]+/).filter(Boolean);

/** Distância de Damerau-Levenshtein (com transposição), interrompida acima de `max`. */
export function distancia(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let menor = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      menor = Math.min(menor, d[i][j]);
    }
    if (menor > max) return max + 1;
  }
  return d[a.length][b.length];
}

const tolerancia = (termo: string) => (termo.length >= 7 ? 2 : termo.length >= 4 ? 1 : 0);

/** Quão bem um termo digitado casa com uma palavra do produto (0 = não casa). */
function casarTermo(termo: string, palavra: string): number {
  if (palavra === termo) return 10;
  if (palavra.startsWith(termo)) return 8;
  if (palavra.includes(termo)) return 5;
  const tol = tolerancia(termo);
  if (!tol) return 0;
  // Palavra incompleta com erro: compara o termo com o início da palavra.
  // Erro de digitação: quanto menor a distância, maior a pontuação.
  const d = Math.min(distancia(termo, palavra, tol), distancia(termo, palavra.slice(0, termo.length), tol));
  return d > tol ? 0 : d <= 1 ? 4 : 2;
}

export type PecaBusca = { id: string; nome: string; codigo: string; marca: string | null; codigoBarras: string | null; descricao?: string | null; subcategoria?: string | null; compatibilidade?: string | null };

export type IndicePeca = { nome: string[]; marca: string[]; codigo: string; barras: string; extra: string[] };

export function indexar(p: PecaBusca): IndicePeca {
  return {
    nome: palavras(p.nome),
    marca: palavras(p.marca),
    codigo: normalizar(p.codigo).replace(/[^a-z0-9]/g, ''),
    barras: normalizar(p.codigoBarras).replace(/[^a-z0-9]/g, ''),
    extra: [...palavras(p.subcategoria), ...palavras(p.compatibilidade), ...palavras(p.descricao)],
  };
}

/**
 * Pontua a relevância do produto para a consulta. Todos os termos precisam casar
 * em algum campo (nome, marca, SKU, código de barras ou dados complementares).
 */
export function relevancia(consulta: string, idx: IndicePeca): number {
  const termos = palavras(consulta);
  if (!termos.length) return 0;
  const compacta = normalizar(consulta).replace(/[^a-z0-9]/g, '');
  let codigo = 0;
  if (compacta && (idx.codigo === compacta || idx.barras === compacta)) codigo = 100;
  else if (compacta.length >= 2 && (idx.codigo.startsWith(compacta) || idx.barras.startsWith(compacta))) codigo = 40;
  else if (compacta.length >= 3 && (idx.codigo.includes(compacta) || idx.barras.includes(compacta))) codigo = 20;
  let pontos = codigo;
  let todos = true;
  for (const [n, termo] of termos.entries()) {
    let melhor = 0;
    for (const [i, w] of idx.nome.entries()) { const c = casarTermo(termo, w); if (c) melhor = Math.max(melhor, c * 2 + (i === n ? 1 : 0)); }
    for (const w of idx.marca) melhor = Math.max(melhor, casarTermo(termo, w) * 1.5);
    for (const w of idx.extra) melhor = Math.max(melhor, casarTermo(termo, w));
    if (termo.length >= 2 && (idx.codigo.includes(termo) || idx.barras.includes(termo))) melhor = Math.max(melhor, 12);
    if (!melhor) todos = false;
    pontos += melhor;
  }
  if (!todos) return codigo; // SKU/código completo casou mesmo sem os termos separados
  return pontos;
}
