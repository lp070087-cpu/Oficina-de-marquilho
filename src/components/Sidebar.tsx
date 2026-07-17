'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  user: { name: string; role: string; email: string; tipoBalcao?: string | null; emAlmoco?: boolean };
  collapsed?: boolean;
  onToggle?: () => void;
}

const menuIcon = (d: string) => (
  <svg className="w-4 h-4 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d}/>
  </svg>
);

const donoMenu = [
  { label: 'Painel', href: '/dono', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Estoque', href: '/dono/estoque', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Ordens de Servico', href: '/dono/ordens', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Nota Fiscal', href: '/dono/notas', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'NF Manual', href: '/dono/nf-manual', d: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
  { label: 'Mecanicos', href: '/dono/mecanicos', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Funcionarios', href: '/dono/balcoes', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Assistente IA', href: '/dono/assistente', d: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5' },
  { label: 'Scanner', href: '/dono/scanner', d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  { label: 'Fornecedores', href: '/dono/fornecedores', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Importar', href: '/dono/importar', d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { label: 'Vitrine', href: '/dono/vitrine', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const balcaoServicosMenu = [
  { label: 'Painel', href: '/balcao', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Ordens de Servico', href: '/balcao/ordens', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Nota Fiscal', href: '/balcao/notas', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const balcaoVendaMenu = [
  { label: 'Painel', href: '/balcao', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Estoque da Loja', href: '/balcao/estoque', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Venda Avulsa', href: '/balcao/venda', d: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
];

const mecanicoMenu = [
  { label: 'Minhas OS', href: '/mecanico', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Consultar Estoque', href: '/mecanico/estoque', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
];

const estoqueMenu = [
  { label: 'Painel', href: '/estoque', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Estoque Central', href: '/estoque/central', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Estoque da Loja', href: '/estoque/loja', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Transferir p/ Loja', href: '/estoque/transferencia', d: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { label: 'Entrada Scanner', href: '/estoque/scanner', d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  { label: 'Entrada Intel. Estoque', href: '/estoque/importar', d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { label: 'Assistente IA', href: '/estoque/assistente', d: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5' },
  { label: 'Relatorios', href: '/estoque/relatorios', d: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [emAlmoco, setEmAlmoco] = useState(user.emAlmoco || false);
  const isDono = user.role === 'DONO';
  const isBalcao = user.role === 'BALCAO';
  const isEstoque = user.role === 'ESTOQUE';
  const tb = (user.tipoBalcao || null) as string | null;

  const menuItems = isDono
    ? donoMenu
    : isBalcao && tb === 'SERVICOS'
      ? balcaoServicosMenu
      : isBalcao && tb === 'VENDA_LOJA'
        ? balcaoVendaMenu
        : isBalcao
          ? balcaoServicosMenu // fallback
          : isEstoque
            ? estoqueMenu
            : mecanicoMenu;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  async function toggleAlmoco() {
    const method = emAlmoco ? 'DELETE' : 'POST';
    const res = await fetch('/api/auth/almoco', { method });
    if (res.ok) { const data = await res.json(); setEmAlmoco(data.emAlmoco); }
  }

  function navigate(href: string) {
    router.push(href);
    if (onToggle && window.innerWidth < 1024) onToggle();
  }

  const roleLabel = isDono
    ? 'Administrador'
    : isBalcao && tb === 'SERVICOS'
      ? 'Balcao - Servicos'
      : isBalcao && tb === 'VENDA_LOJA'
        ? 'Balcao - Venda'
        : isBalcao
          ? 'Balcao'
          : isEstoque
            ? 'Estoque Central'
            : 'Mecanico';

  const base = isDono ? '/dono' : isBalcao ? '/balcao' : isEstoque ? '/estoque' : '/mecanico';

  return (
    <>
      {!collapsed && onToggle && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onToggle} />
      )}
      <aside className={`fixed lg:relative z-40 h-screen flex-shrink-0 w-[260px] bg-[#0F1A2E] text-white flex flex-col transition-transform duration-300 ${collapsed === false ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <button onClick={onToggle} className="absolute top-3 right-3 p-1 rounded-md hover:bg-white/10 lg:hidden">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-600/25">
              <span className="text-white font-bold text-sm">MP</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">Marquinho</p>
              <p className="font-semibold text-sm leading-tight">Moto Pecas</p>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase mt-0.5">Atacado &amp; Varejo</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-0.5">
          {menuItems.map((item) => {
            const active = item.href === base ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <button key={item.href} onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${active ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {menuIcon(item.d)}
                {item.label}
              </button>
            );
          })}
          {user.role === 'MECANICO' && (
            <div className="pt-2 mt-2 border-t border-white/5">
              <button onClick={toggleAlmoco} className={`w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all ${emAlmoco ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/15' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/15'}`}>
                {emAlmoco ? 'Voltar do almoco' : 'Iniciar almoco'}
              </button>
            </div>
          )}
        </nav>

        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0"><p className="text-[12px] font-medium truncate">{user.name}</p><p className="text-[10px] text-slate-500">{roleLabel}</p></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
