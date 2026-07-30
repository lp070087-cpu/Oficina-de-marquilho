import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// DELETE — remover banner (admin)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    await prisma.bannerCarrossel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — atualizar banner (admin)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const data = await req.json();
    const { id, ...rest } = data;
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    const banner = await prisma.bannerCarrossel.update({ where: { id }, data: rest });
    return NextResponse.json(banner);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
