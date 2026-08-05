import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/financeiro/auditoria
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Apenas Dono' }, { status: 403 });
  }

  try {
    const entidade = req.nextUrl.searchParams.get('entidade') || '';
    const acao = req.nextUrl.searchParams.get('acao') || '';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');

    const where: any = {};
    if (entidade) where.entidade = entidade;
    if (acao) where.acao = acao;

    const registros = await prisma.auditoriaFinanceira.findMany({
      where, orderBy: { createdAt: 'desc' }, take: Math.min(limit, 300),
    });
    return NextResponse.json(registros);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
