'use client';

// ============================================================================
// MÓDULO ÚNICO DE IMPRESSÃO — NOTAS DO CLIENTE / NOTA DE SERVIÇO (A4 interna)
// ============================================================================
// Usado por:
//  - DONA:  /dono/notas (Central de Notas), /dono/ordens (DetalheOS)
//  - BALCÃO: DetalheOSBalcao (Nota do Cliente da OS) e PDV (Nota de Venda)
//  - NF MANUAL: /dono/nf-manual
// ----------------------------------------------------------------------------
// 4 categorias de documento:
//   A) DOCUMENTO INTERNO DO MECÂNICO  → checklist térmico (fora deste módulo)
//   B) NOTA DO CLIENTE — OS           → imprimirNotaServico()
//   C) NOTA DO CLIENTE — VENDA/PDV    → imprimirNotaVenda()
//   D) NF MANUAL                      → imprimirNfManual()
// B/C/D compartilham o MESMO cabeçalho, CSS, dados da empresa, formatação de
// moeda e rodapé. Não há cópias duplicadas de HTML.
// ----------------------------------------------------------------------------
// SEM integração SEFAZ: documento interno, sem autorização fiscal, sem chave
// de acesso inventada, sem QR Code fiscal. Reimpressão NUNCA altera
// NotaFiscal.dataServico.
// ============================================================================

export const DADOS_EMPRESA = {
  fantasia: 'MARQUINHO MOTO PEÇAS',
  razao: 'MARCOS BRITO MOUZINHO EXPRESSO',
  cnpj: '24.585.668/0001-06',
  ie: '066967163',
  endereco: 'ESTRADA DE ÁGUAS COMPRIDAS, 693 — ÁGUAS COMPRIDAS',
  cidade: 'OLINDA - PE',
  telefone1: '(81) 9814-3879',
  telefone2: '(81) 8706-9882',
} as const;

// CSS único das Notas do Cliente (OS + Venda) e NF Manual
export const CSS_NOTA_CLIENTE = `
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:"DejaVu Sans",Arial,Helvetica,sans-serif;font-size:13px;color:#222;padding:40px;line-height:1.5}
  .header{text-align:center;margin-bottom:22px;padding-bottom:16px;border-bottom:3px double #111}
  .fantasia{font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#111}
  .razao{font-size:13px;font-weight:700;color:#333;margin-top:2px}
  .empresa-linha{font-size:11px;color:#555;margin-top:2px}
  .doc-titulo{display:inline-block;margin-top:12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;background:#f2f2f2;border:1px solid #ccc;border-radius:4px;padding:3px 14px;color:#333}
  .info{display:flex;justify-content:space-between;flex-wrap:wrap;margin-bottom:16px;padding:12px 16px;background:#f8f8f8;border-radius:8px;gap:6px 16px}
  .info div{font-size:12px}.info span{font-weight:700;color:#444}
  .section-title{font-size:13px;font-weight:800;margin:18px 0 8px;color:#333;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #ddd;padding-bottom:3px}
  table{width:100%;border-collapse:collapse;margin-bottom:14px}
  th{background:#f2f2f2;padding:8px;text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid #ccc;color:#444}
  td{padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;color:#333;vertical-align:top}
  .center{text-align:center}.right{text-align:right}
  .totais{width:300px;margin-left:auto}.totais table td{padding:5px 8px;border:none}.totais tr.total td{font-size:15px;font-weight:700;border-top:2px solid #333;padding-top:8px}
  .footer{text-align:center;margin-top:30px;font-size:10px;color:#888;line-height:1.6}
  .obs{font-size:10px;color:#999;margin-top:6px}
  @media print{body{padding:20px}}
`;

function esc(s: string | null | undefined): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fm(v: number | string | null | undefined): string {
  const n = Number(v) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(d?: string | Date | null): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('pt-BR');
}

function fmtH(d?: string | Date | null): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function headerHtml(titulo: string): string {
  return `<div class="header">
    <div class="fantasia">${DADOS_EMPRESA.fantasia}</div>
    <div class="razao">${DADOS_EMPRESA.razao}</div>
    <div class="empresa-linha">CNPJ: ${DADOS_EMPRESA.cnpj} &nbsp;|&nbsp; IE: ${DADOS_EMPRESA.ie}</div>
    <div class="empresa-linha">${DADOS_EMPRESA.endereco}</div>
    <div class="empresa-linha">${DADOS_EMPRESA.cidade} &nbsp;|&nbsp; WHATSAPP: ${DADOS_EMPRESA.telefone1} · ${DADOS_EMPRESA.telefone2}</div>
    <div class="doc-titulo">${titulo}</div>
  </div>`;
}

function footerHtml(extra?: string): string {
  return `<div class="footer">${extra ? extra + '<br>' : ''}Marquinho Moto Peças — Obrigado pela preferência!<br>Documento interno — sem integração SEFAZ</div>`;
}

function abrirJanela(titulo: string): Window | null {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return null;
  return w;
}

// ============================================================================
// B) NOTA DO CLIENTE — ORDEM DE SERVIÇO
// ============================================================================
export interface ItemNotaServico {
  id?: string;
  peca?: { codigo?: string | null; nome?: string } | null;
  quantidade: number;
  precoUnitario: number;
  adaptado?: boolean;
}

export interface ServicoNotaServico {
  id?: string;
  nome?: string;
  valor?: number | string;
}

export interface NotaFiscalInfo {
  id?: string;
  numero?: string;
  chaveAcesso?: string | null;
  dataServico?: string | null;
  emitidaEm?: string;
}

export interface OsParaImprimir {
  id?: string;
  numero?: number;
  nomeCliente?: string;
  telefoneCliente?: string;
  modeloMoto?: string;
  placaMoto?: string;
  anoMoto?: string;
  descricaoProblema?: string;
  diagnostico?: string;
  tipoServico?: string;
  status?: string;
  valorTotal?: number;
  valorMaoDeObra?: number;
  desconto?: number;
  formaPagamento?: string | null;
  mecanico?: { name?: string } | null;
  itens?: ItemNotaServico[];
  servicos?: ServicoNotaServico[] | null;
  notaFiscal?: NotaFiscalInfo | null;
  inicioServico?: string | null;
  fimServico?: string | null;
}

export function imprimirNotaServico(os: OsParaImprimir): void {
  const w = abrirJanela('Nota de Serviço');
  if (!w) return;

  // Data do Serviço: usa dataServico persistida. Notas antigas sem dataServico usam emitidaEm como fallback.
  const dataServicoRaw = os.notaFiscal?.dataServico
    ? new Date(os.notaFiscal.dataServico)
    : os.notaFiscal?.emitidaEm
      ? new Date(os.notaFiscal.emitidaEm)
      : new Date();
  const dataServicoStr = dataServicoRaw.toLocaleDateString('pt-BR');
  const impressoEm = new Date().toLocaleString('pt-BR');

  const servicosReg = os.servicos && os.servicos.length > 0 ? os.servicos : null;
  const servicosTxt = os.tipoServico ? os.tipoServico.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const maoDeObra = Number(os.valorMaoDeObra) || 0;
  const totalPecas = (os.itens || []).reduce((s, i) => s + Number(i.precoUnitario) * Number(i.quantidade || 0), 0);
  const desconto = Number(os.desconto) || 0;
  const total = Number(os.valorTotal) || 0;

  const linhasItens = (os.itens || []).map((i) =>
    `<tr><td>${esc(i.peca?.codigo || '')}</td><td>${esc(i.peca?.nome || '')}</td><td class="center">${i.quantidade}</td><td class="right">${fm(i.precoUnitario)}</td><td class="right">${fm(Number(i.precoUnitario) * Number(i.quantidade || 0))}</td></tr>`
  ).join('');

  const linhasServicos = servicosReg
    ? servicosReg.map((s) => `<tr><td>${esc(s.nome)}</td><td class="right">${fm(s.valor)}</td></tr>`).join('')
    : servicosTxt.map((s) => `<tr><td>${esc(s)}</td><td class="right">—</td></tr>`).join('');
  const servicosHtml = linhasServicos || '<tr><td colspan="2" style="text-align:center;color:#999">Nenhum serviço registrado</td></tr>';

  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>NF ${esc(os.notaFiscal?.numero || os.numero?.toString() || '')}</title><style>
    ${CSS_NOTA_CLIENTE}
  </style></head><body>
    ${headerHtml('Nota de Serviço / Comprovante')}
    <div class="info">
      <div><span>NF:</span> ${esc(os.notaFiscal?.numero || '')}</div>
      <div><span>OS:</span> #${esc(os.numero?.toString() || '')}</div>
      <div><span>Data do Serviço:</span> ${dataServicoStr}</div>
      ${os.notaFiscal?.chaveAcesso ? `<div><span>Chave:</span> ${esc(os.notaFiscal.chaveAcesso)}</div>` : ''}
      <div style="width:100%;margin-top:4px;font-size:10px;color:#999"><span>Impresso em:</span> ${impressoEm}</div>
    </div>
    <div class="section-title">Dados do Cliente</div>
    <div class="info">
      <div><span>Cliente:</span> ${esc(os.nomeCliente)}</div>
      <div><span>Telefone:</span> ${esc(os.telefoneCliente)}</div>
      <div><span>Mecânico:</span> ${esc(os.mecanico?.name || '—')}</div>
    </div>
    <div class="section-title">Veículo</div>
    <div class="info">
      <div><span>Moto:</span> ${esc(os.modeloMoto)}</div>
      <div><span>Placa:</span> ${esc(os.placaMoto || '—')}</div>
      <div><span>Ano:</span> ${esc(os.anoMoto || '—')}</div>
    </div>
    <div class="section-title">Início e Término do Serviço</div>
    <div class="info">
      <div><span>Início:</span> ${fmtH(os.inicioServico)}</div>
      <div><span>Término:</span> ${fmtH(os.fimServico)}</div>
    </div>
    <div class="section-title">Serviços Realizados</div>
    <table><thead><tr><th>Serviço</th><th class="right">Valor</th></tr></thead><tbody>${servicosHtml}${maoDeObra > 0 ? `<tr><td>Mão de obra</td><td class="right">${fm(maoDeObra)}</td></tr>` : ''}</tbody></table>
    <div class="section-title">Peças Utilizadas</div>
    <table><thead><tr><th>SKU</th><th>Descrição</th><th class="center">Qtd</th><th class="right">V. Unit.</th><th class="right">Total</th></tr></thead><tbody>${linhasItens || '<tr><td colspan="5" style="text-align:center;color:#999">Nenhum item</td></tr>'}</tbody></table>
    <div class="totais"><table>
      <tr><td class="right">Peças</td><td class="right">${fm(totalPecas)}</td></tr>
      <tr><td class="right">Mão de obra / Serviços</td><td class="right">${fm(maoDeObra)}</td></tr>
      ${desconto > 0 ? `<tr><td class="right">Desconto</td><td class="right">− ${fm(desconto)}</td></tr>` : ''}
      <tr class="total"><td class="right">TOTAL</td><td class="right">${fm(total)}</td></tr>
      ${os.formaPagamento ? `<tr><td class="right">Forma de Pagamento</td><td class="right">${esc(os.formaPagamento)}</td></tr>` : ''}
    </table></div>
    ${footerHtml()}
    <script>setTimeout(function(){window.print();},300);</script>
  </body></html>`);
  w.document.close();
}

// ============================================================================
// C) NOTA DO CLIENTE — VENDA / PDV
// ============================================================================
export interface ItemNotaVenda {
  nome: string;
  codigo: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface PagamentoNotaVenda {
  tipo: string;
  valor: number;
  troco: number;
  bandeira?: string;
  parcelas?: number;
}

export interface VendaParaImprimir {
  numero: number;
  notaNumero?: string;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  clienteCpf?: string | null;
  subtotal: number;
  descontoTotal: number;
  total: number;
  createdAt: string;
  itens: ItemNotaVenda[];
  pagamentos: PagamentoNotaVenda[];
}

const TIPO_LABEL: Record<string, string> = {
  DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_DEBITO: 'Débito', CARTAO_CREDITO: 'Crédito', TRANSFERENCIA: 'Transferência',
};

export function imprimirNotaVenda(venda: VendaParaImprimir): void {
  const w = abrirJanela('Nota de Venda');
  if (!w) return;

  const data = new Date(venda.createdAt);
  const dataStr = data.toLocaleDateString('pt-BR');
  const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const impressoEm = new Date().toLocaleString('pt-BR');

  const linhasItens = venda.itens.map((i) =>
    `<tr><td>${esc(i.codigo)}</td><td>${esc(i.nome)}</td><td class="center">${i.quantidade}</td><td class="right">${fm(i.precoUnitario)}</td><td class="right">${fm(i.subtotal)}</td></tr>`
  ).join('');

  const linhasPg = venda.pagamentos.map((p) => {
    const trocoTexto = p.troco > 0 ? ` (Troco: ${fm(p.troco)})` : '';
    return `<tr><td colspan="3">${TIPO_LABEL[p.tipo] || esc(p.tipo)}${p.bandeira ? ' - ' + esc(p.bandeira) : ''}${p.parcelas ? ' ' + p.parcelas + 'x' : ''}${trocoTexto}</td><td class="right">${fm(p.valor)}</td></tr>`;
  }).join('');

  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Venda #${venda.numero}</title><style>
    ${CSS_NOTA_CLIENTE}
  </style></head><body>
    ${headerHtml('Nota de Venda / Comprovante')}
    <div class="info">
      ${venda.notaNumero ? `<div><span>Nota:</span> ${esc(venda.notaNumero)}</div>` : ''}
      <div><span>Venda:</span> #${venda.numero}</div>
      <div><span>Data:</span> ${dataStr} ${horaStr}</div>
      ${venda.clienteNome ? `<div><span>Cliente:</span> ${esc(venda.clienteNome)}</div>` : ''}
      ${venda.clienteTelefone ? `<div><span>Telefone:</span> ${esc(venda.clienteTelefone)}</div>` : ''}
      ${venda.clienteCpf ? `<div><span>CPF/CNPJ:</span> ${esc(venda.clienteCpf)}</div>` : ''}
      <div style="width:100%;margin-top:4px;font-size:10px;color:#999"><span>Impresso em:</span> ${impressoEm}</div>
    </div>
    <div class="section-title">Produtos</div>
    <table><thead><tr><th>SKU</th><th>Descrição</th><th class="center">Qtd</th><th class="right">V. Unit.</th><th class="right">Subtotal</th></tr></thead><tbody>${linhasItens || '<tr><td colspan="5" style="text-align:center;color:#999">Nenhum item</td></tr>'}</tbody></table>
    <div class="totais"><table>
      <tr><td class="right">Subtotal</td><td class="right">${fm(venda.subtotal)}</td></tr>
      ${venda.descontoTotal > 0 ? `<tr><td class="right">Desconto</td><td class="right">− ${fm(venda.descontoTotal)}</td></tr>` : ''}
      <tr class="total"><td class="right">TOTAL</td><td class="right">${fm(venda.total)}</td></tr>
    </table></div>
    ${venda.pagamentos.length > 0 ? `<div class="section-title">Pagamento</div><table><thead><tr><th colspan="3">Forma</th><th class="right">Valor</th></tr></thead><tbody>${linhasPg}</tbody></table>` : ''}
    ${footerHtml()}
    <script>setTimeout(function(){window.print();},300);</script>
  </body></html>`);
  w.document.close();
}

// ============================================================================
// D) NF MANUAL (mesma identidade visual)
// ============================================================================
export interface NfManualParaImprimir {
  numero: number | string;
  cliente?: string;
  cpfCnpj?: string;
  endereco?: string;
  observacoes?: string;
  formaPagamento?: string;
  itens: { nome: string; codigo: string; quantidade: number; valorUnitario: number }[];
  total: number;
}

export function imprimirNfManual(opts: NfManualParaImprimir): void {
  const w = abrirJanela('Nota Fiscal Manual');
  if (!w) return;
  const impressoEm = new Date().toLocaleString('pt-BR');

  const linhasItens = opts.itens.map((i) =>
    `<tr><td>${esc(i.codigo)}</td><td>${esc(i.nome)}</td><td class="center">${i.quantidade}</td><td class="right">${fm(i.valorUnitario)}</td><td class="right">${fm(i.valorUnitario * i.quantidade)}</td></tr>`
  ).join('');

  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>NF Manual ${esc(String(opts.numero))}</title><style>
    ${CSS_NOTA_CLIENTE}
  </style></head><body>
    ${headerHtml('Nota Fiscal Manual')}
    <div class="info">
      <div><span>NF:</span> ${esc(String(opts.numero))}</div>
      ${opts.formaPagamento ? `<div><span>Pagamento:</span> ${esc(opts.formaPagamento)}</div>` : ''}
      <div style="width:100%;margin-top:4px;font-size:10px;color:#999"><span>Impresso em:</span> ${impressoEm}</div>
    </div>
    <div class="section-title">Dados do Cliente</div>
    <div class="info">
      <div><span>Cliente:</span> ${esc(opts.cliente) || '—'}</div>
      <div><span>CPF/CNPJ:</span> ${esc(opts.cpfCnpj) || '—'}</div>
      <div><span>Endereço:</span> ${esc(opts.endereco) || '—'}</div>
    </div>
    <div class="section-title">Produtos</div>
    <table><thead><tr><th>SKU</th><th>Descrição</th><th class="center">Qtd</th><th class="right">V. Unit.</th><th class="right">Total</th></tr></thead><tbody>${linhasItens || '<tr><td colspan="5" style="text-align:center;color:#999">Nenhum item</td></tr>'}</tbody></table>
    <div class="totais"><table>
      <tr class="total"><td class="right">TOTAL</td><td class="right">${fm(opts.total)}</td></tr>
    </table></div>
    ${opts.observacoes ? `<div class="section-title">Observações</div><p style="font-size:12px;color:#555">${esc(opts.observacoes)}</p>` : ''}
    ${footerHtml()}
    <script>setTimeout(function(){window.print();},300);</script>
  </body></html>`);
  w.document.close();
}
