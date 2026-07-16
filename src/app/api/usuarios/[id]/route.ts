import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

  const body = await req.json();
  const data: any = {};

  // Name
  if (body.name !== undefined) data.name = body.name;
  // Username
  if (body.username !== undefined) data.username = body.username || null;
  // tipoBalcao
  if (body.tipoBalcao !== undefined) data.tipoBalcao = body.tipoBalcao || null;
  // Active toggle
  if (typeof body.active === 'boolean') data.active = body.active;
  // Password
  if (body.password) data.password = await bcrypt.hash(body.password, 10);
  // mustChangePassword
  if (typeof body.mustChangePassword === 'boolean') data.mustChangePassword = body.mustChangePassword;
  // Lock/unlock
  if (body.lockedUntil !== undefined) data.lockedUntil = body.lockedUntil;
  if (typeof body.failedLoginAttempts === 'number') data.failedLoginAttempts = body.failedLoginAttempts;

  // Compatibilidade: toggle antigo vazio
  if (Object.keys(data).length === 0 && Object.keys(body).length === 0) {
    data.active = !user.active;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, username: true, role: true, active: true, tipoBalcao: true, mustChangePassword: true, lockedUntil: true },
  });
  return NextResponse.json(updated);
}
