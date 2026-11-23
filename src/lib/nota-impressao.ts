import { DADOS_EMPRESA } from './dados-empresa';

// CSS único das Notas do Cliente (OS + Venda) e NF Manual
export const CSS_NOTA_CLIENTE = `
  *{margin:0;padding:0;box-sizing:border-box}body{width:100%;max-width:210mm;margin:0 auto;overflow-wrap:anywhere;font-family:Arial,Helvetica,"DejaVu Sans",sans-serif;font-size:14px;color:#000;padding:clamp(12px,4vw,40px);line-height:1.5}
  .header{text-align:center;margin-bottom:22px;padding-bottom:16px;border-bottom:3px double #111}
  .fantasia{font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#111}
  .razao{font-size:15px;font-weight:700;color:#000;margin-top:2px}
  .empresa-linha{font-size:13.5px;color:#000;font-weight:600;margin-top:2px;line-height:1.65}
  .doc-titulo{display:inline-block;margin-top:12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;background:#f2f2f2;border:1px solid #ccc;border-radius:4px;padding:3px 14px;color:#000}
  .info{display:flex;justify-content:space-between;flex-wrap:wrap;margin-bottom:16px;padding:12px 16px;background:#f8f8f8;border-radius:8px;gap:6px 16px}
  .info div{min-width:0;max-width:100%;font-size:14px}.info span{font-weight:700;color:#000}
  .section-title{font-size:14px;font-weight:800;margin:18px 0 8px;color:#000;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #ddd;padding-bottom:3px}
  table{width:100%;border-collapse:collapse;margin-bottom:14px}
  th{background:#f2f2f2;padding:8px;text-align:left;font-size:12.5px;text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid #ccc;color:#000}
  td{padding:6px 8px;border-bottom:1px solid #eee;font-size:14px;color:#000;vertical-align:top}
  .center{text-align:center}.right{text-align:right}
  .produtos{table-layout:fixed}
  .produtos th:first-child{width:17%}
  .produtos th:nth-last-child(3){width:9%}
  .produtos th:nth-last-child(-n+2){width:19%}
  .comprovante-itens th:first-child{width:53%}
  .produtos td:nth-last-child(-n+2){white-space:nowrap}
  .totais{width:300px;max-width:100%;margin-left:auto}.totais table td{padding:5px 8px;border:none}.totais tr.total td{font-size:18px;font-weight:700;border-top:2px solid #333;padding-top:8px}
  .footer{text-align:center;margin-top:30px;font-size:12.5px;color:#000;line-height:1.6}
  .obs{font-size:12px;color:#000;margin-top:6px}
  @media screen and (max-width:520px){.produtos td,.produtos th{padding-inline:3px}.produtos td:nth-last-child(-n+2){white-space:normal}}
  @page{size:A4;margin:12mm}
  @media print{
    body{max-width:none;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    thead{display:table-header-group}
    tr,.header,.doc-total{break-inside:avoid}
    .section-title{break-after:avoid}
  }
`;

// Os documentos térmicos seguem a largura configurada na impressora.
export const CSS_NOTA_TERMICA = `
  *{box-sizing:border-box}
  body{font-family:Consolas,"Lucida Console","DejaVu Sans Mono","Courier New",monospace;
    font-size:12px;font-weight:700;line-height:1.45;color:#000;background:#fff;
    width:72mm;max-width:100%;margin:0 auto;padding:2mm;overflow-wrap:anywhere;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:0}
  @media print{thead{display:table-header-group}tr,.item{break-inside:avoid}}
`;

export function cabecalhoNota(titulo: string): string {
  return `<div class="header">
    <div class="fantasia">${DADOS_EMPRESA.fantasia}</div>
    <div class="razao">${DADOS_EMPRESA.razao}</div>
    <div class="empresa-linha">CNPJ: ${DADOS_EMPRESA.cnpj}</div>
    <div class="empresa-linha">IE: ${DADOS_EMPRESA.ie}</div>
    <div class="empresa-linha">${DADOS_EMPRESA.endereco}</div>
    <div class="empresa-linha">${DADOS_EMPRESA.cidade}</div>
    <div class="empresa-linha">WHATSAPP: ${DADOS_EMPRESA.telefone1} · ${DADOS_EMPRESA.telefone2}</div>
    <div class="doc-titulo">${titulo}</div>
  </div>`;
}

export function rodapeNota(): string {
  return `<div class="footer">Obrigado pela preferência. Marquinho Moto Peças</div>`;
}
