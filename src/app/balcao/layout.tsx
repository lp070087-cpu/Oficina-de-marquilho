import Link from 'next/link';
import { atendimentoDemo } from '@/lib/atendimento-demo';
import { demoPerfil } from '@/lib/atendimento-demo-perfil';
import DemoShell from '@/components/atendimento/DemoShell';
import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import EntradaBalcao from '@/components/atendimento/EntradaBalcao';

export default async function BalcaoLayout({ children }: { children: React.ReactNode }) {
  if (atendimentoDemo()) return <DemoShell perfil={await demoPerfil()}>{children}</DemoShell>;
  const session = await requireAuth(['BALCAO', 'DONO']);
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F6FB]">
      <AppShell user={session} userName={user?.name || session.name}>
        {session.role === 'DONO' && <div className="px-6 pt-5"><Link href="/dono" className="inline-flex rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white">Ir para Painel da DONA</Link></div>}<EntradaBalcao tipo={session.tipoBalcao} />
        <Suspense fallback={null}>{children}</Suspense>
      </AppShell>
    </div>
  );
}
