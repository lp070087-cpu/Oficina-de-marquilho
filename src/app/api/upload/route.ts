import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const formData = await req.formData();
  const file = formData.get('imagem') as File;
  const pecaId = formData.get('pecaId') as string;
  if (!file || !pecaId) return NextResponse.json({ error: 'Imagem e pecaId obrigatorios' }, { status: 400 });

  // Validar tipo e tamanho do arquivo
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use PNG, JPEG ou WebP.' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `${pecaId}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const publicPath = path.join(process.cwd(), 'public', 'uploads', fileName);
  await writeFile(publicPath, buffer);

  const url = `/uploads/${fileName}`;
  await prisma.peca.update({ where: { id: pecaId }, data: { imagemUrl: url } });
  return NextResponse.json({ url });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
