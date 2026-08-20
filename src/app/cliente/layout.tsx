'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LogoOficina from '@/components/LogoOficina';

const menuIcon = (d: string) => (
  <svg className="w-4 h-4 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d}/>
  </svg>
);

const MENU = [
  { label: 'Resumo', href: '/cliente', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Meus Pedidos', href: '/cliente/pedidos', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { label: 'Favoritos', href: '/cliente/favoritos', d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { label: 'Produtos Vistos', href: '/cliente/historico', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  { label: 'Garantias', href: '/cliente/garantias', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { label: 'Cupons', href: '/cliente/cupons', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { label: 'Newsletter', href: '/cliente/newsletter', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { label: 'Notificações', href: '/cliente/notificacoes', d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { label: 'Perfil', href: '/cliente/perfil', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Segurança', href: '/cliente/seguranca', d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
];

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cliente, setCliente] = useState<any>(null);
  const [notifNaoLidas, setNotifNaoLidas] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/cliente/login';

  useEffect(() => {
    if (isLoginPage) return;
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    const cd = JSON.parse(c);
    setCliente(cd);

    // Buscar notificações não lidas
    fetch('/api/cliente/notificacoes?naoLidas=1', { headers: { Authorization: `Bearer ${cd.token}` } })
      .then(r => r.json()).then(d => setNotifNaoLidas(d.totalNaoLidas || 0)).catch(() => {});
  }, [pathname, isLoginPage, router]);

  function sair() {
    sessionStorage.removeItem('marquinho-cliente');
    sessionStorage.removeItem('marquinho-cart');
    router.push('/cliente/login');
  }

  if (isLoginPage) return <>{children}</>;

  if (!cliente && !isLoginPage) {
    return (
      <div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB] flex">
      {/* Sidebar */}
      <aside className={`fixed lg:relative z-40 h-screen w-[260px] bg-[#0F1A2E] text-white flex flex-col flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Overlay mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[-1] lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <LogoOficina className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-600/25 overflow-hidden" textClassName="text-white font-bold text-sm" />
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{cliente?.nome || 'Cliente'}</p>
              <p className="text-[10px] text-slate-400">Portal do Cliente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-0.5">
          {MENU.map(item => {
            const active = pathname === item.href || (item.href !== '/cliente' && pathname.startsWith(item.href));
            return (
              <button key={item.href} onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                {menuIcon(item.d)}
                <span className="flex-1 text-left">{item.label}</span>
                {item.label === 'Notificações' && notifNaoLidas > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{notifNaoLidas}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/5 space-y-2">
          <a href="/vitrine" className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-[12px] text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            ← Voltar para Vitrine
          </a>
          <button onClick={sair} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span className="font-extrabold text-sm text-slate-700">Portal do Cliente</span>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
