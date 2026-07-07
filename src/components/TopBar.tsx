'use client';

import { useRouter, usePathname } from 'next/navigation';

const donoTabs = [
  { label: 'Painel', href: '/dono' },
  { label: 'Estoque', href: '/dono/estoque' },
  { label: 'Ordens', href: '/dono/ordens' },
  { label: 'Mecanicos', href: '/dono/mecanicos' },
  { label: 'Notas', href: '/dono/notas' },
  { label: 'Balcoes', href: '/dono/balcoes' },
  { label: 'Vitrine', href: '/dono/vitrine' },
  { label: 'Importar', href: '/dono/importar' },
];

const balcaoTabs = [
  { label: 'Painel', href: '/balcao' },
  { label: 'Estoque', href: '/balcao/estoque' },
  { label: 'Ordens', href: '/balcao/ordens' },
  { label: 'Notas', href: '/balcao/notas' },
];

export default function TopBar({ userName }: { userName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDono = pathname.startsWith('/dono');
  const tabs = isDono ? donoTabs : balcaoTabs;

  return (
    <header className="bg-white border-b border-slate-200 flex-shrink-0">
      <div className="flex items-center justify-between px-5 h-12">
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => {
            const active = tab.href === (isDono ? '/dono' : '/balcao')
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{userName}</span>
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-medium">{userName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
