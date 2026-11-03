import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { podeReceber } from '@/lib/operacao-pedidos';
import { CHAVE_PARCELAMENTO, lerParcelamento, validarConfig } from '@/lib/parcelamento';

// GET: opções de parcelamento para o Caixa. PUT: somente a DONA altera.
export async function GET() {
  const s = await getSession();
  if (!podeReceber(s)) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  return NextResponse.json(await lerParcelamento());
}

export async function PUT(req: NextRequest) {
  const s = await getSession();
  if (s?.role !== 'DONO') return NextResponse.json({ error: 'Somente a administracao altera o parcelamento' }, { status: 403 });
  const config = validarConfig(await req.json().catch(() => null));
  if (!config) return NextResponse.json({ error: 'Informe de 1 a 24 parcelas' }, { status: 400 });
  await prisma.configuracaoVitrine.upsert({
    where: { chave: CHAVE_PARCELAMENTO },
    create: { chave: CHAVE_PARCELAMENTO, valor: JSON.stringify(config), descricao: 'Parcelas permitidas no cartao de credito (sem juros)' },
    update: { valor: JSON.stringify(config) },
  });
  return NextResponse.json(config);
}
