import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function VitrineAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(['DONO']);
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { name: true } });
  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F6FB]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
