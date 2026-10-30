'use client';

import { DADOS_EMPRESA } from '@/lib/imprimirNotaServico';

export const dinheiro = (v: unknown) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const codigoPedido = (n: number) => `MP-${String(n).padStart(6, '0')}`;
export const formas: Record<string, string> = { PIX: 'PIX', DINHEIRO: 'Dinheiro', CARTAO_DEBITO: 'Cartão de débito', CARTAO_CREDITO: 'Cartão de crédito' };
export function maoDeObra(pedido: any) {
  if (pedido?.tipo !== 'ORDEM_SERVICO') return 0;
  const pecas = (pedido.itens || []).reduce((s: number, i: any) => s + Math.round(Number(i.precoOriginal) * 100) * Number(i.quantidade), 0);
  return Math.max(0, Math.round(Number(pedido.subtotal) * 100) - pecas) / 100;
}
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function cnpjValido(valor: string) {
  const n = valor.replace(/\D/g, '');
  if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false;
  for (let size = 12; size <= 13; size++) {
    let sum = 0, weight = size - 7;
    for (let i = 0; i < size; i++) { sum += Number(n[i]) * weight--; if (weight < 2) weight = 9; }
    const digit = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (Number(n[size]) !== digit) return false;
  }
  return true;
}

export function htmlComprovante(pedido: any, venda?: any, segundaVia = false) {
  // A receipt must always belong to this persistent order, including reprints.
  if (venda && venda.pedidoId !== pedido.id) venda = undefined;
  const pago = venda?.status === 'PAGA' && pedido.status === 'PAGO';
  const itens = venda?.itens || pedido.itens || [];
  const servicos = maoDeObra(pedido);
  const data = new Date(venda?.createdAt || pedido.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' });
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${codigoPedido(pedido.numero)}</title><style>
  *{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#152236;max-width:760px;margin:30px auto;padding:20px}header{text-align:center;border-bottom:2px solid #152236;padding-bottom:20px}h1{font-size:24px;margin:0 0 8px}p{line-height:1.6;margin:4px 0}.code{font-size:28px;letter-spacing:3px;font-weight:bold}.stamp{display:inline-block;border:3px solid #087d4d;color:#087d4d;font-size:26px;font-weight:bold;padding:7px 22px;margin:16px 0}.pending{color:#875a00;border-color:#875a00;font-size:18px}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{padding:10px 6px;text-align:left;border-bottom:1px solid #ddd}th{font-size:11px;text-transform:uppercase}.right{text-align:right}.totals{margin-left:auto;max-width:300px}.totals p{display:flex;justify-content:space-between}.total{font-size:22px;font-weight:bold}footer{border-top:1px solid #ccc;margin-top:25px;padding-top:12px;font-size:11px;text-align:center}td{overflow-wrap:anywhere}@media print{body{margin:0;max-width:none}@page{margin:12mm}}@media print and (max-width:80mm){@page{margin:2mm}body{width:100%;padding:2mm;font-size:10px}h1{font-size:16px}.code{font-size:20px}td,th{padding:5px 2px}.total{font-size:16px}header{padding-bottom:8px}table{margin:10px 0}}
  </style></head><body><header><h1>${esc(DADOS_EMPRESA.fantasia)}</h1><p>${esc(DADOS_EMPRESA.razao)}</p>${cnpjValido(DADOS_EMPRESA.cnpj) ? `<p>CNPJ: ${esc(DADOS_EMPRESA.cnpj)}</p>` : ''}<p>${esc(DADOS_EMPRESA.endereco)} — ${esc(DADOS_EMPRESA.cidade)}</p><p>${esc(DADOS_EMPRESA.telefone1)} / ${esc(DADOS_EMPRESA.telefone2)}</p></header>
  <p class="code">${codigoPedido(pedido.numero)}</p><div class="stamp ${pago ? '' : 'pending'}">${pago ? 'PAGO' : 'AGUARDANDO PAGAMENTO'}</div>${pago && segundaVia ? '<p><strong>2ª VIA</strong></p>' : ''}<p>${esc(data)}</p>${pedido.clienteNome ? `<p>Cliente: ${esc(pedido.clienteNome)}</p>` : ''}${pedido.clienteTelefone ? `<p>Telefone: ${esc(pedido.clienteTelefone)}</p>` : ''}
  <table><thead><tr><th>Produto</th><th>Qtd.</th><th class="right">Unitário</th><th class="right">Valor</th></tr></thead><tbody>${itens.map((i: any) => `<tr><td>${esc(i.peca?.nome)}<br><small>${esc(i.peca?.codigo)}</small></td><td>${esc(i.quantidade)}</td><td class="right">${dinheiro(i.precoVendido)}</td><td class="right">${dinheiro(i.subtotal)}</td></tr>`).join('')}</tbody></table>
  ${servicos > 0 ? `<p>Serviços / mão de obra: ${dinheiro(servicos)}</p>` : ''}<div class="totals"><p><span>Subtotal</span><span>${dinheiro(pedido.subtotal)}</span></p><p><span>Descontos</span><span>${dinheiro(pedido.descontoTotal)}</span></p><p class="total"><span>Total</span><span>${dinheiro(pedido.total)}</span></p></div>
  ${pago ? `<h3>Pagamento</h3>${(venda.pagamentos || []).map((p: any) => `<p>${esc(formas[p.tipo] || p.tipo)}: ${dinheiro(p.valor)}${Number(p.troco) > 0 ? ` · Recebido: ${dinheiro(Number(p.valor) + Number(p.troco))} · Troco: ${dinheiro(p.troco)}` : ''}</p>`).join('')}<p>Operador: ${esc(venda.operadorNome || venda.criadoPor)}</p>` : '<p>Apresente este código no caixa. Este pedido ainda não foi pago.</p>'}<footer>${pedido.demo ? 'DEMONSTRAÇÃO — DADOS FICTÍCIOS<br>' : ''}COMPROVANTE INTERNO — SEM VALOR FISCAL<br>Comprovante interno. Não substitui NF-e ou NFC-e.</footer></body></html>`;
}

export function imprimirPedido(pedido: any, venda?: any, segundaVia = false) {
  const popup = window.open('', '_blank', 'width=850,height=800');
  if (!popup) throw new Error('Permita abrir a janela de impressão neste navegador.');
  popup.document.write(htmlComprovante(pedido, venda, segundaVia));
  popup.document.close();
  popup.focus();
  popup.print();
}
