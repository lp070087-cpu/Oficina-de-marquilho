import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Logo da oficina — reutiliza ConfiguracaoVitrine (chave/valor), SEM migration.
// GET é público (Vitrine, cliente e painel usam o mesmo componente LogoOficina).
// PUT é exclusivo da DONA.
const CHAVE_LOGO = 'logoOficina';

function extrairLogo(valor: string | null | undefined): string | null {
  if (!valor) return null;
  // Valores gravados via JSON.stringify — URL vira string JSON válida.
  try {
    const v = JSON.parse(valor);
    if (typeof v === 'string' && v.trim()) return v.trim();
  } catch {
    // Valor legado gravado como texto puro.
  }
  if (valor.trim()) return valor.trim();
  return null;
}

export async function GET() {
  try {
    const config = await prisma.configuracaoVitrine.findUnique({ where: { chave: CHAVE_LOGO } });
    return NextResponse.json({ logoUrl: config ? extrairLogo(config.valor) : null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const logoUrl = typeof body.logoUrl === 'string' && body.logoUrl.trim() ? body.logoUrl.trim() : '';
    const config = await prisma.configuracaoVitrine.upsert({
      where: { chave: CHAVE_LOGO },
      update: { valor: JSON.stringify(logoUrl) },
      create: { chave: CHAVE_LOGO, valor: JSON.stringify(logoUrl), descricao: 'Logo da oficina (URL pública)' },
    });
    return NextResponse.json({ ok: true, logoUrl: extrairLogo(config.valor) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
