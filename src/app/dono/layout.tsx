import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AppShell from '@/components/AppShell';

export default async function DonoLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(['DONO']);
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F6FB]">
      <AppShell user={session} userName={user?.name || session.name}>{children}</AppShell>
    </div>
  );
}
