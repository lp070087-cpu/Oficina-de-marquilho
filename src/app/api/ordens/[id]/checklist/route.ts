import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/ordens/[id]/checklist — Listar checklist da OS
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

    const { id } = await params;
    const itens = await prisma.itemChecklistOS.findMany({
      where: { ordemServicoId: id },
      orderBy: { item: 'asc' },
    });

    return NextResponse.json(itens);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/ordens/[id]/checklist — Adicionar item ao checklist
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();

    if (Array.isArray(body.itens)) {
      // Bulk insert — aplicar template de checklist (FASE 15-F.1: suporte a obrigatorio)
      const created = await prisma.$transaction(
        body.itens.map((entry: string | { item: string; obrigatorio?: boolean }) => {
          const itemStr = typeof entry === 'string' ? entry : entry.item;
          const obrigatorio = typeof entry === 'object' ? (entry.obrigatorio ?? false) : false;
          return prisma.itemChecklistOS.create({
            data: { ordemServicoId: id, item: itemStr, obrigatorio },
          });
        })
      );

      // Registrar historico
      await prisma.historicoOS.create({
        data: {
          ordemServicoId: id,
          tipo: 'MUDANCA_STATUS',
          descricao: `${created.length} itens adicionados ao checklist`,
          usuario: session.name,
          usuarioId: session.id,
        },
      });

      return NextResponse.json(created, { status: 201 });
    }

    if (!body.item) {
      return NextResponse.json({ error: 'Nome do item e obrigatorio' }, { status: 400 });
    }

    // FASE 15-F.1: suporte a obrigatorio no item individual
    const item = await prisma.itemChecklistOS.create({
      data: { ordemServicoId: id, item: body.item, obrigatorio: body.obrigatorio ?? false },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar item checklist:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT /api/ordens/[id]/checklist — Atualizar item (marcar concluido/desmarcar)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.itemId) {
      return NextResponse.json({ error: 'ID do item e obrigatorio' }, { status: 400 });
    }

    const data: any = {};
    if (body.concluido !== undefined) {
      data.concluido = body.concluido;
      data.concluidoEm = body.concluido ? new Date() : null;
      data.usuario = body.concluido ? session.name : null;
    }
    if (body.observacao !== undefined) data.observacao = body.observacao;

    const item = await prisma.itemChecklistOS.update({
      where: { id: body.itemId },
      data,
    });

    if (body.concluido !== undefined) {
      await prisma.historicoOS.create({
        data: {
          ordemServicoId: id,
          tipo: 'MUDANCA_STATUS',
          descricao: body.concluido ? `Checklist: "${item.item}" concluido` : `Checklist: "${item.item}" reaberto`,
          usuario: session.name,
          usuarioId: session.id,
        },
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
