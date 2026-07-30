import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/whatsapp — Listar logs de WhatsApp
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const tipo = req.nextUrl.searchParams.get('tipo') || '';
  const status = req.nextUrl.searchParams.get('status') || '';

  const where: any = {};
  if (tipo) where.tipo = tipo;
  if (status) where.status = status;

  const logs = await prisma.whatsAppLog.findMany({
    where,
    include: { ordemServico: { select: { numero: true, nomeCliente: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(logs);
}

// POST /api/whatsapp — Registrar tentativa de envio (estrutura, sem integracao)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  try {
    const body = await req.json();
    if (!body.telefone || !body.tipo || !body.mensagem) {
      return NextResponse.json({ error: 'Telefone, tipo e mensagem sao obrigatorios' }, { status: 400 });
    }

    const tiposValidos = ['OS_CRIADA', 'STATUS_ATUALIZADO', 'ORCAMENTO', 'LEMBRETE_REVISAO', 'ENTREGA'];
    if (!tiposValidos.includes(body.tipo)) {
      return NextResponse.json({ error: `Tipo invalido. Validos: ${tiposValidos.join(', ')}` }, { status: 400 });
    }

    // Estrutura — nao envia mensagem real, apenas registra log
    const log = await prisma.whatsAppLog.create({
      data: {
        ordemServicoId: body.ordemServicoId || null,
        telefone: body.telefone,
        tipo: body.tipo,
        mensagem: body.mensagem,
        status: 'PENDENTE', // Sempre PENDENTE ate integracao futura
      },
    });

    // Se for LEMBRETE_REVISAO, marcar revisao como notificada
    if (body.tipo === 'LEMBRETE_REVISAO' && body.revisaoId) {
      await prisma.revisaoAgendada.update({
        where: { id: body.revisaoId },
        data: { notificada: true },
      });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar log WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
