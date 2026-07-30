import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'DONO') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    if (!body.nome) {
      return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 });
    }
    const existing = await prisma.categoria.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
    }

    // Validar: so permite 1 nivel de subcategoria
    if (body.parentId) {
      if (body.parentId === id) {
        return NextResponse.json({ error: 'Uma categoria nao pode ser pai de si mesma' }, { status: 400 });
      }
      const parent = await prisma.categoria.findUnique({ where: { id: body.parentId } });
      if (!parent) {
        return NextResponse.json({ error: 'Categoria pai nao encontrada' }, { status: 400 });
      }
      if (parent.parentId) {
        return NextResponse.json({ error: 'Nao e permitido criar subcategoria de subcategoria. Apenas 1 nivel.' }, { status: 400 });
      }
      // Nao permitir que uma categoria com subcategorias vire subcategoria
      const subCount = await prisma.categoria.count({ where: { parentId: id } });
      if (subCount > 0) {
        return NextResponse.json({ error: 'Categorias com subcategorias nao podem ser movidas para baixo de outra categoria.' }, { status: 400 });
      }
    }

    // Slug gerado automaticamente a partir do nome — nunca recebido do frontend
    const slug = body.nome.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');
    const cat = await prisma.categoria.update({
      where: { id },
      data: {
        nome: body.nome,
        slug,
        descricao: body.descricao ?? null,
        descricaoIa: body.descricaoIa !== undefined ? body.descricaoIa : existing.descricaoIa,
        icone: body.icone ?? null,
        ordem: body.ordem ?? existing.ordem,
        ativa: body.ativa !== undefined ? body.ativa : existing.ativa,
        mostrarNaVitrine: body.mostrarNaVitrine !== undefined ? body.mostrarNaVitrine : existing.mostrarNaVitrine,
        permiteCadastro: body.permiteCadastro !== undefined ? body.permiteCadastro : existing.permiteCadastro,
        parentId: body.parentId !== undefined ? body.parentId : existing.parentId,
      },
      include: {
        _count: { select: { pecas: true } },
        subcategorias: { orderBy: { ordem: 'asc' } },
      },
    });
    return NextResponse.json(cat);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ja existe uma categoria com este nome' }, { status: 409 });
    }
    console.error('Erro ao editar categoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'DONO') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const { id } = await params;
    const existing = await prisma.categoria.findUnique({
      where: { id },
      include: {
        _count: { select: { pecas: true, subcategorias: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
    }
    if (existing._count.pecas > 0) {
      return NextResponse.json({ error: 'Esta categoria possui pecas cadastradas e nao pode ser excluida.' }, { status: 400 });
    }
    if (existing._count.subcategorias > 0) {
      return NextResponse.json({ error: 'Esta categoria possui subcategorias e nao pode ser excluida.' }, { status: 400 });
    }
    await prisma.categoria.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
