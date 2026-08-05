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
    const file = formData.get('documento') as File;
    const pecaId = formData.get('pecaId') as string;
    const tipo = (formData.get('tipo') as string) || 'MANUAL';
    const nome = (formData.get('nome') as string) || file?.name || 'Documento';

    if (!file || !pecaId) {
      return NextResponse.json({ error: 'Documento e pecaId obrigatorios' }, { status: 400 });
    }

    const ALLOWED_TYPES = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
      'video/mp4', 'video/webm',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo nao suportado.' }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Maximo 50MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `doc-${pecaId}-${tipo.toLowerCase()}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'documentos');
    await mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/documentos/${fileName}`;
    const documento = await prisma.pecaDocumento.create({
      data: { pecaId, nome, tipo, url, tamanho: file.size },
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    console.error('Erro no upload de documento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const pecaId = req.nextUrl.searchParams.get('pecaId');
    if (!pecaId) return NextResponse.json({ error: 'pecaId obrigatorio' }, { status: 400 });
    const docs = await prisma.pecaDocumento.findMany({
      where: { pecaId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(docs);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });
    await prisma.pecaDocumento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
