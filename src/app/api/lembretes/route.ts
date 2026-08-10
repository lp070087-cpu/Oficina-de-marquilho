import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — listar lembretes do usuário
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pendentes'; // pendentes, concluidos, todos

    const where: any = { usuarioId: session.id };
    if (status === 'pendentes') where.concluido = false;
    if (status === 'concluidos') where.concluido = true;

    const lembretes = await prisma.lembreteSistema.findMany({
      where,
      orderBy: [{ concluido: 'asc' }, { dataHora: 'asc' }],
      take: 50,
    });

    return NextResponse.json(lembretes);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — criar lembrete
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { titulo, descricao, dataHora, entidadeTipo, entidadeId } = await req.json();
    if (!titulo) return NextResponse.json({ error: 'título obrigatório' }, { status: 400 });
    if (!dataHora) return NextResponse.json({ error: 'dataHora obrigatória' }, { status: 400 });

    // C20 — Validar dataHora como data válida
    const dataHoraParsed = new Date(dataHora);
    if (isNaN(dataHoraParsed.getTime())) {
      return NextResponse.json({ error: 'dataHora inválida' }, { status: 400 });
    }

    const lembrete = await prisma.lembreteSistema.create({
      data: {
        usuarioId: session.id,
        titulo,
        descricao: descricao || null,
        dataHora: new Date(dataHora),
        entidadeTipo: entidadeTipo || null,
        entidadeId: entidadeId || null,
      },
    });

    return NextResponse.json(lembrete, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
