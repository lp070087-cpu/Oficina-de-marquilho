// Sugestões de correção de nomes de produtos para a DONA aprovar (nada é salvo sozinho).
// Usa só o próprio catálogo + um vocabulário de motopeças. Ignora marcas, códigos,
// palavras com números e abreviações com ponto (ex.: "DIANT.", "COMPL.").
import { distancia, normalizar } from './busca-pecas';

const VOCABULARIO = `lâmpada lâmpadas óleo câmara câmbio válvula válvulas direção transmissão tração combustível velocímetro
guidão balança pinhão ignição espaçador espaçadora reservatório óptico elétrico elétrica relé pistão suspensão relação
alça guarnição admissão varão peça peças cromado cromada amortecedor pastilha pastilhas embreagem filtro corrente
rolamento rolamentos capacete retrovisor carburador bateria farol lanterna pisca manete pedal cabo acelerador freio
dianteiro dianteira traseiro traseira escapamento parafuso bengala junta vela coroa estator retificador interruptor
partida motor cilindro anel biela virabrequim bomba eixo cavalete mesa carenagem paralama bagageiro bucha tampa
engrenagem esticador tensor acionador comando disco patim sapata mangueira vareta escape refil sanfona pedaleira pneu
roda cubo chave luz completo completa inferior superior externo interno lateral central polido original kit par peso
estribo mestre bobina regulador buzina punho manopla agulha porca arruela borracha metal retentor tubo corta antena
diante esquerdo esquerda direito direita soquete fiação rabeta fixador suporte pinça tambor lona pipa`.split(/\s+/).filter(Boolean);

export type Motivo = 'espacos' | 'acento' | 'digitacao' | 'incompleta';
export type Sugestao = { id: string; codigo: string; marca: string | null; nomeAtual: string; nomeSugerido: string; motivos: Motivo[]; trocas: { de: string; para: string }[] };
type Peca = { id: string; nome: string; codigo: string; marca: string | null };

const comCaixa = (modelo: string, palavra: string) =>
  modelo === modelo.toUpperCase() ? palavra.toUpperCase()
    : modelo[0] === modelo[0].toUpperCase() ? palavra[0].toUpperCase() + palavra.slice(1)
      : palavra;
const somenteLetras = (t: string) => /^\p{L}+$/u.test(t);
const plural = (a: string, b: string) => a + 's' === b || b + 's' === a || a + 'es' === b || b + 'es' === a;
// direito/direita, completo/completa: variação de gênero não é erro.
const genero = (a: string, b: string) => a.length === b.length && a.slice(0, -1) === b.slice(0, -1) && /[ao]/.test(a.slice(-1)) && /[ao]/.test(b.slice(-1));
const PREPOSICOES = ['de', 'do', 'da'];

export function sugerirNomes(pecas: Peca[]): Sugestao[] {
  // Frequência de cada palavra (sem acento) e da grafia mais usada no catálogo.
  const freq = new Map<string, number>();
  const grafias = new Map<string, Map<string, number>>();
  for (const p of pecas) for (const t of p.nome.split(/[^\p{L}\p{N}]+/u)) {
    if (!somenteLetras(t)) continue;
    const k = normalizar(t), g = t.toLowerCase();
    freq.set(k, (freq.get(k) || 0) + 1);
    const m = grafias.get(k) || new Map<string, number>(); m.set(g, (m.get(g) || 0) + 1); grafias.set(k, m);
  }
  const vocab = new Map(VOCABULARIO.map(w => [normalizar(w), w]));
  const marcas = new Set(pecas.flatMap(p => normalizar(p.marca).split(/[^a-z0-9]+/)).filter(w => w.length > 1));
  const conhecidas = new Set([...vocab.keys(), ...[...freq].filter(([, n]) => n >= 3).map(([k]) => k)]);
  const canonica = (k: string) => {
    if (vocab.has(k)) return vocab.get(k)!;
    const g = [...(grafias.get(k) || [])].sort((a, b) => b[1] - a[1])[0];
    return g && g[1] >= 2 && g[0] !== k ? g[0] : null; // grafia acentuada predominante
  };
  const popularidade = (k: string) => (freq.get(k) || 0) + (vocab.has(k) ? 5 : 0);

  const sugestoes: Sugestao[] = [];
  for (const p of pecas) {
    const motivos = new Set<Motivo>();
    const trocas: { de: string; para: string }[] = [];
    const partes = p.nome.split(/([^\p{L}\p{N}]+)/u);
    for (let i = 0; i < partes.length; i += 2) {
      const t = partes[i];
      if (!t || !somenteLetras(t) || t.length < 3) continue;
      const k = normalizar(t);
      if (marcas.has(k)) continue;
      let nova: string | null = null, motivo: Motivo | null = null;
      const c = canonica(k);
      if (c && c !== t.toLowerCase() && normalizar(c) === k) { nova = c; motivo = 'acento'; }
      else if (!conhecidas.has(k) && k.length >= 6 && PREPOSICOES.includes(k.slice(0, 2)) && conhecidas.has(k.slice(2))) {
        // Preposição grudada: "decambio" → "de câmbio".
        nova = k.slice(0, 2) + ' ' + (canonica(k.slice(2)) || k.slice(2)); motivo = 'digitacao';
      }
      else if (!conhecidas.has(k) && k.length >= 4) {
        const tol = k.length >= 8 ? 2 : 1;
        const candidata = [...conhecidas].filter(w => w.length >= 4 && !plural(w, k) && !genero(w, k) && !(k.startsWith(w) && w.length < k.length) && distancia(k, w, tol) <= tol)
          .sort((a, b) => popularidade(b) - popularidade(a))[0];
        if (candidata) { nova = canonica(candidata) || candidata; motivo = 'digitacao'; }
        else if (k.length >= 5 && !(partes[i + 1] || '').startsWith('.')) {
          const completa = [...vocab.keys()].find(w => w.startsWith(k) && w.length - k.length <= 3);
          if (completa) { nova = vocab.get(completa)!; motivo = 'incompleta'; }
        }
      }
      if (nova && motivo) { const final = comCaixa(t, nova); if (final !== t) { partes[i] = final; motivos.add(motivo); trocas.push({ de: t, para: final }); } }
    }
    let sugerido = partes.join('');
    const limpo = sugerido.replace(/\s+/g, ' ').trim();
    if (limpo !== sugerido) { motivos.add('espacos'); sugerido = limpo; }
    if (sugerido !== p.nome && sugerido) sugestoes.push({ id: p.id, codigo: p.codigo, marca: p.marca, nomeAtual: p.nome, nomeSugerido: sugerido, motivos: [...motivos], trocas });
  }
  const peso = (s: Sugestao) => (s.motivos.includes('digitacao') ? 0 : s.motivos.includes('incompleta') ? 1 : s.motivos.includes('acento') ? 2 : 3);
  return sugestoes.sort((a, b) => peso(a) - peso(b) || a.nomeAtual.localeCompare(b.nomeAtual, 'pt-BR'));
}
