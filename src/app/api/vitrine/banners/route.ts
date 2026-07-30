import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET — listar banners
export async function GET(req: NextRequest) {
  try {
    const tipo = req.nextUrl.searchParams.get('tipo');
    const where: any = {};
    if (tipo) where.tipo = tipo;

    const banners = await prisma.bannerCarrossel.findMany({ where, orderBy: { ordem: 'asc' } });
    return NextResponse.json(banners);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — criar banner (admin) com upload de imagem opcional
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const formData = await req.formData();
    const titulo = formData.get('titulo') as string || '';
    const subtitulo = formData.get('subtitulo') as string || '';
    const ctaTexto = formData.get('ctaTexto') as string || '';
    const ctaLink = formData.get('ctaLink') as string || '';
    const ordem = parseInt(formData.get('ordem') as string || '0');
    const dataInicio = formData.get('dataInicio') as string || null;
    const dataFim = formData.get('dataFim') as string || null;
    const corTexto = formData.get('corTexto') as string || null;
    const posicaoConteudo = formData.get('posicaoConteudo') as string || null;

    let imagemDesktop: string | null = null;
    let imagemMobile: string | null = null;

    const desktopFile = formData.get('imagemDesktop') as File | null;
    const mobileFile = formData.get('imagemMobile') as File | null;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
    await mkdir(uploadDir, { recursive: true });

    if (desktopFile) {
      const bytes = await desktopFile.arrayBuffer();
      const ext = desktopFile.name.split('.').pop() || 'png';
      const filename = `banner_desktop_${Date.now()}.${ext}`;
      await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
      imagemDesktop = `/uploads/banners/${filename}`;
    }

    if (mobileFile) {
      const bytes = await mobileFile.arrayBuffer();
      const ext = mobileFile.name.split('.').pop() || 'png';
      const filename = `banner_mobile_${Date.now()}.${ext}`;
      await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
      imagemMobile = `/uploads/banners/${filename}`;
    }

    const banner = await prisma.bannerCarrossel.create({
      data: { titulo, subtitulo, imagemDesktop, imagemMobile, ctaTexto, ctaLink, ordem, dataInicio, dataFim, corTexto, posicaoConteudo },
    });
    return NextResponse.json(banner);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
