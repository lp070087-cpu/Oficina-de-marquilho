import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { podeReceber } from '@/lib/operacao-pedidos';
import { CHAVE_WHATSAPP, MENSAGEM_PADRAO, formatarNumero, lerWhatsApp, validarConfigWhatsApp } from '@/lib/whatsapp-oficina';

// GET: a DONA vê a configuração completa; o Caixa só precisa saber se o envio está ativo.
// PUT: somente a DONA altera.
export async function GET() {
  const s = await getSession();
  if (s?.role === 'DONO') {
    const c = await lerWhatsApp();
    return NextResponse.json({ ...c, numeroFormatado: formatarNumero(c.numero), mensagemPadrao: MENSAGEM_PADRAO, apiOficial: !!(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_COMPROVANTE) });
  }
  if (!podeReceber(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const c = await lerWhatsApp();
  return NextResponse.json({ ativo: c.ativo, nomeExibicao: c.nomeExibicao, numeroFormatado: formatarNumero(c.numero) });
}

export async function PUT(req: NextRequest) {
  const s = await getSession();
  if (s?.role !== 'DONO') return NextResponse.json({ error: 'Somente a administracao altera o WhatsApp da oficina' }, { status: 403 });
  const { config, erro } = validarConfigWhatsApp(await req.json().catch(() => null));
  if (!config) return NextResponse.json({ error: erro }, { status: 400 });
  const valor = JSON.stringify({ ...config, atualizadoPor: s.name, atualizadoEm: new Date().toISOString() });
  await prisma.configuracaoVitrine.upsert({
    where: { chave: CHAVE_WHATSAPP },
    create: { chave: CHAVE_WHATSAPP, valor, descricao: 'WhatsApp da oficina: numero oficial, nome, envio de comprovantes e mensagem padrao' },
    update: { valor },
  });
  const c = await lerWhatsApp();
  return NextResponse.json({ ...c, numeroFormatado: formatarNumero(c.numero) });
}
