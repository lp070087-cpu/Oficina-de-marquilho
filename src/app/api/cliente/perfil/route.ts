import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getVitrineSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET — dados do perfil
export async function GET(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const cliente = await prisma.cliente.findUnique({
    where: { id: session.clienteId },
    select: {
      id: true, nome: true, cpf: true, telefone: true, whatsapp: true,
      email: true, dataNascimento: true, modeloMoto: true,
      endereco: true, cidade: true, estado: true, cep: true,
      ultimoLogin: true, createdAt: true,
    },
  });

  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
  return NextResponse.json(cliente);
}

// PUT — atualizar perfil
export async function PUT(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { nome, telefone, whatsapp, email, cpf, dataNascimento, modeloMoto, endereco, cidade, estado, cep } = body;

  const data: any = {};
  if (nome !== undefined) data.nome = nome;
  if (cpf !== undefined) data.cpf = cpf;
  if (whatsapp !== undefined) data.whatsapp = whatsapp;
  if (email !== undefined) data.email = email;
  if (dataNascimento !== undefined) data.dataNascimento = dataNascimento ? new Date(dataNascimento) : null;
  if (modeloMoto !== undefined) data.modeloMoto = modeloMoto;
  if (endereco !== undefined) data.endereco = endereco;
  if (cidade !== undefined) data.cidade = cidade;
  if (estado !== undefined) data.estado = estado;
  if (cep !== undefined) data.cep = cep;

  // Se trocar telefone, verificar unicidade
  if (telefone) {
    const existe = await prisma.cliente.findUnique({ where: { telefone } });
    if (existe && existe.id !== session.clienteId) {
      return NextResponse.json({ error: 'Telefone já está em uso.' }, { status: 409 });
    }
    data.telefone = telefone;
  }

  const cliente = await prisma.cliente.update({
    where: { id: session.clienteId },
    data,
    select: {
      id: true, nome: true, cpf: true, telefone: true, whatsapp: true,
      email: true, dataNascimento: true, modeloMoto: true,
      endereco: true, cidade: true, estado: true, cep: true,
      ultimoLogin: true, createdAt: true,
    },
  });

  return NextResponse.json(cliente);
}

// PATCH — trocar senha
export async function PATCH(req: NextRequest) {
  const session = await getVitrineSession(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { senhaAtual, novaSenha } = await req.json();
  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias.' }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: session.clienteId } });
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

  const valid = await bcrypt.compare(senhaAtual, cliente.password);
  if (!valid) return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 });

  const hash = await bcrypt.hash(novaSenha, 10);
  await prisma.cliente.update({ where: { id: session.clienteId }, data: { password: hash } });

  // Invalidar outras sessões (opcional: manter apenas a atual)
  await prisma.sessaoCliente.updateMany({
    where: { clienteId: session.clienteId, token: { not: req.headers.get('Authorization')?.replace('Bearer ', '') } },
    data: { ativo: false },
  });

  return NextResponse.json({ ok: true, message: 'Senha alterada com sucesso.' });
}
