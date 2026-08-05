import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    const depoimentos = await prisma.depoimento.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
      take: 20,
    });
    return NextResponse.json(depoimentos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const rl = checkRateLimit(req, { key: 'vitrine:depoimentos', maxRequests: 3, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const depoimento = await prisma.depoimento.create({
      data: {
        nome: body.nome || 'Cliente',
        cargo: body.cargo || null,
        texto: body.texto || '',
        estrelas: body.estrelas || 5,
        ativo: body.ativo ?? false,
        ordem: body.ordem || 0,
      },
    });
    return NextResponse.json(depoimento);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
