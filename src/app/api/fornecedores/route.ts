import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  try {
    const fornecedores = await prisma.fornecedor.findMany({ take: 200, orderBy: { nome: 'asc' } });
    return NextResponse.json(fornecedores);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    // Whitelist de campos permitidos (previne mass assignment)
    const f = await prisma.fornecedor.create({
      data: {
        nome: body.nome,
        nomeFantasia: body.nomeFantasia || null,
        vendedor: body.vendedor || null,
        telefone: body.telefone || null,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        cnpj: body.cnpj || null,
        prazoMedioEntrega: body.prazoMedioEntrega || null,
        formaPagamento: body.formaPagamento || null,
        observacoes: body.observacoes || null,
      },
    });
    return NextResponse.json(f, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
