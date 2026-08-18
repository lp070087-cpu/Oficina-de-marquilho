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

    // ===== LOGIN (SOMENTE email + senha) =====
    if (body.identificador || body.email) {
      const idn = String(body.email || body.identificador).trim().toLowerCase();
      if (!idn || !body.password) {
        return NextResponse.json({ error: 'Informe email e senha.' }, { status: 400 });
      }
      const cliente = await prisma.cliente.findFirst({
        where: { email: { equals: idn, mode: 'insensitive' } },
      });
      if (!cliente) {
        return NextResponse.json({ error: 'Email não cadastrado.' }, { status: 401 });
      }
      const valid = await bcrypt.compare(body.password, cliente.password);
      if (!valid) return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
      const token = await createVitrineToken({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone });
      return NextResponse.json({
        token,
        cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, email: cliente.email, modeloMoto: cliente.modeloMoto },
      });
    }

    // ===== CADASTRO (nome + sobrenome → Cliente.nome) =====
    const { nome, sobrenome, telefone, email, password, modeloMoto } = body;
    const nomeCompleto = [nome, sobrenome].filter(Boolean).map((s: string) => s.trim()).join(' ');
    if (!nomeCompleto || !email || !password) {
      return NextResponse.json({ error: 'Preencha nome, sobrenome, email e senha.' }, { status: 400 });
    }
    const emailNormalizado = String(email).trim().toLowerCase();
    if (!telefone) {
      return NextResponse.json({ error: 'Preencha o telefone (contato da loja).' }, { status: 400 });
    }

    // Unicidade de email e telefone (validação em código — schema não permite migração agora)
    const existente = await prisma.cliente.findFirst({
      where: { OR: [{ email: { equals: emailNormalizado, mode: 'insensitive' } }, { telefone }] },
    });
    if (existente) {
      const emailUsado = existente.email && existente.email.toLowerCase() === emailNormalizado;
      return NextResponse.json(
        { error: emailUsado ? 'Este email já está cadastrado. Faça login.' : 'Este telefone já está cadastrado. Faça login.' },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const cliente = await prisma.cliente.create({
      data: { nome: nomeCompleto, telefone, email: emailNormalizado, password: hash, modeloMoto: modeloMoto || null },
    });
    const token = await createVitrineToken({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone });
    return NextResponse.json({
      token,
      cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, email: cliente.email, modeloMoto: cliente.modeloMoto },
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
