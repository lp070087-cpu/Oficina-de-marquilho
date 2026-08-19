import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, getVitrineSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { publicarPeca, precoPublico } from '@/lib/vitrine-utils';

/**
 * Correção 8 — dados internos protegidos.
 * O browser público NUNCA deve receber: precoCusto, custoMedio, estoqueMinimo,
 * quantidade (central), localizacao. Sanitiza as peças de um orçamento para o
 * cliente da Vitrine. O painel admin (DONO/BALCAO) mantém os dados completos.
 */
function sanitizarOrcamento(o: any) {
  if (!o) return o;
  return {
    ...o,
    itens: (o.itens || []).map((i: any) => ({ ...i, peca: publicarPeca(i.peca) })),
  };
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { key: 'vitrine:orcamentos', maxRequests: 5, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitos orçamentos. Aguarde um momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  const authHeader = req.headers.get('Authorization') || '';
  const session = await getVitrineSession(authHeader);
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado. Faca login na vitrine.' }, { status: 401 });
  }

  const body = await req.json();
  const { modeloMoto, observacao, itens } = body;
  if (!itens?.length) {
    return NextResponse.json({ error: 'Pelo menos uma peca e obrigatoria.' }, { status: 400 });
  }

  try {
    // Buscar todas as peças em uma única query
    const pecaIds = itens.map((i: any) => i.pecaId);
    const pecas = await prisma.peca.findMany({ where: { id: { in: pecaIds } } });
    const pecaMap = new Map(pecas.map(p => [p.id, p]));
    let total = 0;
    const itensData: any[] = [];
    for (const item of itens) {
      const peca = pecaMap.get(item.pecaId);
      if (!peca) return NextResponse.json({ error: `Peca ${item.pecaId} nao encontrada.` }, { status: 404 });
      // Preço público oficial (item 6): precoVitrine > precoOferta > precoVenda. Recalculado no servidor.
      const preco = precoPublico(peca);
      total += preco * item.quantidade;
      itensData.push({ pecaId: item.pecaId, quantidade: item.quantidade, precoUnitario: preco });
    }
    const orcamento = await prisma.orcamento.create({
      data: {
        clienteId: session.clienteId,
        modeloMoto: modeloMoto || null,
        observacao: observacao || null,
        total,
        itens: { create: itensData },
      },
      include: { itens: { include: { peca: { include: { categoria: { select: { nome: true } } } } } } },
    });
    // Correção 8: nunca enviar `cliente` completo (contém hash de senha) nem campos internos da peça.
    return NextResponse.json(sanitizarOrcamento(orcamento), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar orcamento' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Tenta cookie de admin primeiro (painel interno)
    const adminSession = await getSession();
    if (adminSession && ['DONO', 'BALCAO'].includes(adminSession.role)) {
      const orcamentos = await prisma.orcamento.findMany({
        include: { itens: { include: { peca: { include: { categoria: { select: { nome: true } } } } } }, cliente: { select: { nome: true, telefone: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json(orcamentos);
    }

    // Tenta JWT de cliente vitrine
    const authHeader = req.headers.get('Authorization') || '';
    const vitrineSession = await getVitrineSession(authHeader);
    if (!vitrineSession) {
      return NextResponse.json({ error: 'Nao autorizado. Faca login na vitrine.' }, { status: 401 });
    }
    const orcamentos = await prisma.orcamento.findMany({
      where: { clienteId: vitrineSession.clienteId },
      include: { itens: { include: { peca: { include: { categoria: { select: { nome: true } } } } } }, cliente: { select: { nome: true, telefone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    // Correção 8: sanitiza peças (remove precoCusto/custoMedio/estoqueMinimo/quantidade/localizacao).
    return NextResponse.json(orcamentos.map(sanitizarOrcamento));
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar orcamentos' }, { status: 500 });
  }
}
