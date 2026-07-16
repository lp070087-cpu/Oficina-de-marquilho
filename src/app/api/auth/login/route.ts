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
      where: { OR: [{ email }], active: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
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
        return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
      }
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Usuario, senha ou perfil invalido.' }, { status: 401 });
    }

    // Update last login (safe update only)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
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
