import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — listar assinantes newsletter (admin)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const assinantes = await prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const total = await prisma.newsletter.count();
    const ativos = await prisma.newsletter.count({ where: { ativo: true } });
    return NextResponse.json({ assinantes, total, ativos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — alterar status de um assinante (admin)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const { id, ativo } = await req.json();
    await prisma.newsletter.update({ where: { id }, data: { ativo } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
