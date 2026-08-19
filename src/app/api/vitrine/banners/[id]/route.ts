import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { del } from '@vercel/blob';

// Helper: verifica se a URL pertence ao Vercel Blob (só chama del() nesses casos).
function isBlobUrl(url: string | null): boolean {
  return typeof url === 'string' && url.includes('.public.blob.vercel-storage.com');
}

// DELETE — remover banner (admin)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });
    const banner = await prisma.bannerCarrossel.findUnique({ where: { id } });
    // Migração Vercel Blob (2026-08-18): se a URL pertencer ao Blob, remover o arquivo remoto.
    // URLs antigas (/uploads/...) não pertencem ao Blob e não chamam del().
    if (banner) {
      if (isBlobUrl(banner.imagemDesktop)) {
        try { await del(banner.imagemDesktop!); } catch (e: any) { console.error('Erro ao deletar blob desktop:', e); }
      }
      if (isBlobUrl(banner.imagemMobile)) {
        try { await del(banner.imagemMobile!); } catch (e: any) { console.error('Erro ao deletar blob mobile:', e); }
      }
    }
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
