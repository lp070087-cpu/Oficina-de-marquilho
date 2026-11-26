// Comprovante interno do pedido (sem valor fiscal). Puro: usado no Caixa (navegador)
// e na página do link enviado ao cliente (servidor).
import { CSS_MARCA_TERMICA, MARCA_TERMICA_HTML } from './marca-termica';
import { DADOS_EMPRESA } from './dados-empresa';
import { codigoPedido } from './codigo-pedido';
import { cabecalhoNota, CSS_NOTA_CLIENTE, CSS_NOTA_TERMICA, rodapeNota } from './nota-impressao';

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

const CSS_CUPOM_ATENDIMENTO = `${CSS_NOTA_TERMICA}header{text-align:center;border-bottom:1px dashed #000;padding-bottom:6px}h1{font-size:15px;margin:0 0 4px}p{margin:2px 0;line-height:1.35}.code{font-size:18px;font-weight:bold;text-align:center;margin-top:6px}.stamp{text-align:center;font-size:16px;font-weight:bold;border:2px solid #000;margin:6px 0;padding:3px}table{width:100%;border-collapse:collapse;margin:6px 0}td,th{padding:3px 0;text-align:left;vertical-align:top;border-bottom:1px dashed #000;font-size:11px}th{font-size:10px}.right{text-align:right}.totals p{display:flex;justify-content:space-between;gap:4px}.total{font-size:15px;font-weight:bold}footer{border-top:1px dashed #000;margin-top:8px;padding-top:6px;font-size:10px;text-align:center}td small{font-size:10px}.totals span:last-child{flex-shrink:0;white-space:nowrap}
  /* A tabela reserva espaço para as colunas numéricas antes de quebrar o nome da peça. */
  .itens-termicos{table-layout:auto}
  .itens-termicos :is(th,td):not(:first-child){
    width:1%;padding-inline-start:5px;white-space:nowrap;overflow-wrap:normal;
  }
  .itens-termicos :is(th,td):nth-child(2){text-align:center}
  .itens-termicos :is(th,td):first-child{padding-inline-end:4px;overflow-wrap:anywhere}
`;
const RODAPE_CUPOM = '<footer>Obrigado pela preferência. Marquinho Moto Peças</footer>';

function cabecalhoCupom() {
  return `<header><h1>${esc(DADOS_EMPRESA.fantasia)}</h1><p>${esc(DADOS_EMPRESA.razao)}</p>${cnpjValido(DADOS_EMPRESA.cnpj) ? `<p>CNPJ: ${esc(DADOS_EMPRESA.cnpj)}</p>` : ''}<p>${esc(DADOS_EMPRESA.endereco)} — ${esc(DADOS_EMPRESA.cidade)}</p><p>${esc(DADOS_EMPRESA.telefone1)} / ${esc(DADOS_EMPRESA.telefone2)}</p></header>`;
}

type LinhaCupom = { nome?: string; codigo?: string; quantidade: number; unitario: unknown; valor: unknown; observacao?: string };

function linhaCupom(i: LinhaCupom, ficha = false) {
  return `<tr><td>${ficha ? '☐ ' : ''}${esc(i.nome)}<br><small>${esc(i.codigo)}</small>${i.observacao ? `<br><small>${esc(i.observacao)}</small>` : ''}</td><td>${esc(i.quantidade)}</td><td class="right">${ficha ? '' : dinheiro(i.unitario)}</td><td class="right">${ficha ? '' : dinheiro(i.valor)}</td></tr>`;
}

function totaisCupom(subtotal: unknown, desconto: unknown, total: unknown) {
  return `<div class="totals doc-total"><p><span>Subtotal</span><span>${dinheiro(subtotal)}</span></p><p><span>Descontos</span><span>${dinheiro(desconto)}</span></p><p class="total"><span>Total</span><span>${dinheiro(total)}</span></p></div>`;
}

function camposFichaExecucao(ficha: { linhas: number; horarios?: boolean }) {
  const linhas = '<p>__________________________________</p>'.repeat(ficha.linhas);
  const horarios = ficha.horarios ? '<p>Início: ____:____</p><p>Término: ____:____</p>' : '';
  return `<h3>Execução</h3>${linhas}${horarios}<p>__________________________________</p><p>Assinatura do Mecânico</p>`;
}

export function htmlNotaFiscalTermica(nota: {
  numero: string | number;
  data: string;
  dados: string[];
  itens: LinhaCupom[];
  subtotal: number;
  desconto?: number;
  total: number;
  pagamentos?: string[];
  observacoes?: string;
  autoPrint?: boolean;
  titulo?: string;
  fichaExecucao?: { linhas: number; horarios?: boolean };
}) {
  const autoPrint = nota.autoPrint !== false;
  const titulo = nota.titulo ?? `Nota Fiscal ${nota.numero}`;
  const marca = nota.itens.length || nota.fichaExecucao ? MARCA_TERMICA_HTML : '';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${esc(titulo)}</title><style>${CSS_CUPOM_ATENDIMENTO}${marca ? CSS_MARCA_TERMICA : ''}@media print{.btn-print{display:none}}</style></head><body>
    ${autoPrint ? '' : '<button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>'}
    ${cabecalhoCupom()}
    <p class="code">${esc(titulo)}</p>
    <p>${esc(nota.data)}</p>
    ${nota.dados.map(dado => `<p>${esc(dado)}</p>`).join('')}
    <table class="itens-termicos">${CABECALHO_ITENS}<tbody>${nota.itens.map(i => linhaCupom(i, Boolean(nota.fichaExecucao))).join('') || (nota.fichaExecucao ? '<tr><td colspan="4">☐ ________________________</td></tr>' : '')}</tbody></table>${marca}
    ${nota.fichaExecucao ? camposFichaExecucao(nota.fichaExecucao) : totaisCupom(nota.subtotal, nota.desconto, nota.total)}
    ${nota.pagamentos?.length ? `<h3>Pagamento</h3>${nota.pagamentos.map(p => `<p>${esc(p)}</p>`).join('')}` : ''}
    ${nota.observacoes ? `<p>Observações: ${esc(nota.observacoes)}</p>` : ''}
    ${RODAPE_CUPOM}
    ${autoPrint ? '<script>setTimeout(function(){window.print();},300);</script>' : ''}
  </body></html>`;
}

const CABECALHO_ITENS = '<thead><tr><th>Produto</th><th>Qtd.</th><th class="right">Unitário</th><th class="right">Valor</th></tr></thead>';

export type OpcoesComprovante = { segundaVia?: boolean; formato?: 'a4' | 'termica'; publico?: boolean };

export function htmlComprovante(pedido: any, venda?: any, opcoes: OpcoesComprovante = {}) {
  const { segundaVia = false, formato = 'termica', publico = false } = opcoes;
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
  const notaA4 = !termica && !publico;
  const marca = termica && (itens.length || linhasServico.length) ? MARCA_TERMICA_HTML : '';
  const css = termica
    ? CSS_CUPOM_ATENDIMENTO
    : notaA4
      ? `${CSS_NOTA_CLIENTE}
        .code{font-size:18px;font-weight:700;margin-bottom:6px}
        .stamp{display:inline-block;border:2px solid #000;padding:3px 10px;margin-bottom:8px;font-weight:700}
        p{margin:3px 0}
        .totals{width:300px;max-width:100%;margin-left:auto}
        .totals p{display:flex;justify-content:space-between;gap:8px}
        .total{font-size:18px;font-weight:700;border-top:2px solid #333;padding-top:8px}
        h3{font-size:14px;margin-top:18px;break-after:avoid}`
      : `*{box-sizing:border-box}body{font:14px Arial,Helvetica,sans-serif;color:#000;max-width:760px;margin:30px auto;padding:20px}header{text-align:center;border-bottom:2px solid #152236;padding-bottom:20px}h1{font-size:24px;margin:0 0 8px}p{line-height:1.6;margin:4px 0}.code{font-size:28px;letter-spacing:2px;font-weight:bold}.stamp{display:inline-block;border:3px solid #087d4d;color:#087d4d;font-size:26px;font-weight:bold;padding:7px 22px;margin:16px 0}.pending{color:#875a00;border-color:#875a00;font-size:18px}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{padding:10px 6px;text-align:left;border-bottom:1px solid #ddd}th{font-size:11px;text-transform:uppercase}.right{text-align:right}.totals{margin-left:auto;max-width:300px}.totals p{display:flex;justify-content:space-between}.total{font-size:22px;font-weight:bold}footer{border-top:1px solid #ccc;margin-top:25px;padding-top:12px;font-size:11px;text-align:center;color:#000}td{overflow-wrap:anywhere}@media print{body{margin:0;max-width:none}@page{size:A4;margin:12mm}}@media (max-width:600px){body{margin:0;padding:14px;font-size:13px}.code{font-size:22px}}`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Comprovante ${codigoPedido(pedido)}</title><style>${css}${marca ? CSS_MARCA_TERMICA : ''}</style></head><body>${notaA4 ? cabecalhoNota('Comprovante do Pedido') : cabecalhoCupom()}
  <p class="code">Pedido ${codigoPedido(pedido)}</p><div class="stamp ${pago ? '' : 'pending'}">${pago ? 'PAGO' : pedido.status === 'ABERTO' ? 'OS EM ABERTO' : 'AGUARDANDO PAGAMENTO'}</div>${pago && segundaVia ? '<p><strong>2ª VIA</strong></p>' : ''}<p>${esc(data)}</p>${pago && venda?.numero ? `<p>Venda nº ${esc(venda.numero)}</p>` : ''}${pedido.clienteNome ? `<p>Cliente: ${esc(pedido.clienteNome)}</p>` : ''}${telefone ? `<p>Telefone: ${esc(telefone)}</p>` : ''}
  ${os ? `<p>OS nº ${esc(os.numero)}${os.modeloMoto && os.modeloMoto !== 'Nao informado' ? ` · Moto: ${esc(os.modeloMoto)}` : ''}${os.placaMoto ? ` · Placa: ${esc(os.placaMoto)}` : ''}${os.anoMoto ? ` · Ano: ${esc(os.anoMoto)}` : ''}${os.kmAtual ? ` · KM: ${esc(os.kmAtual)}` : ''}</p>${os.descricaoProblema ? `<p>Problema relatado: ${esc(os.descricaoProblema)}</p>` : ''}` : ''}
  <table${termica ? ' class="itens-termicos"' : notaA4 ? ' class="produtos comprovante-itens"' : ''}>${CABECALHO_ITENS}<tbody>${itens.map((i: any) => linhaCupom({ nome: i.peca?.nome, codigo: i.peca?.codigo, quantidade: i.quantidade, unitario: i.precoVendido, valor: i.subtotal })).join('')}${linhasServico.map((i: any) => `<tr><td>${esc(i.nome)}<br><small>Serviço</small></td><td>1</td><td class="right">${dinheiro(i.valor)}</td><td class="right">${dinheiro(i.valor)}</td></tr>`).join('')}</tbody></table>${marca}
  ${servicos > 0 ? `<p>Serviços / mão de obra: ${dinheiro(servicos)}</p>` : ''}${totaisCupom(pedido.subtotal, pedido.descontoTotal, pedido.total)}
  ${pago ? `<h3>Pagamento</h3>${(venda.pagamentos || []).map((p: any) => `<p>${esc(descreverPagamento(p))}: ${dinheiro(p.valor)}${Number(p.troco) > 0 ? ` · Recebido: ${dinheiro(Number(p.valor) + Number(p.troco))} · Troco: ${dinheiro(p.troco)}` : ''}</p>`).join('')}<p>Operador: ${esc(venda.operadorNome || venda.criadoPor)}</p>` : pedido.status === 'ABERTO' ? '<p>OS em aberto no Atendimento. Ainda não enviada ao caixa.</p>' : '<p>Apresente este código no caixa. Este pedido ainda não foi pago.</p>'}${notaA4 ? rodapeNota() : RODAPE_CUPOM}</body></html>`;
}
