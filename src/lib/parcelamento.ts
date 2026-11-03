import prisma from '@/lib/prisma';

// Parcelamento no cartão de crédito — definido pela DONA, gravado em ConfiguracaoVitrine
// (chave/valor), sem migração. Não há juros nem taxas: o total parcelado é o total do pedido.
export const CHAVE_PARCELAMENTO = 'caixaParcelamento';
export const LIMITE_PARCELAS = 24;
export type ConfigParcelamento = { maxParcelas: number };
export const PARCELAMENTO_PADRAO: ConfigParcelamento = { maxParcelas: 4 };

export function validarConfig(v: unknown): ConfigParcelamento | null {
  const max = Number((v as { maxParcelas?: unknown })?.maxParcelas);
  return Number.isInteger(max) && max >= 1 && max <= LIMITE_PARCELAS ? { maxParcelas: max } : null;
}

export async function lerParcelamento(db: Pick<typeof prisma, 'configuracaoVitrine'> = prisma): Promise<ConfigParcelamento> {
  const linha = await db.configuracaoVitrine.findUnique({ where: { chave: CHAVE_PARCELAMENTO } });
  if (!linha) return PARCELAMENTO_PADRAO;
  try { return validarConfig(JSON.parse(linha.valor)) || PARCELAMENTO_PADRAO; } catch { return PARCELAMENTO_PADRAO; }
}

/** Valor de cada parcela em centavos; a última absorve o arredondamento. */
export function parcelas(totalCentavos: number, n: number): number[] {
  const base = Math.floor(totalCentavos / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? totalCentavos - base * (n - 1) : base));
}
