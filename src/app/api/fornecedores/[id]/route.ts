import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  if (!body.nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  const existing = await prisma.fornecedor.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
  // Whitelist de campos permitidos (previne mass assignment)
  const f = await prisma.fornecedor.update({
    where: { id },
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
      ativo: body.ativo,
    },
  });
  return NextResponse.json(f);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO'].includes(session.role)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const { id } = await params;
  // Soft delete
  await prisma.fornecedor.update({ where: { id }, data: { ativo: false } });
  return NextResponse.json({ ok: true });
}
