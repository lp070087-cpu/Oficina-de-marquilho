import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { put } from '@vercel/blob';
import prisma from '@/lib/prisma';

// Upload da logo da oficina — exclusivo da DONA.
// Mesmo padrão de validação do /api/upload (allow-list + magic bytes + 5MB),
// mas sem pecaId: grava a URL pública do Blob na ConfiguracaoVitrine chave 'logoOficina'.
const CHAVE_LOGO = 'logoOficina';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { key: 'upload-logo', maxRequests: 10, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json({ error: 'Muitos uploads. Tente novamente em instantes.' }, { status: 429 });
  }

  try {
    const session = await getSession();
    if (!session || session.role !== 'DONO') {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('imagem') as File;
    if (!file) return NextResponse.json({ error: 'Imagem obrigatoria' }, { status: 400 });

    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(rawExt)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' }, { status: 400 });
    }
    if (file.name.includes('/') || file.name.includes('\\') || file.name.includes('..')) {
      return NextResponse.json({ error: 'Nome de arquivo invalido' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validação real do conteúdo (magic bytes), não confia em MIME.
    const magic = buffer.subarray(0, 12);
    const isPNG  = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47;
    const isJPEG = magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF;
    const isWebP = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46
      && magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50;

    if ((rawExt === 'png' && !isPNG) || (rawExt === 'jpg' && !isJPEG) || (rawExt === 'jpeg' && !isJPEG) || (rawExt === 'webp' && !isWebP)) {
      return NextResponse.json({ error: 'Conteúdo do arquivo não corresponde à extensão informada.' }, { status: 400 });
    }

    const fileName = `logo-${Date.now()}.${rawExt}`;
    const blob = await put(`oficina/${fileName}`, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: `image/${rawExt === 'jpg' ? 'jpeg' : rawExt}`,
    });

    await prisma.configuracaoVitrine.upsert({
      where: { chave: CHAVE_LOGO },
      update: { valor: JSON.stringify(blob.url) },
      create: { chave: CHAVE_LOGO, valor: JSON.stringify(blob.url), descricao: 'Logo da oficina (URL pública)' },
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Erro no upload da logo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
