import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/servicos — Listar servicos tabelados
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const categoria = req.nextUrl.searchParams.get('categoria') || '';
  const ativo = req.nextUrl.searchParams.get('ativo');

  try {
    const where: any = {};
    if (categoria) where.categoria = categoria;
    if (ativo !== null && ativo !== '') where.ativo = ativo === 'true';

    const servicos = await prisma.servicoTabelado.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    });

    return NextResponse.json(servicos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/servicos — Criar servico tabelado
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono pode criar servicos tabelados' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.nome) {
      return NextResponse.json({ error: 'Nome do servico e obrigatorio' }, { status: 400 });
    }

    const servico = await prisma.servicoTabelado.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || null,
        valor: body.valor || 0,
        tempoEstimado: body.tempoEstimado || null,
        garantiaDias: body.garantiaDias || null,
        categoria: body.categoria || null,
      },
    });

    return NextResponse.json(servico, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar servico tabelado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT /api/servicos — Atualizar servico tabelado
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono pode editar servicos tabelados' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID do servico e obrigatorio' }, { status: 400 });
    }

    const data: any = {};
    if (body.nome !== undefined) data.nome = body.nome;
    if (body.descricao !== undefined) data.descricao = body.descricao;
    if (body.valor !== undefined) data.valor = body.valor;
    if (body.tempoEstimado !== undefined) data.tempoEstimado = body.tempoEstimado;
    if (body.garantiaDias !== undefined) data.garantiaDias = body.garantiaDias;
    if (body.categoria !== undefined) data.categoria = body.categoria;
    if (body.ativo !== undefined) data.ativo = body.ativo;

    const servico = await prisma.servicoTabelado.update({
      where: { id: body.id },
      data,
    });

    return NextResponse.json(servico);
  } catch (error) {
    console.error('Erro ao atualizar servico tabelado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/servicos — Desativar servico tabelado (soft delete)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono pode remover servicos tabelados' }, { status: 403 });
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID do servico e obrigatorio' }, { status: 400 });

    const servico = await prisma.servicoTabelado.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json(servico);
  } catch (error) {
    console.error('Erro ao desativar servico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
