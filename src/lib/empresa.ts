/**
 * FONTE ÚNICA DOS DADOS DA OFICINA PARA A VITRINE PÚBLICA.
 *
 * Os dados reais vêm de `DADOS_EMPRESA` (src/lib/imprimirNotaServico.ts), usado em TODOS
 * os documentos internos (OS, Venda, NF Manual). Este módulo apenas REUSA esses dados e
 * adiciona campos de exibição da Vitrine que NÃO existem em lugar nenhum do projeto:
 * horário de atendimento (não encontrado em nenhum config/DB) e texto institucional.
 *
 * IMPORTANTE (rodada 2026-08-19, item 8): NENHUM dado foi inventado. Telefones, CNPJ,
 * endereço e cidade vêm de DADOS_EMPRESA. Horário de atendimento: o único horário que
 * existia no projeto (RodapePremium) era "Seg-Sex: 8h às 18h · Sáb: 8h às 13h" — mantido
 * como referência e sinalizado como PENDENTE de confirmação pela DONA (não há campo no DB).
 */
import { DADOS_EMPRESA } from './imprimirNotaServico';

export const DADOS_OFICINA = {
  fantasia: DADOS_EMPRESA.fantasia,
  razao: DADOS_EMPRESA.razao,
  cnpj: DADOS_EMPRESA.cnpj,
  ie: DADOS_EMPRESA.ie,
  endereco: DADOS_EMPRESA.endereco,
  cidade: DADOS_EMPRESA.cidade,
  telefone1: DADOS_EMPRESA.telefone1,
  telefone2: DADOS_EMPRESA.telefone2,
  /** WhatsApp em formato internacional para links wa.me (derivado de telefone1). */
  whatsapp: '558198143879',
  /** Horário exibido na Vitrine. Fonte: RodapePremium (único lugar que tinha horário).
   *  PENDENTE de confirmação pela DONA — sem campo no DB/config. */
  horario: 'Seg-Sex: 8h às 18h · Sáb: 8h às 13h',
  /** Texto institucional curto para o rodapé. */
  institucional: 'Atacado & Varejo de peças para motos. Qualidade e confiança.',
} as const;
