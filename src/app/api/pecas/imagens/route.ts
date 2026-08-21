import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { put, del } from '@vercel/blob';

// Helper: verifica se a URL pertence ao Vercel Blob (só chama del() nesses casos).
function isBlobUrl(url: string): boolean {
  return typeof url === 'string' && url.includes('.public.blob.vercel-storage.com');
}

// Correção 4 (DONA, 2026-08-18): formatos permitidos SÃO APENAS PNG/JPG/JPEG/WEBP.
// GIF foi REMOVIDO. Validação por extensão + MIME + magic-bytes (não confia em MIME spoofável).
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

function validarImagem(file: File, buffer: Buffer): string | null {
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(rawExt)) {
    return 'Tipo de arquivo nao permitido. Use PNG, JPG, JPEG ou WebP.';
  }
  if (file.name.includes('/') || file.name.includes('\\') || file.name.includes('..')) {
    return 'Nome de arquivo invalido.';
  }
  const magic = buffer.subarray(0, 12);
  const isPNG  = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47;
  const isJPEG = magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF;
  const isWebP = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46
    && magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50;
  if ((rawExt === 'png' && !isPNG) || ((rawExt === 'jpg' || rawExt === 'jpeg') && !isJPEG) || (rawExt === 'webp' && !isWebP)) {
    return 'Conteudo do arquivo nao corresponde a extensao informada.';
  }
  return null;
}

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
    // Rodada Subcategorias (2026-08-21): cor ASSOCIADA a esta foto (ex.: Preto, Vermelho, Azul).
    const cor = (formData.get('cor') as string || '').trim() || null;

    if (!file || !pecaId) {
      return NextResponse.json({ error: 'Imagem e pecaId obrigatorios' }, { status: 400 });
    }

    // Correção 4: sanear pecaId (previne path traversal)
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(pecaId)) {
      return NextResponse.json({ error: 'ID de peca invalido' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Maximo 10MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const erroValidacao = validarImagem(file, buffer);
    if (erroValidacao) {
      return NextResponse.json({ error: erroValidacao }, { status: 400 });
    }

    const ext = (file.name.split('.').pop()?.toLowerCase() || 'png').replace('jpg', 'jpg');
    const fileName = `peca-${pecaId}-${tipo.toLowerCase()}-${Date.now()}.${ext}`;

    // Migração Vercel Blob (2026-08-18): upload para Blob em vez de filesystem efêmero.
    const blob = await put(`pecas/${fileName}`, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });

    const url = blob.url;

    // Determinar ordem
    const count = await prisma.pecaImagem.count({ where: { pecaId, tipo } });
    const ordem = tipo === 'PRINCIPAL' ? 0 : count + 1;

    const imagem = await prisma.pecaImagem.create({
      data: { pecaId, url, tipo, ordem, cor },
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
  try {
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
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

/**
 * Correção 4 — definir imagem principal / reordenar galeria.
 * Body: { id: string; tipo?: 'PRINCIPAL' | 'GALERIA'; ordem?: number; cor?: string | null }
 * Quando tipo = 'PRINCIPAL', a imagem se torna a capa (imagemUrl da peça) e a
 * anterior principal vira GALERIA. Não mexe em outros campos do produto.
 * Rodada Subcategorias (2026-08-21): `cor` permite alterar a cor associada à foto.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const body = await req.json();
    const { id, tipo, ordem } = body;
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

    const atual = await prisma.pecaImagem.findUnique({ where: { id } });
    if (!atual) return NextResponse.json({ error: 'Imagem nao encontrada' }, { status: 404 });

    const data: any = {};
    if (typeof ordem === 'number') data.ordem = ordem;
    // Cor por foto: atualiza SOMENTE quando o campo vier no body (null limpa, ausente preserva).
    if (body.cor !== undefined) data.cor = (typeof body.cor === 'string' && body.cor.trim()) ? body.cor.trim() : null;

    if (tipo === 'PRINCIPAL') {
      // Demove a principal anterior para GALERIA e promove a selecionada.
      await prisma.pecaImagem.updateMany({
        where: { pecaId: atual.pecaId, tipo: 'PRINCIPAL' },
        data: { tipo: 'GALERIA' },
      });
      data.tipo = 'PRINCIPAL';
      data.ordem = 0;
      await prisma.peca.update({ where: { id: atual.pecaId }, data: { imagemUrl: atual.url } });
    } else if (tipo === 'GALERIA' && atual.tipo === 'PRINCIPAL') {
      data.tipo = 'GALERIA';
    }

    const imagem = await prisma.pecaImagem.update({ where: { id }, data });
    return NextResponse.json(imagem);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

    const imagem = await prisma.pecaImagem.findUnique({ where: { id } });
    if (!imagem) return NextResponse.json({ error: 'Imagem nao encontrada' }, { status: 404 });

    // Se era a capa, promover a próxima (ordem) como principal — mantém a peça com imagem.
    const eraPrincipal = imagem.tipo === 'PRINCIPAL';
    await prisma.pecaImagem.delete({ where: { id } });

    // Migração Vercel Blob (2026-08-18): se a URL pertencer ao Blob, remover o arquivo remoto.
    // URLs antigas (/uploads/...) não pertencem ao Blob e não chamam del().
    if (isBlobUrl(imagem.url)) {
      try { await del(imagem.url); } catch (e: any) { console.error('Erro ao deletar blob:', e); }
    }

    if (eraPrincipal) {
      const proxima = await prisma.pecaImagem.findFirst({
        where: { pecaId: imagem.pecaId },
        orderBy: { ordem: 'asc' },
      });
      if (proxima) {
        await prisma.pecaImagem.update({ where: { id: proxima.id }, data: { tipo: 'PRINCIPAL', ordem: 0 } });
        await prisma.peca.update({ where: { id: imagem.pecaId }, data: { imagemUrl: proxima.url } });
      } else {
        await prisma.peca.update({ where: { id: imagem.pecaId }, data: { imagemUrl: null } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
