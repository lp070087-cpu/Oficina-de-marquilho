import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createToken, roleToPath } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, perfil } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }],
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
    }

    // Check account locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return NextResponse.json({ error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.' }, { status: 401 });
    }

    // Validate perfil match
    if (perfil) {
      const profileRoleMap: Record<string, { role: string; tipoBalcao?: string }> = {
        DONO: { role: 'DONO' },
        BALCAO_SERVICOS: { role: 'BALCAO', tipoBalcao: 'SERVICOS' },
        ESTOQUE_CENTRAL: { role: 'ESTOQUE', tipoBalcao: 'ESTOQUE_CENTRAL' },
        BALCAO_VENDA: { role: 'BALCAO', tipoBalcao: 'VENDA_LOJA' },
      };
      const expected = profileRoleMap[perfil];
      if (!expected || user.role !== expected.role || (expected.tipoBalcao && user.tipoBalcao !== expected.tipoBalcao)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: { increment: 1 } },
        });
        return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
      }
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60000); // lock 30 min
      }
      await prisma.user.update({ where: { id: user.id }, data: updateData });
      return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tipoBalcao: user.tipoBalcao,
      emAlmoco: user.emAlmoco,
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: roleToPath(user.role),
      mustChangePassword: user.mustChangePassword,
      user: { id: user.id, name: user.name, role: user.role },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
