// Regras do WhatsApp da Oficina sem dependências de servidor (usadas também no navegador).
export const CHAVE_WHATSAPP = 'whatsappOficina';
export const MENSAGEM_PADRAO = 'Olá! Aqui é da {nomeExibicao}. Segue o comprovante referente ao seu pedido {codigoPedido}: {linkComprovante}. Obrigado pela preferência!';
export const VARIAVEIS = ['{nomeExibicao}', '{codigoPedido}', '{linkComprovante}', '{nomeCliente}', '{validade}'] as const;

export type ConfigWhatsApp = {
  numero: string;          // somente dígitos, com DDI e DDD (ex.: 5581999998888)
  nomeExibicao: string;
  ativo: boolean;          // envio de comprovantes pelo WhatsApp liberado no Caixa
  mensagem: string;
  atualizadoPor?: string | null;
  atualizadoEm?: string | null;
};
export const WHATSAPP_PADRAO: ConfigWhatsApp = { numero: '', nomeExibicao: 'Marquinho Moto Peças', ativo: true, mensagem: MENSAGEM_PADRAO };

/** DDDs válidos no Brasil (Anatel). */
const DDD_BR = new Set([11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99]);

/** Número com DDI e DDD → só dígitos, ou null. Brasil (55): DDD válido + 8 (fixo) ou 9 dígitos (celular, iniciando em 9). */
export function validarNumeroWhatsApp(entrada: unknown): string | null {
  let d = String(entrada ?? '').trim();
  if (!d) return null;
  d = d.replace(/^\+/, '').replace(/[\s().-]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith('55')) {
    const ddd = Number(d.slice(2, 4)), resto = d.slice(4);
    if (!DDD_BR.has(ddd)) return null;
    if (resto.length === 9 && resto[0] === '9') return d;
    if (resto.length === 8 && /^[2-5]/.test(resto)) return d;
    return null;
  }
  // Outros países: E.164 (DDI + número), 10 a 15 dígitos, sem zero inicial.
  return /^[1-9]\d{9,14}$/.test(d) ? d : null;
}

export function formatarNumero(d: string): string {
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(d);
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : d ? `+${d}` : '';
}

export function validarConfigWhatsApp(v: unknown): { config?: ConfigWhatsApp; erro?: string } {
  const b = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const numero = validarNumeroWhatsApp(b.numero);
  if (!numero) return { erro: 'Número inválido. Informe DDI + DDD + número, ex.: +55 (81) 99999-8888' };
  const nomeExibicao = typeof b.nomeExibicao === 'string' ? b.nomeExibicao.trim().slice(0, 60) : '';
  if (nomeExibicao.length < 2) return { erro: 'Informe o nome de exibição (2 a 60 caracteres)' };
  const mensagem = typeof b.mensagem === 'string' ? b.mensagem.trim() : '';
  if (mensagem.length < 10 || mensagem.length > 1000) return { erro: 'A mensagem padrão deve ter de 10 a 1000 caracteres' };
  if (!mensagem.includes('{linkComprovante}')) return { erro: 'A mensagem precisa conter {linkComprovante}' };
  if (typeof b.ativo !== 'boolean') return { erro: 'Informe se o envio está ativo' };
  return { config: { numero, nomeExibicao, ativo: b.ativo, mensagem } };
}

/** Preenche a mensagem padrão. O link é sempre incluído, mesmo se a variável for removida. */
export function montarMensagem(modelo: string, dados: { nomeExibicao: string; codigoPedido: string; linkComprovante: string; nomeCliente?: string | null; validade?: string }) {
  const valores: Record<string, string> = {
    '{nomeExibicao}': dados.nomeExibicao, '{codigoPedido}': dados.codigoPedido, '{linkComprovante}': dados.linkComprovante,
    '{nomeCliente}': dados.nomeCliente || 'cliente', '{validade}': dados.validade || '',
  };
  let texto = modelo.replace(/\{(nomeExibicao|codigoPedido|linkComprovante|nomeCliente|validade)\}/g, m => valores[m] ?? m);
  if (!texto.includes(dados.linkComprovante)) texto += `\n${dados.linkComprovante}`;
  return texto;
}
