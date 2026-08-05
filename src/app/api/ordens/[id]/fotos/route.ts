import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/ordens/[id]/fotos — Listar fotos da OS
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

    const { id } = await params;
    const tipo = req.nextUrl.searchParams.get('tipo') || '';

    const where: any = { ordemServicoId: id };
    if (tipo) where.tipo = tipo;

    const fotos = await prisma.fotoOS.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(fotos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/ordens/[id]/fotos — Adicionar foto a OS
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.url || !body.tipo) {
      return NextResponse.json({ error: 'URL da foto e tipo sao obrigatorios' }, { status: 400 });
    }

    // FASE 15-F.1: novos tipos de foto (obrigatórias + extras)
    const tiposValidos = ['RECEPCAO', 'ANTES', 'DURANTE', 'DEPOIS', 'ENTREGA',
      'PECAS_DANIFICADAS', 'PECAS_TROCADAS', 'OBSERVACOES', 'CLIENTE'];
    if (!tiposValidos.includes(body.tipo)) {
      return NextResponse.json({ error: `Tipo invalido. Validos: ${tiposValidos.join(', ')}` }, { status: 400 });
    }

    // FASE 15-F.1: fotos obrigatórias (RECEPCAO, ANTES, DEPOIS) têm obrigatorio = true
    const tiposObrigatorios = ['RECEPCAO', 'ANTES', 'DEPOIS'];
    const obrigatorio = tiposObrigatorios.includes(body.tipo);

    const foto = await prisma.fotoOS.create({
      data: {
        ordemServicoId: id,
        tipo: body.tipo,
        url: body.url,
        descricao: body.descricao || null,
        obrigatorio,
      },
    });

    await prisma.historicoOS.create({
      data: {
        ordemServicoId: id,
        tipo: 'MUDANCA_STATUS',
        descricao: `Foto adicionada (${body.tipo}): ${body.descricao || 'sem descricao'}`,
        usuario: session.name,
        usuarioId: session.id,
      },
    });

    return NextResponse.json(foto, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar foto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/ordens/[id]/fotos — Remover foto
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !['DONO'].includes(session.role)) {
      return NextResponse.json({ error: 'Apenas Dono pode remover fotos' }, { status: 403 });
    }

    const fotoId = req.nextUrl.searchParams.get('fotoId');
    if (!fotoId) return NextResponse.json({ error: 'ID da foto e obrigatorio' }, { status: 400 });

    await prisma.fotoOS.delete({ where: { id: fotoId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
