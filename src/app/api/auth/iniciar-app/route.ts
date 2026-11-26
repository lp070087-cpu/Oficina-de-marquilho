import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  const destino = session?.role === 'DONO' ? '/dono' : '/?app=marquinho&login=1';
  return NextResponse.redirect(new URL(destino, request.url), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
