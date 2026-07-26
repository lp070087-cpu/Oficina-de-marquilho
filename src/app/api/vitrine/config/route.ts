import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const config = await prisma.configVitrine.findFirst();
  return NextResponse.json(config || { whatsappNumero: '', bannerTexto: null, bannerAtivo: true });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const body = await req.json();
  // Whitelist de campos permitidos (previne mass assignment)
  const data = {
    whatsappNumero: body.whatsappNumero,
    bannerTexto: body.bannerTexto ?? null,
    bannerAtivo: body.bannerAtivo,
  };
  const existente = await prisma.configVitrine.findFirst();
  let config;
  if (existente) {
    config = await prisma.configVitrine.update({ where: { id: existente.id }, data });
  } else {
    config = await prisma.configVitrine.create({ data });
  }
  return NextResponse.json(config);
}
