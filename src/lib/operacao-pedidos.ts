import type { SessionUser } from './auth';

export const PENDENTES = ['ABERTO', 'RESERVADO', 'SEPARADO', 'AGUARDANDO_PAGAMENTO'];
export const podeReceber = (s: SessionUser | null) => !!s && (s.role === 'DONO' || (s.role === 'BALCAO' && s.tipoBalcao === 'SERVICOS'));
export const podeAtender = (s: SessionUser | null) => !!s && (s.role === 'DONO' || (s.role === 'BALCAO' && s.tipoBalcao === 'VENDA_LOJA'));
export { codigoPedido } from './codigo-pedido';
export class OperacaoErro extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function centavos(valor: unknown): number {
  if ((typeof valor !== 'number' && typeof valor !== 'string') || valor === '' || !Number.isFinite(Number(valor)) || Math.abs(Number(valor)) > 100000000) throw new OperacaoErro('Valor monetario invalido');
  return Math.round(Number(valor) * 100);
}
export function quantidadeValida(valor: unknown): number {
  const n = Number(valor);
  if (!Number.isSafeInteger(n) || n <= 0 || n > 100000) throw new OperacaoErro('Quantidade deve ser um inteiro positivo');
  return n;
}
