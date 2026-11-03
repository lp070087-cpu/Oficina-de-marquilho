'use client';

import { htmlComprovante, type OpcoesComprovante } from '@/lib/comprovante-html';

export { codigoPedido } from '@/lib/codigo-pedido';
export { dinheiro, formas, maoDeObra, descreverPagamento, htmlComprovante } from '@/lib/comprovante-html';

/**
 * Abre a caixa de impressão do navegador para o comprovante, a partir de um iframe oculto
 * (não depende de pop-up liberado). A impressão física depende da impressora escolhida
 * pelo usuário nessa caixa — o sistema não afirma que algo foi impresso.
 */
export function imprimirPedido(pedido: any, venda?: any, opcoes: OpcoesComprovante = {}) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc || !frame.contentWindow) { frame.remove(); throw new Error('Não foi possível preparar a impressão neste navegador.'); }
  doc.open(); doc.write(htmlComprovante(pedido, venda, opcoes)); doc.close();
  const win = frame.contentWindow;
  setTimeout(() => {
    win.focus(); win.print();
    setTimeout(() => frame.remove(), 60_000);
  }, 250);
}
