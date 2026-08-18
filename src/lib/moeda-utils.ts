/**
 * Máscara monetária "jeito de maquininha".
 *
 * Os dígitos entram pela DIREITA e o valor sempre tem 2 casas decimais:
 *   digita 1  → 0,01
 *   digita 5  → 0,15
 *   digita 0  → 1,50
 *   digita 0  → 15,00
 * Backspace remove o último dígito (15,00 → 1,50).
 *
 * Uso num input controlado:
 *   const [v, setV] = useState('');
 *   <input value={v} onChange={e => setV(mascaraMoeda(e.target.value, v))} />
 */

/** Converte "15,00" ou "15.00" → número 15. Retorna 0 para vazio/inválido. */
export function parseMoeda(v: string): number {
  const s = (v || '').trim();
  if (!s) return 0;
  const n = Number(s.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Formata um número com exatamente 2 casas decimais, separador "," (sem símbolo). */
export function fmtMoeda(v: number): string {
  return (Math.round((Number.isFinite(v) ? v : 0) * 100) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Aplica a máscara de maquininha.
 * @param novo  valor bruto digitado (pode conter lixo que o usuário colou)
 * @param atual valor atualmente exibido (usado p/ detectar Backspace quando o campo vem vazio)
 */
export function mascaraMoeda(novo: string, atual = ''): string {
  // Backspace: o browser entrega o valor JÁ sem o último dígito; para "maquininha"
  // removemos o último dígito da string numérica e reformatamos.
  if (novo.length < atual.length) {
    // Remove tudo que não é dígito do valor atual e solta o último dígito.
    const digitosAtual = atual.replace(/\D/g, '');
    const digitos = digitosAtual.slice(0, -1);
    return formatarDigitos(digitos);
  }

  // Digitação normal / colagem: extrai apenas dígitos e usa os últimos N.
  const digitos = novo.replace(/\D/g, '');
  return formatarDigitos(digitos);
}

function formatarDigitos(digitosRaw: string): string {
  // Máximo razoável (centavos de reais) — evita estouro de UI.
  const digitos = digitosRaw.replace(/^0+/, '') || '0';
  // Agrupa da direita: separa os 2 últimos como centavos.
  const len = digitos.length;
  const cents = digitos.slice(-2);
  const reais = len > 2 ? digitos.slice(0, -2) : '0';
  const reaisComPontos = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${reaisComPontos},${cents}`;
}
