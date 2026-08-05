import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';

// POST — entrar na newsletter
export async function POST(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { ativo } = await req.json();

    // Atualizar preferência de newsletter no cliente
    const cliente = await prisma.cliente.update({
      where: { id: session.clienteId },
      data: {
        // Armazenamos a preferência de newsletter como metadado — como não temos campo específico,
        // usamos o email como indicador de newsletter
      },
    });

    // Verificar se já existe inscrição na Newsletter (modelo da FASE 15-H)
    const existe = await (prisma as any).newsletter?.findUnique?.({ where: { email: cliente.email } }) || null;

    if (ativo && cliente.email && !existe) {
      try {
        await (prisma as any).newsletter?.create?.({ data: { email: cliente.email, ativo: true } });
      } catch { /* já existe */ }
    } else if (!ativo && existe) {
      await (prisma as any).newsletter?.update?.({ where: { id: existe.id }, data: { ativo: false } });
    }

    return NextResponse.json({ ok: true, ativo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET — status da newsletter
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: session.clienteId }, select: { email: true } });
    let ativo = false;

    if (cliente?.email) {
      const n = await (prisma as any).newsletter?.findUnique?.({ where: { email: cliente.email } });
      ativo = n?.ativo || false;
    }

    return NextResponse.json({ ativo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
