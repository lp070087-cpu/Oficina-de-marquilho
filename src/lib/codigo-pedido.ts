// Código visível do pedido.
//  • Pedidos novos: Pedido.codigoNumero, gerado no banco pela sequência "Pedido_codigoNumero_seq"
//    (nextval é atômico: dois atendentes ao mesmo tempo nunca recebem o mesmo número; valores
//    de pedidos cancelados ou de transações desfeitas nunca são reutilizados) → "6700-MP".
//  • Pedidos antigos (sem codigoNumero): continuam com o código derivado de Pedido.numero
//    ("58-MP0000"; o formato mais antigo "MP-000058" também é aceito na busca).
// Sem dependências de servidor — usado pelo navegador e pelas APIs.
const LARGURA = 6;

export type PedidoComCodigo = { numero: number; codigoNumero?: number | null };

export function codigoPedido(pedido: PedidoComCodigo | number): string {
  const p = typeof pedido === 'number' ? { numero: pedido, codigoNumero: null } : pedido;
  if (p.codigoNumero) return `${p.codigoNumero}-MP`;
  const n = String(p.numero);
  return `${n}-MP${'0'.repeat(Math.max(0, LARGURA - n.length))}`;
}

/** Código antigo (MP-000058), mantido para consulta e documentos já impressos. */
export const codigoPedidoAntigo = (numero: number) => `MP-${String(numero).padStart(LARGURA, '0')}`;

/** `digitos`: o que o operador digitou (com zeros à esquerda), usado na busca pelos últimos dígitos. */
export type ConsultaCodigo = { numero: number; exato: boolean; digitos: string } | null;

/**
 * Aceita o formato atual (6700-MP, 6700MP), o intermediário (58-MP0000), o antigo (MP-000058, MP58)
 * e o número puro (6709, 709, 09). `exato` = o operador digitou um código completo; número puro
 * localiza pelos últimos dígitos (o caixa escolhe quando houver mais de um).
 */
export function lerCodigoPedido(texto: string): ConsultaCodigo {
  const t = texto.trim().toUpperCase().replace(/\s+/g, '').replace(/^PEDIDO/, '');
  let m = /^(\d{1,10})-?MP0*$/.exec(t);
  if (m) return valido(m[1], true);
  m = /^MP-?(\d{1,10})$/.exec(t);
  if (m) return valido(m[1], true);
  m = /^(\d{1,10})$/.exec(t);
  if (m) {
    if (/^0+$/.test(m[1])) return null;
    const numero = Number(m[1]);
    return numero <= 2147483647 ? { numero, exato: false, digitos: m[1] } : null;
  }
  return null;
}

function valido(digitos: string, exato: boolean): ConsultaCodigo {
  const numero = Number(digitos);
  if (!Number.isSafeInteger(numero) || numero < 1 || numero > 2147483647) return null;
  return { numero, exato, digitos };
}
