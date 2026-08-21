import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { put } from '@vercel/blob';

// Tamanho máximo de imagem: 8MB (blob/vercel tem limite de 4.5MB para requests,
// mas mantemos 8MB para não quebrar uploads de imagens maiores no editor local).
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MIME_VALIDOS = ['image/png', 'image/jpeg', 'image/webp'];

// Detecta o tipo real via "magic bytes" (não confia no nome/Content-Type do cliente).
function detectarTipo(bytes: Uint8Array): 'png' | 'jpeg' | 'webp' | null {
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'webp';
  return null;
}

const CONTENT_TYPE: Record<string, string> = {
  png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp',
};

// GET — listar banners.
// Admin (DONO/BALCAO/ESTOQUE): lista TODOS (inclusive inativos) para edição.
// Público: SÓ banners ativos dentro do período (dataInicio/dataFim).
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const isAdmin = session && ['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role);
    const where: any = {};
    if (!isAdmin) {
      where.ativo = true;
      where.OR = [
        { dataInicio: null, dataFim: null },
        { dataInicio: { lte: new Date() }, dataFim: { gte: new Date() } },
        { dataInicio: { lte: new Date() }, dataFim: null },
        { dataInicio: null, dataFim: { gte: new Date() } },
      ];
    }
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
    // Rodada Subcategorias (2026-08-21): onde exibir — DESKTOP | MOBILE | AMBOS (default AMBOS).
    const exibirEmRaw = (formData.get('exibirEm') as string || '').trim().toUpperCase();
    const exibirEm = ['DESKTOP', 'MOBILE'].includes(exibirEmRaw) ? exibirEmRaw : 'AMBOS';

    let imagemDesktop: string | null = null;
    let imagemMobile: string | null = null;

    const desktopFile = formData.get('imagemDesktop') as File | null;
    const mobileFile = formData.get('imagemMobile') as File | null;

    // Item 3/4 — VALIDAÇÃO de imagem: MIME whitelist + magic bytes + limite de tamanho.
    async function validarEUpcar(file: File, prefixo: string): Promise<string> {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.byteLength === 0) throw new Error('Arquivo vazio');
      if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('Imagem muito grande (máx. 8MB)');
      if (!MIME_VALIDOS.includes(file.type)) throw new Error('Formato não permitido. Use PNG, JPG ou WEBP');
      const tipo = detectarTipo(bytes);
      if (!tipo) throw new Error('Arquivo não é uma imagem válida (PNG/JPG/WEBP)');
      const filename = `${prefixo}_${Date.now()}.${tipo}`;
      const blob = await put(`banners/${filename}`, Buffer.from(bytes), {
        access: 'public',
        addRandomSuffix: true,
        contentType: CONTENT_TYPE[tipo],
      });
      return blob.url;
    }

    if (desktopFile && desktopFile.size > 0) {
      imagemDesktop = await validarEUpcar(desktopFile, 'banner_desktop');
    }
    if (mobileFile && mobileFile.size > 0) {
      imagemMobile = await validarEUpcar(mobileFile, 'banner_mobile');
    }

    const banner = await prisma.bannerCarrossel.create({
      data: { titulo, subtitulo, imagemDesktop, imagemMobile, ctaTexto, ctaLink, ordem, dataInicio, dataFim, corTexto, posicaoConteudo, exibirEm },
    });
    return NextResponse.json(banner);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
