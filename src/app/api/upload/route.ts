import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { put } from '@vercel/blob';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  // Rate limit: 30 uploads por IP a cada 60s
  const rl = checkRateLimit(req, { key: 'upload', maxRequests: 30, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitos uploads. Tente novamente em instantes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const formData = await req.formData();
  const file = formData.get('imagem') as File;
  const pecaId = formData.get('pecaId') as string;
  if (!file || !pecaId) return NextResponse.json({ error: 'Imagem e pecaId obrigatorios' }, { status: 400 });

  // C1 — Sanitizar pecaId: apenas alfanumérico, hífen e underscore (previne path traversal)
  // IDs usam formato CUID (c + 24 chars alfanuméricos), compatível com UUIDs
  const PECA_ID_REGEX = /^[a-zA-Z0-9_-]{1,40}$/;
  if (!PECA_ID_REGEX.test(pecaId)) {
    return NextResponse.json({ error: 'ID de peca invalido' }, { status: 400 });
  }

  // C1 — Validar extensão contra allow-list (não confiar apenas em MIME)
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(rawExt)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' }, { status: 400 });
  }
  // Rejeitar nomes de arquivo com path traversal na extensão
  if (file.name.includes('/') || file.name.includes('\\') || file.name.includes('..')) {
    return NextResponse.json({ error: 'Nome de arquivo invalido' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // C1 — Verificar magic bytes (validação real do tipo, não confia em MIME spoofável)
  const magic = buffer.subarray(0, 12);
  const isPNG  = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47;
  const isJPEG = magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF;
  const isWebP = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46
    && magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50;

  if ((rawExt === 'png' && !isPNG) || (rawExt === 'jpg' && !isJPEG) || (rawExt === 'jpeg' && !isJPEG) || (rawExt === 'webp' && !isWebP)) {
    return NextResponse.json({ error: 'Conteúdo do arquivo não corresponde à extensão informada.' }, { status: 400 });
  }

  const fileName = `${pecaId}-${Date.now()}.${rawExt}`;

  // Migração Vercel Blob (2026-08-18): upload para Blob em vez de filesystem efêmero.
  // Salva no Neon SOMENTE a URL pública retornada pelo Blob.
  const blob = await put(`pecas/${fileName}`, buffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType: `image/${rawExt === 'jpg' ? 'jpeg' : rawExt}`,
  });

  const url = blob.url;
  await prisma.peca.update({ where: { id: pecaId }, data: { imagemUrl: url } });
  return NextResponse.json({ url });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
