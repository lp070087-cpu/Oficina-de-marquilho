import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export async function GET() {
  const cats = await prisma.categoria.findMany({ take: 200, orderBy: { nome: 'asc' } });
  return NextResponse.json(cats);
}
