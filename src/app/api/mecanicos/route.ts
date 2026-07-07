import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'DONO') return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const mecs = await prisma.user.findMany({ where: { role: 'MECANICO', active: true }, select: { id: true, name: true, emAlmoco: true }, orderBy: { name: 'asc' } });
  return NextResponse.json(mecs);
}
