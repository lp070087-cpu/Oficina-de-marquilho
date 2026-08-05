import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/ordens/[id]/revisoes — Listar revisoes agendadas
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

    const { id } = await params;
    const revisoes = await prisma.revisaoAgendada.findMany({
      where: { ordemServicoId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(revisoes);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/ordens/[id]/revisoes — Agendar revisao
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.tipo || !body.valor) {
      return NextResponse.json({ error: 'Tipo (KM/DATA) e valor sao obrigatorios' }, { status: 400 });
    }

    if (!['KM', 'DATA'].includes(body.tipo)) {
      return NextResponse.json({ error: 'Tipo deve ser KM ou DATA' }, { status: 400 });
    }

    const revisao = await prisma.revisaoAgendada.create({
      data: {
        ordemServicoId: id,
        tipo: body.tipo,
        valor: body.valor,
        descricao: body.descricao || null,
      },
    });

    await prisma.historicoOS.create({
      data: {
        ordemServicoId: id,
        tipo: 'MUDANCA_STATUS',
        descricao: `Revisao agendada: ${body.tipo === 'KM' ? `${body.valor} km` : `Data: ${body.valor}`}${body.descricao ? ` — ${body.descricao}` : ''}`,
        usuario: session.name,
        usuarioId: session.id,
      },
    });

    return NextResponse.json(revisao, { status: 201 });
  } catch (error) {
    console.error('Erro ao agendar revisao:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/ordens/[id]/revisoes — Remover revisao agendada
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !['DONO'].includes(session.role)) {
      return NextResponse.json({ error: 'Apenas Dono pode remover revisoes' }, { status: 403 });
    }

    const revisaoId = req.nextUrl.searchParams.get('revisaoId');
    if (!revisaoId) return NextResponse.json({ error: 'ID da revisao e obrigatorio' }, { status: 400 });

    await prisma.revisaoAgendada.delete({ where: { id: revisaoId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
