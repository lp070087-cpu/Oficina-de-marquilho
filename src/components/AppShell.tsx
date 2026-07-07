'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface AppShellProps {
  user: { name: string; role: string; email: string; emAlmoco?: boolean };
  userName: string;
  children: React.ReactNode;
}

export default function AppShell({ user, userName, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fecha sidebar no resize para desktop
  useEffect(() => {
    function handleResize() { if (window.innerWidth >= 1024) setSidebarOpen(false); }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Sidebar user={user} collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header userName={userName} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </>
  );
}
