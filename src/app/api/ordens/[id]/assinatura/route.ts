import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/ordens/[id]/assinatura — Obter assinatura da OS
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { id } = await params;
  const assinatura = await prisma.assinaturaOS.findUnique({
    where: { ordemServicoId: id },
  });

  if (!assinatura) return NextResponse.json(null);
  return NextResponse.json(assinatura);
}

// POST /api/ordens/[id]/assinatura — Salvar assinatura digital
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.nome || !body.assinatura) {
      return NextResponse.json({ error: 'Nome e assinatura (base64) sao obrigatorios' }, { status: 400 });
    }

    // Obter IP do request
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Upsert — substitui se ja existir
    const assinatura = await prisma.assinaturaOS.upsert({
      where: { ordemServicoId: id },
      create: {
        ordemServicoId: id,
        nome: body.nome,
        assinatura: body.assinatura,
        ip,
      },
      update: {
        nome: body.nome,
        assinatura: body.assinatura,
        ip,
        data: new Date(),
      },
    });

    await prisma.historicoOS.create({
      data: {
        ordemServicoId: id,
        tipo: 'ENTREGA',
        descricao: `Assinatura registrada por ${body.nome} (IP: ${ip})`,
        usuario: session.name,
        usuarioId: session.id,
      },
    });

    return NextResponse.json(assinatura, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar assinatura:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
