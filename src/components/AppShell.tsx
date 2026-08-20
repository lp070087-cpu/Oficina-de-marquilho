'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface AppShellProps {
  user: { name: string; role: string; email: string; emAlmoco?: boolean };
  userName: string;
  totalItens?: number;
  children: React.ReactNode;
}

export default function AppShell({ user, userName, totalItens, children }: AppShellProps) {
  // AJUSTE 5 — Sidebar recolhível com persistência localStorage.
  // desktopCollapsed = menu recolhido no desktop (somente ícones).
  // mobileOpen = drawer aberto no mobile (overlay sobre o conteúdo).
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Restaura preferência salva (sidebar-collapsed=true/false).
  useEffect(() => {
    try { setDesktopCollapsed(localStorage.getItem('sidebar-collapsed') === 'true'); } catch { /* localStorage indisponivel */ }
  }, []);

  // Detecta mobile via matchMedia (sem window no render → sem hydration mismatch).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => { setIsMobile(mq.matches); if (!mq.matches) setMobileOpen(false); };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  function toggleDesktop() {
    setDesktopCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', next ? 'true' : 'false'); } catch { /* localStorage indisponivel */ }
      return next;
    });
  }

  return (
    <>
      <Sidebar
        user={user}
        collapsed={desktopCollapsed}
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onToggle={() => { if (isMobile) setMobileOpen(prev => !prev); else toggleDesktop(); }}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header userName={userName} totalItens={totalItens} onMenuToggle={() => { if (isMobile) setMobileOpen(prev => !prev); else toggleDesktop(); }} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </>
  );
}
