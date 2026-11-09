// Comprovante interno do pedido (sem valor fiscal). Puro: usado no Caixa (navegador)
// e na página do link enviado ao cliente (servidor).
import { DADOS_EMPRESA } from './dados-empresa';
import { codigoPedido } from './codigo-pedido';

export const dinheiro = (v: unknown) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const formas: Record<string, string> = { PIX: 'PIX', DINHEIRO: 'Dinheiro', CARTAO_DEBITO: 'Cartão de débito', CARTAO_CREDITO: 'Cartão de crédito' };
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function maoDeObra(pedido: any) {
  if (pedido?.tipo !== 'ORDEM_SERVICO') return (pedido?.servicos || []).reduce((s: number, i: any) => s + Math.round(Number(i.valor) * 100), 0) / 100;
  const pecas = (pedido.itens || []).reduce((s: number, i: any) => s + Math.round(Number(i.precoOriginal) * 100) * Number(i.quantidade), 0);
  return Math.max(0, Math.round(Number(pedido.subtotal) * 100) - pecas) / 100;
}

/** Descrição de um pagamento: forma, modalidade do crédito e parcelas. */
export function descreverPagamento(p: any) {
  const forma = formas[p.tipo] || p.tipo;
  if (p.tipo !== 'CARTAO_CREDITO') return forma;
  const n = Number(p.parcelas) || 1;
  if (n <= 1) return `${forma} · à vista`;
  const total = Math.round(Number(p.valor) * 100);
  const base = Math.floor(total / n);
  const ultima = total - base * (n - 1);
  return `${forma} · parcelado ${n}x de ${dinheiro(base / 100)}${ultima !== base ? ` (última ${dinheiro(ultima / 100)})` : ''} sem juros`;
}

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

export type OpcoesComprovante = { segundaVia?: boolean; formato?: 'a4' | 'termica'; publico?: boolean };

export function htmlComprovante(pedido: any, venda?: any, opcoes: OpcoesComprovante = {}) {
  const { segundaVia = false, formato = 'a4', publico = false } = opcoes;
  // A receipt must always belong to this persistent order, including reprints.
  if (venda && venda.pedidoId !== pedido.id) venda = undefined;
  const pago = venda?.status === 'PAGA' && pedido.status === 'PAGO';
  const itens = venda?.itens || pedido.itens || [];
  const linhasServico = pedido.tipo === 'ORDEM_SERVICO' ? [] : pedido.servicos || [];
  const servicos = linhasServico.length ? 0 : maoDeObra(pedido);
  const data = new Date(venda?.createdAt || pedido.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' });
  const os = pedido.ordemServico;
  // Link público: telefone mascarado para não expor o contato completo.
  const telefone = pedido.clienteTelefone ? (publico ? String(pedido.clienteTelefone).replace(/\d(?=\d{4})/g, '•') : pedido.clienteTelefone) : '';
  const termica = formato === 'termica';
  const css = termica
    ? `*{box-sizing:border-box}body{font:12px 'Courier New',monospace;color:#000;width:76mm;max-width:100%;margin:0 auto;padding:3mm}header{text-align:center;border-bottom:1px dashed #000;padding-bottom:6px}h1{font-size:15px;margin:0 0 4px}p{margin:2px 0;line-height:1.35}.code{font-size:18px;font-weight:bold;text-align:center;margin-top:6px}.stamp{text-align:center;font-size:16px;font-weight:bold;border:2px solid #000;margin:6px 0;padding:3px}table{width:100%;border-collapse:collapse;margin:6px 0}td,th{padding:3px 0;text-align:left;vertical-align:top;border-bottom:1px dashed #999;font-size:11px}th{font-size:10px}.right{text-align:right}.totals p{display:flex;justify-content:space-between}.total{font-size:15px;font-weight:bold}footer{border-top:1px dashed #000;margin-top:8px;padding-top:6px;font-size:10px;text-align:center}td{overflow-wrap:anywhere}@page{size:80mm auto;margin:2mm}`
    : `*{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#152236;max-width:760px;margin:30px auto;padding:20px}header{text-align:center;border-bottom:2px solid #152236;padding-bottom:20px}h1{font-size:24px;margin:0 0 8px}p{line-height:1.6;margin:4px 0}.code{font-size:28px;letter-spacing:2px;font-weight:bold}.stamp{display:inline-block;border:3px solid #087d4d;color:#087d4d;font-size:26px;font-weight:bold;padding:7px 22px;margin:16px 0}.pending{color:#875a00;border-color:#875a00;font-size:18px}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{padding:10px 6px;text-align:left;border-bottom:1px solid #ddd}th{font-size:11px;text-transform:uppercase}.right{text-align:right}.totals{margin-left:auto;max-width:300px}.totals p{display:flex;justify-content:space-between}.total{font-size:22px;font-weight:bold}footer{border-top:1px solid #ccc;margin-top:25px;padding-top:12px;font-size:11px;text-align:center}td{overflow-wrap:anywhere}@media print{body{margin:0;max-width:none}@page{size:A4;margin:12mm}}@media (max-width:600px){body{margin:0;padding:14px;font-size:13px}.code{font-size:22px}}`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Comprovante ${codigoPedido(pedido)}</title><style>${css}</style></head><body><header><h1>${esc(DADOS_EMPRESA.fantasia)}</h1><p>${esc(DADOS_EMPRESA.razao)}</p>${cnpjValido(DADOS_EMPRESA.cnpj) ? `<p>CNPJ: ${esc(DADOS_EMPRESA.cnpj)}</p>` : ''}<p>${esc(DADOS_EMPRESA.endereco)} — ${esc(DADOS_EMPRESA.cidade)}</p><p>${esc(DADOS_EMPRESA.telefone1)} / ${esc(DADOS_EMPRESA.telefone2)}</p></header>
  <p class="code">Pedido ${codigoPedido(pedido)}</p><div class="stamp ${pago ? '' : 'pending'}">${pago ? 'PAGO' : pedido.status === 'ABERTO' ? 'OS EM ABERTO' : 'AGUARDANDO PAGAMENTO'}</div>${pago && segundaVia ? '<p><strong>2ª VIA</strong></p>' : ''}<p>${esc(data)}</p>${pago && venda?.numero ? `<p>Venda nº ${esc(venda.numero)}</p>` : ''}${pedido.clienteNome ? `<p>Cliente: ${esc(pedido.clienteNome)}</p>` : ''}${telefone ? `<p>Telefone: ${esc(telefone)}</p>` : ''}
  ${os ? `<p>OS nº ${esc(os.numero)}${os.modeloMoto && os.modeloMoto !== 'Nao informado' ? ` · Moto: ${esc(os.modeloMoto)}` : ''}${os.placaMoto ? ` · Placa: ${esc(os.placaMoto)}` : ''}${os.anoMoto ? ` · Ano: ${esc(os.anoMoto)}` : ''}${os.kmAtual ? ` · KM: ${esc(os.kmAtual)}` : ''}</p>${os.descricaoProblema ? `<p>Problema relatado: ${esc(os.descricaoProblema)}</p>` : ''}` : ''}
  <table><thead><tr><th>Produto</th><th>Qtd.</th><th class="right">Unitário</th><th class="right">Valor</th></tr></thead><tbody>${itens.map((i: any) => `<tr><td>${esc(i.peca?.nome)}<br><small>${esc(i.peca?.codigo)}</small></td><td>${esc(i.quantidade)}</td><td class="right">${dinheiro(i.precoVendido)}</td><td class="right">${dinheiro(i.subtotal)}</td></tr>`).join('')}${linhasServico.map((i: any) => `<tr><td>${esc(i.nome)}<br><small>Serviço</small></td><td>1</td><td class="right">${dinheiro(i.valor)}</td><td class="right">${dinheiro(i.valor)}</td></tr>`).join('')}</tbody></table>
  ${servicos > 0 ? `<p>Serviços / mão de obra: ${dinheiro(servicos)}</p>` : ''}<div class="totals"><p><span>Subtotal</span><span>${dinheiro(pedido.subtotal)}</span></p><p><span>Descontos</span><span>${dinheiro(pedido.descontoTotal)}</span></p><p class="total"><span>Total</span><span>${dinheiro(pedido.total)}</span></p></div>
  ${pago ? `<h3>Pagamento</h3>${(venda.pagamentos || []).map((p: any) => `<p>${esc(descreverPagamento(p))}: ${dinheiro(p.valor)}${Number(p.troco) > 0 ? ` · Recebido: ${dinheiro(Number(p.valor) + Number(p.troco))} · Troco: ${dinheiro(p.troco)}` : ''}</p>`).join('')}<p>Operador: ${esc(venda.operadorNome || venda.criadoPor)}</p>` : pedido.status === 'ABERTO' ? '<p>OS em aberto no Atendimento. Ainda não enviada ao caixa.</p>' : '<p>Apresente este código no caixa. Este pedido ainda não foi pago.</p>'}<footer>DOCUMENTO INTERNO SEM VALOR FISCAL<br>Comprovante interno. Não substitui NF-e ou NFC-e.</footer></body></html>`;
}
