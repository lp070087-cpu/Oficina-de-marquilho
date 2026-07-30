import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('imagem') as File;
    const pecaId = formData.get('pecaId') as string;
    const tipo = (formData.get('tipo') as string) || 'PRINCIPAL';

    if (!file || !pecaId) {
      return NextResponse.json({ error: 'Imagem e pecaId obrigatorios' }, { status: 400 });
    }

    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo nao permitido. Use PNG, JPEG, WebP ou GIF.' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Maximo 10MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `peca-${pecaId}-${tipo.toLowerCase()}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'pecas');
    await mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/pecas/${fileName}`;

    // Determinar ordem
    const count = await prisma.pecaImagem.count({ where: { pecaId, tipo } });
    const ordem = tipo === 'PRINCIPAL' ? 0 : count + 1;

    const imagem = await prisma.pecaImagem.create({
      data: { pecaId, url, tipo, ordem },
    });

    // Se for PRINCIPAL, atualiza a imagemUrl da peça
    if (tipo === 'PRINCIPAL') {
      await prisma.peca.update({ where: { id: pecaId }, data: { imagemUrl: url } });
    }

    return NextResponse.json(imagem, { status: 201 });
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const pecaId = req.nextUrl.searchParams.get('pecaId');
  if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatorio' }, { status: 400 });
  const imagens = await prisma.pecaImagem.findMany({
    where: { pecaId },
    orderBy: { ordem: 'asc' },
  });
  return NextResponse.json(imagens);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
  await prisma.pecaImagem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
