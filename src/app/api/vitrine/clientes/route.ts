import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createVitrineToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { key: 'vitrine:clientes', maxRequests: 10, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const { nome, telefone, email, password, modeloMoto } = body;
    if (!nome || !telefone || !password) {
      return NextResponse.json({ error: 'Preencha nome, telefone e senha.' }, { status: 400 });
    }
    const existe = await prisma.cliente.findUnique({ where: { telefone } });
    if (existe) {
      const valid = await bcrypt.compare(password, existe.password);
      if (!valid) return NextResponse.json({ error: 'Telefone ja cadastrado. Senha incorreta.' }, { status: 401 });
      const token = await createVitrineToken({ id: existe.id, nome: existe.nome, telefone: existe.telefone });
      return NextResponse.json({ token, cliente: { id: existe.id, nome: existe.nome, telefone: existe.telefone, modeloMoto: existe.modeloMoto } });
    }
    const hash = await bcrypt.hash(password, 10);
    const cliente = await prisma.cliente.create({
      data: { nome, telefone, email: email || null, password: hash, modeloMoto: modeloMoto || null },
    });
    const token = await createVitrineToken({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone });
    return NextResponse.json({ token, cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, modeloMoto: cliente.modeloMoto } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
