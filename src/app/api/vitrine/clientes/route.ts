import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, telefone, email, password, modeloMoto } = body;
  if (!nome || !telefone || !password) {
    return NextResponse.json({ error: 'Preencha nome, telefone e senha.' }, { status: 400 });
  }
  const existe = await prisma.cliente.findUnique({ where: { telefone } });
  if (existe) {
    const valid = await bcrypt.compare(password, existe.password);
    if (!valid) return NextResponse.json({ error: 'Telefone ja cadastrado. Senha incorreta.' }, { status: 401 });
    return NextResponse.json({ token: String(existe.id), cliente: { id: existe.id, nome: existe.nome, telefone: existe.telefone, modeloMoto: existe.modeloMoto } });
  }
  const hash = await bcrypt.hash(password, 10);
  const cliente = await prisma.cliente.create({
    data: { nome, telefone, email: email || null, password: hash, modeloMoto: modeloMoto || null },
  });
  return NextResponse.json({ token: String(cliente.id), cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, modeloMoto: cliente.modeloMoto } }, { status: 201 });
}
