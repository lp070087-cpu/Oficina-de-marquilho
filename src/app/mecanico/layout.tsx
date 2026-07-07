import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

export default async function MecanicoLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(['MECANICO']);
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true, emAlmoco: true } });
  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F6FB]">
      <AppShell user={{ ...session, emAlmoco: user?.emAlmoco || false }} userName={user?.name || session.name}>{children}</AppShell>
    </div>
  );
}
