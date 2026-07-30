import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — obter configuração SEO
export async function GET(req: NextRequest) {
  try {
    const chave = req.nextUrl.searchParams.get('chave');
    if (chave) {
      const config = await prisma.configuracaoVitrine.findUnique({ where: { chave } });
      return NextResponse.json(config ? { chave: config.chave, valor: JSON.parse(config.valor) } : null);
    }
    const todas = await prisma.configuracaoVitrine.findMany();
    const resultado: Record<string, any> = {};
    for (const c of todas) {
      try { resultado[c.chave] = JSON.parse(c.valor); } catch { resultado[c.chave] = c.valor; }
    }
    return NextResponse.json(resultado);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — salvar configuração SEO
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const data = await req.json();
    const results = [];
    for (const [chave, valor] of Object.entries(data)) {
      const config = await prisma.configuracaoVitrine.upsert({
        where: { chave },
        update: { valor: JSON.stringify(valor) },
        create: { chave, valor: JSON.stringify(valor), descricao: `Config: ${chave}` },
      });
      results.push(config);
    }
    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
