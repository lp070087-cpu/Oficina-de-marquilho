'use client';

import { useRouter, usePathname } from 'next/navigation';

const items = [
  { label: 'Painel', href: '/balcao', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Estoque', href: '/balcao/estoque', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Ordens de Servico', href: '/balcao/ordens', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Notas Fiscais', href: '/balcao/notas', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function BalcaoSidebar({ user }: { user: { name: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  async function handleLogout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); }

  return (
    <aside className="w-[200px] bg-slate-900 text-white flex flex-col h-screen flex-shrink-0">
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded flex items-center justify-center flex-shrink-0"><span className="text-white font-bold text-[11px]">M</span></div>
          <div><p className="font-semibold text-xs">Marquinho</p><p className="text-[10px] text-slate-500">Moto Pecas</p></div>
        </div>
      </div>
      <nav className="flex-1 py-1.5 overflow-y-auto">
        {items.map((item) => {
          const active = item.href === '/balcao' ? pathname === '/balcao' : pathname.startsWith(item.href);
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors ${active ? 'text-white bg-brand-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-3 py-2 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px] font-medium">{user.name.charAt(0).toUpperCase()}</span></div>
          <div className="min-w-0"><p className="text-[11px] font-medium truncate">{user.name}</p><p className="text-[10px] text-slate-500">Balcao</p></div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-[11px] text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sair
        </button>
      </div>
    </aside>
  );
}
