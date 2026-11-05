import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { podeReceber } from '@/lib/operacao-pedidos';
import { codigoPedido } from '@/lib/codigo-pedido';
import { assinarLinkComprovante, telefoneWhatsApp } from '@/lib/comprovante-link';

// Envio pela WhatsApp Business Platform (Cloud API). Credenciais ficam só no servidor:
//   WHATSAPP_CLOUD_TOKEN, WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_TEMPLATE_COMPROVANTE
//   (modelo aprovado pela Meta com 1 parâmetro no corpo: o link do comprovante),
//   WHATSAPP_TEMPLATE_IDIOMA opcional (padrão pt_BR).
// Sem essas variáveis a rota responde 501 e o Caixa usa o link pelo WhatsApp do aparelho.
const config = () => {
  const token = process.env.WHATSAPP_CLOUD_TOKEN, numero = process.env.WHATSAPP_PHONE_NUMBER_ID, modelo = process.env.WHATSAPP_TEMPLATE_COMPROVANTE;
  return token && numero && modelo ? { token, numero, modelo, idioma: process.env.WHATSAPP_TEMPLATE_IDIOMA || 'pt_BR' } : null;
};

export async function GET() {
  const s = await getSession();
  if (!podeReceber(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  return NextResponse.json({ oficial: !!config() });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!podeReceber(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const cfg = config();
  if (!cfg) return NextResponse.json({ error: 'Integracao oficial do WhatsApp nao configurada', oficial: false }, { status: 501 });
  const b = await req.json().catch(() => ({}));
  if (b.autorizado !== true) return NextResponse.json({ error: 'Confirme que o cliente autorizou receber o comprovante pelo WhatsApp' }, { status: 400 });
  if (typeof b.vendaId !== 'string') return NextResponse.json({ error: 'Venda obrigatoria' }, { status: 400 });
  const venda = await prisma.venda.findUnique({ where: { id: b.vendaId }, include: { pedido: { select: { numero: true, codigoNumero: true, clienteTelefone: true } } } });
  if (!venda || venda.status !== 'PAGA') return NextResponse.json({ error: 'Comprovante disponivel somente para venda paga' }, { status: 404 });
  const telefone = telefoneWhatsApp(typeof b.telefone === 'string' && b.telefone.trim() ? b.telefone : venda.pedido.clienteTelefone);
  if (!telefone) return NextResponse.json({ error: 'Telefone do cliente invalido' }, { status: 400 });
  const { token } = await assinarLinkComprovante(venda.id);
  const url = `${req.nextUrl.origin}/comprovante/${token}`;
  const log = await prisma.whatsAppLog.create({ data: { telefone, tipo: 'COMPROVANTE', mensagem: `Comprovante ${codigoPedido(venda.pedido)} via API oficial por ${s!.name}`, status: 'ENVIANDO' } });
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(cfg.numero)}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: telefone, type: 'template', template: { name: cfg.modelo, language: { code: cfg.idioma }, components: [{ type: 'body', parameters: [{ type: 'text', text: url }] }] } }),
      signal: AbortSignal.timeout(15000),
    });
    const corpo = await r.json().catch(() => ({}));
    const ok = r.ok && Array.isArray(corpo?.messages) && corpo.messages[0]?.id;
    await prisma.whatsAppLog.update({ where: { id: log.id }, data: { status: ok ? 'ACEITO_PELA_API' : 'FALHA', resposta: JSON.stringify(ok ? { id: corpo.messages[0].id } : { status: r.status, erro: corpo?.error?.message || null }).slice(0, 2000), enviadoEm: ok ? new Date() : null } });
    if (!ok) return NextResponse.json({ error: 'O WhatsApp recusou o envio. Use o envio pelo link.', detalhe: corpo?.error?.message || null }, { status: 502 });
    // "Aceito" pela API não é confirmação de entrega ao cliente.
    return NextResponse.json({ status: 'ACEITO_PELA_API', mensagemId: corpo.messages[0].id });
  } catch (e) {
    await prisma.whatsAppLog.update({ where: { id: log.id }, data: { status: 'FALHA', resposta: String((e as Error).message).slice(0, 2000) } });
    return NextResponse.json({ error: 'Falha ao contatar o WhatsApp. Use o envio pelo link.' }, { status: 502 });
  }
}
