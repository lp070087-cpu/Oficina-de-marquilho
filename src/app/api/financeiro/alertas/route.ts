import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/alertas
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  try {
    const apenasAtivos = req.nextUrl.searchParams.get('apenasAtivos') !== 'false';

    const where: any = {};
    if (apenasAtivos) where.resolvido = false;

    const alertas = await prisma.alertaFinanceiro.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 50,
    });
    return NextResponse.json(alertas);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — Resolver alerta
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

    const alerta = await prisma.alertaFinanceiro.update({
      where: { id: body.id },
      data: { resolvido: true, resolvidoPor: session.name, resolvidoEm: new Date() },
    });
    return NextResponse.json(alerta);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
