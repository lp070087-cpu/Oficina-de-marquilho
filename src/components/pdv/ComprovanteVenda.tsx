'use client';

interface ItemComprovante {
  nome: string;
  codigo: string;
  quantidade: number;
  precoOriginal: number;
  precoUnitario: number;
  descontoPercent: number;
  descontoReais: number;
  subtotal: number;
  precoCusto?: number;
  lucroUnitario?: number;
  lucroTotal?: number;
}

interface PagamentoComprovante {
  tipo: string;
  valor: number;
  troco: number;
  bandeira?: string;
  parcelas?: number;
}

interface ComprovanteVendaProps {
  venda: {
    numero: number;
    clienteNome?: string | null;
    clienteTelefone?: string | null;
    clienteCpf?: string | null;
    subtotal: number;
    descontoTotal: number;
    total: number;
    createdAt: string;
    itens: ItemComprovante[];
    pagamentos: PagamentoComprovante[];
  };
  onFechar: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_DEBITO: 'Debito', CARTAO_CREDITO: 'Credito', TRANSFERENCIA: 'Transferencia',
};

export default function ComprovanteVenda({ venda, onFechar }: ComprovanteVendaProps) {
  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const data = new Date(venda.createdAt);
  const dataStr = data.toLocaleDateString('pt-BR');
  const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  function gerarTermicoHTML() {
    function esc(s: string) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    const linhasItens = venda.itens.map(i => `
      <div class="item">
        <div class="item-top">
          <span class="item-nome">${esc(i.nome)}</span>
          <span class="item-qtd">${i.quantidade}x</span>
        </div>
        <div class="item-mid">
          <span class="item-cod">${esc(i.codigo)}</span>
          <span class="item-preco">${fm(i.precoUnitario)} un.</span>
        </div>
        ${(i.descontoPercent > 0 || i.descontoReais > 0) ? `<div class="item-desc">Desc: ${i.descontoPercent > 0 ? i.descontoPercent + '%' : ''} ${i.descontoReais > 0 ? '− ' + fm(i.descontoReais) : ''}</div>` : ''}
        <div class="item-sub">Subtotal: ${fm(i.subtotal)}</div>
      </div>
    `).join('');

    const linhasPg = venda.pagamentos.map(p => `
      <div class="pg-item"><span>${TIPO_LABEL[p.tipo] || p.tipo}${p.bandeira ? ' (' + esc(p.bandeira) + ')' : ''}${p.parcelas ? ' ' + p.parcelas + 'x' : ''}</span><span>${fm(p.valor)}</span></div>
    `).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Venda #${venda.numero}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:"Courier New",monospace;font-size:9px;color:#000;width:280px;margin:0 auto;padding:6px 4px;background:#fff}
      .center{text-align:center}.logo{font-size:15px;font-weight:900;margin-bottom:1px}.ofic{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .vn{font-size:20px;font-weight:900;margin:4px 0 2px}.dt{font-size:7px;margin-bottom:4px}
      .sep{border:none;border-top:1px solid #000;margin:5px 0}.sep-dot{border:none;border-top:1px dotted #000;margin:4px 0}
      .cliente{font-size:9px;margin:2px 0}.cliente span{font-weight:700}
      .item{border-bottom:1px dotted #ccc;padding:3px 0}.item-top,.item-mid{display:flex;justify-content:space-between}
      .item-nome{font-weight:700;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .item-qtd{font-weight:700}.item-cod{font-size:7px;color:#666}.item-preco{font-size:7px;color:#666}
      .item-desc{font-size:7px;color:#c00;text-align:right}.item-sub{font-size:8px;font-weight:700;text-align:right}
      .pg-item{display:flex;justify-content:space-between;font-size:8px;padding:1px 0}
      .total{display:flex;justify-content:space-between;font-size:13px;font-weight:900;padding:3px 0}
      .qr{text-align:center;margin:6px 0;font-size:7px}
      .footer{text-align:center;font-size:7px;margin-top:8px;padding-top:4px;border-top:1px solid #000}
      @media print{body{width:72mm;padding:3mm}@page{margin:0}}
    </style></head><body>
      <div class="center">
        <div class="logo">MARQUINHO</div>
        <div class="ofic">Moto Pecas</div>
        <div class="vn">VENDA #${venda.numero}</div>
        <div class="dt">${dataStr} — ${horaStr}</div>
      </div>
      <hr class="sep">
      ${venda.clienteNome ? `<div class="cliente"><span>Cliente:</span> ${esc(venda.clienteNome)}${venda.clienteTelefone ? '<br><span>Tel:</span> ' + esc(venda.clienteTelefone) : ''}${venda.clienteCpf ? '<br><span>CPF:</span> ' + esc(venda.clienteCpf) : ''}</div><hr class="sep-dot">` : ''}
      <div>ITENS</div>
      ${linhasItens}
      <hr class="sep-dot">
      ${venda.descontoTotal > 0 ? `<div style="display:flex;justify-content:space-between;font-size:8px;color:#c00"><span>Descontos</span><span>− ${fm(venda.descontoTotal)}</span></div>` : ''}
      <div class="total"><span>TOTAL</span><span>${fm(venda.total)}</span></div>
      <hr class="sep-dot">
      <div>PAGAMENTO</div>
      ${linhasPg}
      <hr class="sep">
      <div class="qr">QR Code: V${String(venda.numero).padStart(8,'0')}</div>
      <div class="footer">Marquinho Moto Pecas — ${dataStr}<br>Obrigado pela preferencia!</div>
      <script>setTimeout(function(){window.print();},300);</script>
    </body></html>`;
  }

  function imprimir() {
    const w = window.open('', '_blank', 'width=320,height=700');
    if (!w) return;
    w.document.write(gerarTermicoHTML());
    w.document.close();
  }

  function imprimirA4() {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    function esc(s: string) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    const linhasItens = venda.itens.map(i => `
      <tr>
        <td>${esc(i.codigo)}</td>
        <td>${esc(i.nome)}</td>
        <td class="center">${i.quantidade}</td>
        <td class="right">${fm(i.precoUnitario)}</td>
        <td class="right">${(i.descontoPercent > 0 || i.descontoReais > 0) ? (i.descontoPercent > 0 ? i.descontoPercent + '%' : '') + ' ' + (i.descontoReais > 0 ? fm(i.descontoReais) : '') : '-'}</td>
        <td class="right">${fm(i.subtotal)}</td>
      </tr>
    `).join('');

    const linhasPg = venda.pagamentos.map(p => {
      const trocoTexto = p.troco > 0 ? ` (Troco: ${fm(p.troco)})` : '';
      return `<tr><td colspan="3">${TIPO_LABEL[p.tipo] || p.tipo}${p.bandeira ? ' - ' + p.bandeira : ''}${p.parcelas ? ' ' + p.parcelas + 'x' : ''}${trocoTexto}</td><td class="right">${fm(p.valor)}</td></tr>`;
    }).join('');

    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Venda #${venda.numero}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#333;padding:40px}
      .header{text-align:center;margin-bottom:20px}.header h1{font-size:22px}.header p{font-size:12px;color:#666}
      .info{display:flex;justify-content:space-between;flex-wrap:wrap;margin-bottom:20px;padding:10px;background:#f5f5f5;border-radius:8px}
      .info div{font-size:12px}.info span{font-weight:700}
      table{width:100%;border-collapse:collapse;margin-bottom:15px}
      th{background:#f0f0f0;padding:8px 6px;text-align:left;font-size:11px;text-transform:uppercase;border-bottom:2px solid #ddd}
      td{padding:6px;border-bottom:1px solid #eee;font-size:11px}
      .center{text-align:center}.right{text-align:right}
      .total-row{font-size:14px;font-weight:700}.total-row td{padding:10px 6px;border-top:2px solid #333}
      .footer{text-align:center;margin-top:30px;font-size:10px;color:#999}
      @media print{body{padding:20px}}
    </style></head><body>
      <div class="header">
        <h1>MARQUINHO MOTO PECAS</h1>
        <p>Atacado & Varejo</p>
      </div>
      <div class="info">
        <div><span>Venda:</span> #${venda.numero}</div>
        <div><span>Data:</span> ${dataStr} ${horaStr}</div>
        ${venda.clienteNome ? `<div><span>Cliente:</span> ${esc(venda.clienteNome)}</div>` : ''}
        ${venda.clienteTelefone ? `<div><span>Telefone:</span> ${esc(venda.clienteTelefone)}</div>` : ''}
        ${venda.clienteCpf ? `<div><span>CPF:</span> ${esc(venda.clienteCpf)}</div>` : ''}
      </div>
      <table>
        <thead><tr><th>Codigo</th><th>Produto</th><th class="center">Qtd</th><th class="right">Preco Un.</th><th class="right">Desc.</th><th class="right">Subtotal</th></tr></thead>
        <tbody>${linhasItens}</tbody>
        <tfoot>
          ${venda.descontoTotal > 0 ? `<tr><td colspan="5" class="right">Descontos</td><td class="right" style="color:#c00">− ${fm(venda.descontoTotal)}</td></tr>` : ''}
          <tr class="total-row"><td colspan="5" class="right">TOTAL</td><td class="right">${fm(venda.total)}</td></tr>
        </tfoot>
      </table>
      <h3 style="font-size:13px;margin-bottom:5px">Pagamento</h3>
      <table><thead><tr><th colspan="3">Forma</th><th class="right">Valor</th></tr></thead><tbody>${linhasPg}</tbody></table>
      <div class="footer">Marquinho Moto Pecas — Obrigado pela preferencia!</div>
      <script>setTimeout(function(){window.print();},300);</script>
    </body></html>`);
    w.document.close();
  }

  function enviarWhatsApp() {
    const linhas = venda.itens.map(i => `• ${i.nome} (${i.codigo}) — ${i.quantidade}x ${fm(i.precoUnitario)} = ${fm(i.subtotal)}`).join('\n');
    const texto = `🧾 *MARQUINHO MOTO PEÇAS*\n*Venda #${venda.numero}*\n${dataStr} ${horaStr}\n\n${venda.clienteNome ? `*Cliente:* ${venda.clienteNome}\n` : ''}${venda.clienteTelefone ? `*Tel:* ${venda.clienteTelefone}\n` : ''}\n*Itens:*\n${linhas}\n\n${venda.descontoTotal > 0 ? `*Descontos:* −${fm(venda.descontoTotal)}\n` : ''}*TOTAL: ${fm(venda.total)}*\n\nObrigado pela preferencia! 🏍️`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={onFechar}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg my-4" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.25s ease-out' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-800">Venda Finalizada!</h2>
              <p className="text-xs text-slate-400">Venda #{venda.numero} · {dataStr} {horaStr}</p>
            </div>
          </div>
          <button onClick={onFechar} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Cliente */}
          {(venda.clienteNome || venda.clienteTelefone) && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs">
              {venda.clienteNome && <><span className="text-slate-500">Cliente: </span><span className="font-semibold text-slate-800">{venda.clienteNome}</span></>}
              {venda.clienteTelefone && <span className="text-slate-400 ml-2">Tel: {venda.clienteTelefone}</span>}
              {venda.clienteCpf && <span className="text-slate-400 ml-2">CPF: {venda.clienteCpf}</span>}
            </div>
          )}

          {/* Itens */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-medium mb-2">Itens ({venda.itens.length})</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {venda.itens.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{item.nome}</p>
                    <p className="text-[10px] text-slate-400">
                      {item.quantidade}x {fm(item.precoUnitario)} un.
                      {(item.descontoPercent > 0 || item.descontoReais > 0) && (
                        <span className="text-amber-600 ml-1">
                          (−{item.descontoPercent > 0 ? `${item.descontoPercent}%` : ''}{item.descontoReais > 0 ? fm(item.descontoReais) : ''})
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-bold text-slate-700 ml-2">{fm(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pagamentos */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-medium mb-2">Pagamento</p>
            <div className="space-y-1">
              {venda.pagamentos.map((p, i) => (
                <div key={i} className="flex justify-between text-xs p-2 rounded bg-slate-50">
                  <span className="text-slate-600">
                    {TIPO_LABEL[p.tipo] || p.tipo}
                    {p.bandeira && ` (${p.bandeira})`}
                    {p.parcelas && ` ${p.parcelas}x`}
                    {p.troco > 0 && <span className="text-amber-600 ml-1">Troco: {fm(p.troco)}</span>}
                  </span>
                  <span className="font-bold text-slate-800">{fm(p.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
            <span className="text-sm font-bold text-emerald-800">TOTAL</span>
            <span className="text-xl font-bold text-emerald-800">{fm(venda.total)}</span>
          </div>

          {/* Botoes de impressao */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <button onClick={imprimir} className="btn-secondary text-xs flex items-center justify-center gap-1 py-2.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Termica
            </button>
            <button onClick={imprimirA4} className="btn-secondary text-xs flex items-center justify-center gap-1 py-2.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              A4 / PDF
            </button>
            <button onClick={enviarWhatsApp} className="btn-secondary text-xs flex items-center justify-center gap-1 py-2.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button onClick={onFechar} className="btn-primary text-xs py-2.5">
              Nova Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
