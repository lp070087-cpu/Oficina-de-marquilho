import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const depoimentos = await prisma.depoimento.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
    take: 20,
  });
  return NextResponse.json(depoimentos);
}
