import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { normalizarSubcategoria, podeEditarPrecos } from '@/lib/peca-utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const { id } = await params;
    const peca = await prisma.peca.findUnique({
      where: { id, ativo: true },
      include: { categoria: { select: { nome: true } } },
    });
    if (!peca) return NextResponse.json({ error: 'Peca nao encontrada' }, { status: 404 });
    return NextResponse.json(peca);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    if (!body.nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    const existing = await prisma.peca.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Peça não encontrada' }, { status: 404 });

    const podePreco = podeEditarPrecos(session);

    const has = (v: unknown) => v !== undefined && v !== null;
    const data: any = {
      nome: body.nome,
      descricao: has(body.descricao) ? body.descricao : existing.descricao,
      codigo: has(body.codigo) ? body.codigo : existing.codigo,
      // Preservar campos opcionais quando o formulário não os enviar (nunca zerar).
      // Se o formulário enviar vazio explicitamente, limpa ('' → null).
      codigoBarras: has(body.codigoBarras) ? (body.codigoBarras || null) : existing.codigoBarras,
      localizacao: has(body.localizacao) ? (body.localizacao || null) : existing.localizacao,
      custoMedio: has(body.custoMedio) ? body.custoMedio : existing.custoMedio,
      quantidade: has(body.quantidade) ? body.quantidade : existing.quantidade,
      quantidadeLoja: has(body.quantidadeLoja) ? body.quantidadeLoja : existing.quantidadeLoja,
      estoqueMinimo: has(body.estoqueMinimo) ? body.estoqueMinimo : existing.estoqueMinimo,
      // Subcategoria: se enviada, normaliza sentinela "Sem subcategoria" → null; se ausente, preserva.
      subcategoria: has(body.subcategoria) ? normalizarSubcategoria(body.subcategoria) : existing.subcategoria,
      marca: has(body.marca) ? body.marca : existing.marca,
      compatibilidade: has(body.compatibilidade) ? body.compatibilidade : existing.compatibilidade,
      categoriaId: has(body.categoriaId) ? body.categoriaId : existing.categoriaId,
    };

    // Preços: somente DONO/ESTOQUE podem alterar. BALCAO/MECANICO não.
    if (podePreco) {
      if (body.precoVenda !== undefined) data.precoVenda = body.precoVenda;
      if (body.precoCusto !== undefined) data.precoCusto = body.precoCusto;
    }

    const peca = await prisma.peca.update({
      where: { id },
      data,
      include: { categoria: { select: { nome: true } } },
    });
    return NextResponse.json(peca);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !['DONO'].includes(session.role)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    const { id } = await params;
    await prisma.peca.update({ where: { id }, data: { ativo: false } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
