import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/centro-custos
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  try {
    const centros = await prisma.centroCusto.findMany({
      where: { ativo: true },
      include: { _count: { select: { lancamentos: true } } },
      orderBy: { tipo: 'asc' },
    });
    return NextResponse.json(centros);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// C20 — Valores de tipo permitidos para CentroCusto
const TIPO_CENTRO_CUSTO_VALIDOS = ['LOJA', 'OFICINA', 'ADMINISTRATIVO', 'GERAL'];

// POST /api/financeiro/centro-custos
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.nome || !body.tipo) {
      return NextResponse.json({ error: 'nome e tipo obrigatorios' }, { status: 400 });
    }

    // C20 — Validar tipo contra valores permitidos
    if (!TIPO_CENTRO_CUSTO_VALIDOS.includes(body.tipo)) {
      return NextResponse.json({ error: `Tipo invalido. Valores permitidos: ${TIPO_CENTRO_CUSTO_VALIDOS.join(', ')}` }, { status: 400 });
    }
    const centro = await prisma.centroCusto.create({ data: { nome: body.nome, tipo: body.tipo, descricao: body.descricao } });
    return NextResponse.json(centro, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
