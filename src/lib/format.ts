/**
 * Utilitários de formatação compartilhados.
 * Centraliza funções que estavam duplicadas em 20+ arquivos.
 */

/** Formata valor como moeda BRL */
export function formatMoney(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Alias curto para compatibilidade com código existente */
export const fm = formatMoney;

/** Status de Ordens de Serviço — cores Tailwind */
export const STATUS_OS_COLORS: Record<string, string> = {
  'aberta': 'bg-blue-100 text-blue-700',
  'em_andamento': 'bg-amber-100 text-amber-700',
  'aguardando_pecas': 'bg-purple-100 text-purple-700',
  'concluida': 'bg-emerald-100 text-emerald-700',
  'entregue': 'bg-slate-100 text-slate-700',
  'cancelada': 'bg-red-100 text-red-700',
};

/** Status de Ordens de Serviço — labels */
export const STATUS_OS_LABELS: Record<string, string> = {
  'aberta': 'Aberta',
  'em_andamento': 'Em andamento',
  'aguardando_pecas': 'Aguardando peças',
  'concluida': 'Concluída',
  'entregue': 'Entregue',
  'cancelada': 'Cancelada',
};

/** Remove caracteres de moeda (R$, espaços) para parsing numérico */
export function limparMoeda(val: string): string {
  return val.replace(/[R$\s]/g, '');
}

/** Tipos de serviço padrão para OS */
export const TIPOS_SERVICO = [
  'Revisão', 'Troca de óleo', 'Elétrica', 'Suspensão',
  'Freios', 'Motor', 'Transmissão', 'Pneus', 'Diagnóstico',
  'Geral', 'Outros',
] as const;
