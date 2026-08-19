import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — listar cupons (admin: todos, vitrine: apenas ativos e dentro da validade)
export async function GET(req: NextRequest) {
  try {
    const isAdmin = req.nextUrl.searchParams.get('admin') === '1';
    // C3 — Exigir autenticação DONO para acesso administrativo (admin=1)
    if (isAdmin) {
      const session = await getSession();
      if (!session || session.role !== 'DONO') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    let where: any = { ativo: true };
    const codigo = req.nextUrl.searchParams.get('codigo');
    if (codigo) where.codigo = codigo.trim().toUpperCase();
    if (!isAdmin) {
      const now = new Date();
      where.dataInicio = { lte: now };
      where.OR = [{ dataFim: null }, { dataFim: { gte: now } }];
    }
    const cupons = await prisma.cupom.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(cupons);
  } catch (e: any) {
    console.error('Erro ao listar cupons:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST — criar cupom (admin)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const data = await req.json();
    if (!data.codigo) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 });

    const cupom = await prisma.cupom.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        descricao: data.descricao,
        tipo: data.tipo || 'PERCENTUAL',
        valor: data.valor || 0,
        valorMinimo: data.valorMinimo,
        quantidadeMax: data.quantidadeMax,
        porCliente: data.porCliente,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
        dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        categorias: data.categorias ? JSON.stringify(data.categorias) : undefined,
        produtos: data.produtos ? JSON.stringify(data.produtos) : undefined,
        primeiraCompra: data.primeiraCompra || false,
      },
    });
    return NextResponse.json(cupom);
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Código já existe' }, { status: 400 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
