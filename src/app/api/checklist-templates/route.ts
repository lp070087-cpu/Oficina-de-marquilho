import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/checklist-templates — Listar modelos de checklist
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const servicoId = req.nextUrl.searchParams.get('servicoId') || '';

  if (servicoId) {
    // Retornar templates vinculados ao tipo de serviço
    const templates = await prisma.checklistServicoTemplate.findMany({
      where: { servicoTabeladoId: servicoId },
      include: {
        template: {
          include: { itens: { orderBy: { ordem: 'asc' } } },
        },
      },
    });
    return NextResponse.json(templates.map(t => t.template));
  }

  const templates = await prisma.checklistTemplate.findMany({
    include: { itens: { orderBy: { ordem: 'asc' } }, servicos: true },
    orderBy: { ordem: 'asc' },
  });
  return NextResponse.json(templates);
}

// POST /api/checklist-templates — Criar modelo
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.nome) return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 });

    const template = await prisma.checklistTemplate.create({
      data: {
        nome: body.nome,
        ordem: body.ordem || 0,
        itens: {
          create: (body.itens || []).map((item: any, i: number) => ({
            item: typeof item === 'string' ? item : item.item,
            obrigatorio: typeof item === 'object' ? (item.obrigatorio ?? true) : true,
            ordem: i,
          })),
        },
      },
      include: { itens: { orderBy: { ordem: 'asc' } } },
    });

    // Se tem servicoId, vincular ao tipo de serviço
    if (body.servicoId) {
      await prisma.checklistServicoTemplate.create({
        data: { servicoTabeladoId: body.servicoId, templateId: template.id },
      });
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT /api/checklist-templates — Atualizar modelo
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

    const data: any = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.ativo !== undefined) data.ativo = body.ativo;

    const template = await prisma.checklistTemplate.update({
      where: { id: body.id },
      data,
      include: { itens: { orderBy: { ordem: 'asc' } } },
    });

    // Atualizar itens se enviados
    if (body.itens) {
      await prisma.checklistTemplateItem.deleteMany({ where: { templateId: body.id } });
      await prisma.checklistTemplateItem.createMany({
        data: body.itens.map((item: any, i: number) => ({
          templateId: body.id,
          item: typeof item === 'string' ? item : item.item,
          obrigatorio: typeof item === 'object' ? (item.obrigatorio ?? true) : true,
          ordem: i,
        })),
      });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE /api/checklist-templates — Remover modelo
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

  await prisma.checklistTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
