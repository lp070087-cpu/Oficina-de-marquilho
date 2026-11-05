import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { podeReceber } from '@/lib/operacao-pedidos';
import { codigoPedido } from '@/lib/codigo-pedido';
import { assinarLinkComprovante, telefoneWhatsApp } from '@/lib/comprovante-link';
import { lerWhatsApp, montarMensagem } from '@/lib/whatsapp-oficina';

// Prepara o envio pelo WhatsApp sem integração oficial: gera o link temporário do comprovante
// e a mensagem padrão definida pela DONA em "WhatsApp da Oficina". Abrir a conversa não é
// envio: o operador confirma no próprio WhatsApp.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!podeReceber(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const config = await lerWhatsApp();
  if (!config.ativo) return NextResponse.json({ error: 'Envio de comprovantes pelo WhatsApp desativado pela administracao' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (typeof b.vendaId !== 'string') return NextResponse.json({ error: 'Venda obrigatoria' }, { status: 400 });
  const venda = await prisma.venda.findUnique({ where: { id: b.vendaId }, include: { pedido: { select: { numero: true, codigoNumero: true, clienteNome: true, clienteTelefone: true } } } });
  if (!venda || venda.status !== 'PAGA') return NextResponse.json({ error: 'Comprovante disponivel somente para venda paga' }, { status: 404 });
  const { token, expiraEm } = await assinarLinkComprovante(venda.id);
  const url = `${req.nextUrl.origin}/comprovante/${token}`;
  const telefone = telefoneWhatsApp(typeof b.telefone === 'string' && b.telefone.trim() ? b.telefone : venda.pedido.clienteTelefone);
  const nome = venda.pedido.clienteNome?.trim().split(/\s+/)[0];
  const validade = expiraEm.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
  const mensagem = montarMensagem(config.mensagem, { nomeExibicao: config.nomeExibicao, codigoPedido: codigoPedido(venda.pedido), linkComprovante: url, nomeCliente: nome, validade });
  await prisma.whatsAppLog.create({ data: { telefone: telefone || 'NAO_INFORMADO', tipo: 'COMPROVANTE', mensagem: `Link preparado para o pedido ${codigoPedido(venda.pedido)} por ${s!.name}`, status: 'LINK_PREPARADO' } });
  return NextResponse.json({ url, expiraEm, telefone, mensagem, whatsappUrl: `https://wa.me/${telefone || ''}?text=${encodeURIComponent(mensagem)}` });
}
