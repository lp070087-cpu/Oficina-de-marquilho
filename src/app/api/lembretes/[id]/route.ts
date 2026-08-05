import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH — atualizar lembrete (marcar como concluído, editar)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.titulo !== undefined) data.titulo = body.titulo;
    if (body.descricao !== undefined) data.descricao = body.descricao;
    if (body.dataHora !== undefined) data.dataHora = new Date(body.dataHora);
    if (body.concluido !== undefined) {
      data.concluido = body.concluido;
      data.concluidoEm = body.concluido ? new Date() : null;
    }

    await prisma.lembreteSistema.updateMany({
      where: { id, usuarioId: session.id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remover lembrete
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.lembreteSistema.deleteMany({ where: { id, usuarioId: session.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
