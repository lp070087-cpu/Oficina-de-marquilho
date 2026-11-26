import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import type { SessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import AberturaDona, { SinalizarDadosProntos } from '@/components/abertura-dona/AberturaDona';

export default async function DonoLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth(['DONO']);
  return (
    <AberturaDona>
      <Suspense fallback={null}>
        <PainelDona session={session}>{children}</PainelDona>
      </Suspense>
    </AberturaDona>
  );
}

async function PainelDona({ children, session }: { children: ReactNode; session: SessionUser }) {
  const totalPecas = await prisma.peca.count({ where: { ativo: true } });
  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F6FB]">
      <AppShell user={session} userName={session.name} totalItens={totalPecas}>
        {children}
        <SinalizarDadosProntos />
      </AppShell>
    </div>
  );
}
