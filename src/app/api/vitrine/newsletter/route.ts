import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { key: 'vitrine:newsletter', maxRequests: 5, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  let emailInscricao: string | undefined;
  try {
    const body = await req.json();
    const { email, nome } = body;
    emailInscricao = email;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Verificar se já está inscrito
    const existe = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existe) {
      // Reativar se estava inativo
      if (!existe.ativo) {
        await prisma.newsletter.update({
          where: { email: email.toLowerCase().trim() },
          data: { ativo: true, nome: nome || existe.nome },
        });
        return NextResponse.json({ inscrito: true, email, reativado: true });
      }
      return NextResponse.json({ inscrito: true, email, jaCadastrado: true });
    }

    // Nova inscrição
    await prisma.newsletter.create({
      data: {
        email: email.toLowerCase().trim(),
        nome: nome || null,
        ativo: true,
      },
    });

    return NextResponse.json({ inscrito: true, email });
  } catch (e: any) {
    // P2002 = unique constraint violation (race condition)
    if (e?.code === 'P2002') {
      return NextResponse.json({ inscrito: true, email: emailInscricao, jaCadastrado: true });
    }
    return NextResponse.json({ error: 'Erro ao processar inscrição' }, { status: 500 });
  }
}
