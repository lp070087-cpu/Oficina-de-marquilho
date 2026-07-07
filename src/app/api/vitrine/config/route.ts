import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const config = await prisma.configVitrine.findFirst();
  return NextResponse.json(config || { whatsappNumero: '', bannerTexto: null, bannerAtivo: true });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const existente = await prisma.configVitrine.findFirst();
  let config;
  if (existente) {
    config = await prisma.configVitrine.update({ where: { id: existente.id }, data: body });
  } else {
    config = await prisma.configVitrine.create({ data: body });
  }
  return NextResponse.json(config);
}
