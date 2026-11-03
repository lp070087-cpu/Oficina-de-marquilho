import { NextRequest } from 'next/server';
import { carregarComprovante, lerLinkComprovante } from '@/lib/comprovante-link';
import { htmlComprovante } from '@/lib/comprovante-html';

// Página pública do link enviado ao cliente. Só abre com token válido e dentro da validade.
const cabecalhos = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
const aviso = (msg: string) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Comprovante</title></head><body style="font:16px Arial,sans-serif;text-align:center;padding:48px 16px;color:#152236"><p>${msg}</p><p style="color:#667">Solicite um novo link à Marquinho Moto Peças.</p></body></html>`;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const vendaId = await lerLinkComprovante(token);
  if (!vendaId) return new Response(aviso('Este link de comprovante é inválido ou expirou.'), { status: 404, headers: cabecalhos });
  const dados = await carregarComprovante(vendaId);
  if (!dados || dados.venda.status !== 'PAGA') return new Response(aviso('Comprovante indisponível.'), { status: 404, headers: cabecalhos });
  return new Response(htmlComprovante(dados.pedido, dados.venda, { publico: true, segundaVia: true }), { headers: cabecalhos });
}
