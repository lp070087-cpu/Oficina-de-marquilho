import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createVitrineToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rate-limit';

// POST — login ou cadastro do cliente
export async function POST(req: NextRequest) {
  // Rate limit: 10 tentativas por IP a cada 60s (cadastro + login)
  const rl = checkRateLimit(req, { key: 'cliente:auth', maxRequests: 10, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const { nome, telefone, whatsapp, email, password, cpf, dataNascimento, endereco, cidade, estado, cep, modeloMoto } = body;

    if (!telefone || !password) {
      return NextResponse.json({ error: 'Telefone e senha são obrigatórios.' }, { status: 400 });
    }

    // Verificar se já existe
    const existe = await prisma.cliente.findUnique({ where: { telefone } });

    if (existe) {
      // LOGIN
      const valid = await bcrypt.compare(password, existe.password);
      // C23 — Mensagem genérica: não revela se senha está errada (previne enumeração)
      if (!valid) {
        return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
      }

      const token = await createVitrineToken({ id: existe.id, nome: existe.nome, telefone: existe.telefone });

      // Registrar sessão
      await prisma.sessaoCliente.create({
        data: { clienteId: existe.id, token, ip: req.headers.get('x-forwarded-for') || undefined, userAgent: req.headers.get('user-agent') || undefined },
      });

      // Atualizar último login
      await prisma.cliente.update({ where: { id: existe.id }, data: { ultimoLogin: new Date() } });

      return NextResponse.json({
        token,
        cliente: {
          id: existe.id, nome: existe.nome, telefone: existe.telefone, email: existe.email,
          cpf: existe.cpf, whatsapp: existe.whatsapp, endereco: existe.endereco,
          cidade: existe.cidade, estado: existe.estado, cep: existe.cep,
          dataNascimento: existe.dataNascimento, modeloMoto: existe.modeloMoto,
          ultimoLogin: existe.ultimoLogin,
        },
      });
    }

    // C23 — Tentativa de LOGIN com telefone inexistente: retorna mensagem genérica
    // (diferenciado de cadastro pela ausência do campo 'nome')
    if (!nome) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
    }

    // CADASTRO — prossegue (nome foi informado)

    const hash = await bcrypt.hash(password, 10);
    const cliente = await prisma.cliente.create({
      data: {
        nome, telefone,
        whatsapp: whatsapp || null,
        email: email || null,
        cpf: cpf || null,
        password: hash,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        endereco: endereco || null,
        cidade: cidade || null,
        estado: estado || null,
        cep: cep || null,
        modeloMoto: modeloMoto || null,
        ultimoLogin: new Date(),
      },
    });

    const token = await createVitrineToken({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone });

    // Registrar sessão
    await prisma.sessaoCliente.create({
      data: { clienteId: cliente.id, token, ip: req.headers.get('x-forwarded-for') || undefined, userAgent: req.headers.get('user-agent') || undefined },
    });

    return NextResponse.json({
      token,
      cliente: {
        id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, email: cliente.email,
        cpf: cliente.cpf, whatsapp: cliente.whatsapp, endereco: cliente.endereco,
        cidade: cliente.cidade, estado: cliente.estado, cep: cliente.cep,
        dataNascimento: cliente.dataNascimento, modeloMoto: cliente.modeloMoto,
        ultimoLogin: cliente.ultimoLogin,
      },
    }, { status: 201 });
  } catch (e: any) {
    // C23 — Mensagem genérica para P2002 (telefone duplicado) não revela existência de conta
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Erro ao processar solicitação.' }, { status: 409 });
    }
    console.error('[cliente/auth] Erro:', e);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
