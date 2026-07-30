import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, nome } = body;
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }
  // Placeholder para integração futura (Mailchimp, etc.)
  return NextResponse.json({ inscrito: true, email });
}
