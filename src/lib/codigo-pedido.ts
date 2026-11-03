// Código visível do pedido: número primeiro, letras e zeros depois (58 → "58-MP0000").
// Derivado só de Pedido.numero (único, autoincremento): nada é renumerado nem gravado.
// Sem dependências de servidor — usado pelo navegador e pelas APIs.
const LARGURA = 6;

export function codigoPedido(numero: number): string {
  const n = String(numero);
  return `${n}-MP${'0'.repeat(Math.max(0, LARGURA - n.length))}`;
}

/** Código antigo (MP-000058), mantido para consulta e documentos já impressos. */
export const codigoPedidoAntigo = (numero: number) => `MP-${String(numero).padStart(LARGURA, '0')}`;

export type ConsultaCodigo = { numero: number; exato: boolean } | null;

/**
 * Aceita o formato novo (58-MP0000, 58MP), o antigo (MP-000058, MP58) e o número puro (58, 000058).
 * `exato` = o operador digitou um código completo; número puro também permite localizar por prefixo.
 */
export function lerCodigoPedido(texto: string): ConsultaCodigo {
  const t = texto.trim().toUpperCase().replace(/\s+/g, '');
  let m = /^(\d{1,10})-?MP0*$/.exec(t);
  if (m) return valido(m[1], true);
  m = /^MP-?(\d{1,10})$/.exec(t);
  if (m) return valido(m[1], true);
  m = /^(\d{1,10})$/.exec(t);
  if (m) return valido(m[1], false);
  return null;
}

function valido(digitos: string, exato: boolean): ConsultaCodigo {
  const numero = Number(digitos);
  if (!Number.isSafeInteger(numero) || numero < 1 || numero > 2147483647) return null;
  return { numero, exato };
}
