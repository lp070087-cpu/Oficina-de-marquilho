'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LogoOficina from '@/components/LogoOficina';

interface SidebarProps {
  user: { name: string; role: string; email: string; tipoBalcao?: string | null; emAlmoco?: boolean };
  collapsed?: boolean;
  mobileOpen?: boolean;
  isMobile?: boolean;
  onToggle?: () => void;
}

const menuIcon = (d: string) => (
  <svg className="w-4 h-4 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d}/>
  </svg>
);

// Agrupado por secao (somente rotulos visuais — rotas inalteradas).
const donoMenu = [
  { group: 'Operação', label: 'Painel', href: '/dono', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { group: 'Operação', label: 'Ordens de Servico', href: '/dono/ordens', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { group: 'Operação', label: 'Nota Fiscal', href: '/dono/notas', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { group: 'Operação', label: 'NF Manual', href: '/dono/nf-manual', d: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
  { group: 'Estoque', label: 'Estoque', href: '/dono/estoque', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { group: 'Estoque', label: 'Categorias', href: '/dono/categorias', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { group: 'Estoque', label: 'Fornecedores', href: '/dono/fornecedores', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { group: 'Loja online', label: 'Vitrine', href: '/dono/vitrine', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { group: 'Loja online', label: 'Pedidos da Loja', href: '/dono/pedidos-loja', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  // Financeiro Premium removido do menu (pagina /dono/financeiro, APIs e dados mantidos — notificacoes ainda apontam para la)
  { group: 'Gestão', label: 'Funcionarios', href: '/dono/mecanicos', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { group: 'Gestão', label: 'Balcoes', href: '/dono/balcoes', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { group: 'Sistema', label: 'Notificações', href: '/dono/notificacoes', d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', badge: true },
  { group: 'Sistema', label: 'Eventos do Sistema', href: '/dono/eventos', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const balcaoServicosMenu = [
  { label: 'Painel', href: '/balcao', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Oficina Premium', href: '/balcao/oficina', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Ordens de Servico', href: '/balcao/ordens', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Nota Fiscal', href: '/balcao/notas', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Retirada QR Code', href: '/balcao/retirada-qrcode', d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
];

const balcaoVendaMenu = [
  { label: 'Painel', href: '/balcao', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Oficina Premium', href: '/balcao/oficina', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'PDV', href: '/balcao/pdv', d: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  { label: 'Estoque da Loja', href: '/balcao/estoque', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Caixa', href: '/balcao/caixa', d: 'M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm-2 5h16v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9zm3 3a1 1 0 011-1h.01a1 1 0 110 2H6a1 1 0 01-1-1zm4 0a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4 0a1 1 0 011-1h.01a1 1 0 110 2H14a1 1 0 01-1-1z' },
  { label: 'Retirada QR Code', href: '/balcao/retirada-qrcode', d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  { label: 'Ordens de Servico', href: '/balcao/ordens', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Nota Fiscal', href: '/balcao/notas', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const estoqueMenu = [
  { label: 'Painel', href: '/estoque', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Estoque Central', href: '/estoque/central', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Estoque da Loja', href: '/estoque/loja', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Transferir p/ Loja', href: '/estoque/transferencia', d: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { label: 'Entrada Scanner', href: '/estoque/scanner', d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  { label: 'Entrada Intel. Estoque', href: '/estoque/importar', d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { label: 'Relatorios', href: '/estoque/relatorios', d: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function Sidebar({ user, collapsed, mobileOpen, isMobile, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDono = user.role === 'DONO';
  const isBalcao = user.role === 'BALCAO';
  const isEstoque = user.role === 'ESTOQUE';
  const tb = (user.tipoBalcao || null) as string | null;

  // FASE 15-J: Badge de notificações não lidas
  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    if (!isDono) return;
    fetch('/api/notificacoes/unread')
      .then(r => r.json())
      .then(d => setNotifCount(d.count || 0))
      .catch(() => {});
    const interval = setInterval(() => {
      fetch('/api/notificacoes/unread')
        .then(r => r.json())
        .then(d => setNotifCount(d.count || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [isDono]);

  // FASE 5 — Fallback seguro: role desconhecida NÃO mostra menu DONO
  const menuItems = isDono
    ? donoMenu
    : isBalcao && tb === 'SERVICOS'
      ? balcaoServicosMenu
      : isBalcao && tb === 'VENDA_LOJA'
        ? balcaoVendaMenu
        : isBalcao
          ? balcaoServicosMenu // fallback para BALCAO sem tipoBalcao definido
          : isEstoque
            ? estoqueMenu
            : []; // role desconhecida: menu vazio (seguro)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  function navigate(href: string) {
    router.push(href);
    if (onToggle && isMobile) onToggle();
  }

  // FASE 5 — Fallback seguro: role desconhecida nao assume 'Administrador'
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
            : user.role || 'Desconhecido';

  // FASE 5 — Fallback seguro: role desconhecida redireciona para raiz (login)
  const base = isDono ? '/dono' : isBalcao ? '/balcao' : isEstoque ? '/estoque' : '/';

  // AJUSTE 5 — No mobile, o drawer é controlado por mobileOpen (não pelo collapse).
  // No desktop, collapsed=true mostra apenas ícones (barra fina).
  const showOverlay = isMobile && mobileOpen;
  const menuCollapsed = isMobile ? false : !!collapsed;
  const width = menuCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]';

  return (
    <>
      {showOverlay && (
        <div className="fixed inset-0 bg-black/50 z-[90] lg:hidden" onClick={onToggle} />
      )}
      <aside className={`fixed lg:relative z-[100] h-screen flex-shrink-0 w-[260px] ${width} bg-[#0F1A2E] text-white flex flex-col transition-all duration-300 ${showOverlay ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Botão recolher/expandir (desktop) */}
        {!isMobile && onToggle && (
          <button onClick={onToggle} className="absolute top-3 right-2 p-1.5 rounded-md hover:bg-white/10 z-50 text-slate-400 hover:text-white" title={menuCollapsed ? 'Expandir menu' : 'Recolher menu'}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuCollapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />}
            </svg>
          </button>
        )}
        {/* Botão fechar (mobile) */}
        {isMobile && onToggle && (
          <button onClick={onToggle} className="absolute top-3 right-3 p-1 rounded-md hover:bg-white/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}

        <div className="px-4 py-5 border-b border-white/[0.06]">
          <div className={`flex items-center ${menuCollapsed ? 'justify-center' : 'gap-3'}`}>
            <LogoOficina className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 ring-2 ring-gold-400/30 overflow-hidden" textClassName="text-white font-bold text-sm" />
            {!menuCollapsed && (
              <div className="min-w-0">
                <p className="font-semibold text-[14px] leading-tight tracking-tight">Marquinho Moto Peças</p>
                <p className="text-[10px] text-gold-400/80 tracking-[0.14em] uppercase mt-1">Atacado &amp; Varejo</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
          {menuItems.map((item: any, idx: number) => {
            const active = item.href === base ? pathname === item.href : pathname.startsWith(item.href);
            const novoGrupo = item.group && item.group !== (menuItems[idx - 1] as any)?.group;
            return (
              <div key={item.href}>
                {novoGrupo && (menuCollapsed
                  ? idx > 0 && <div className="mx-3 my-2 border-t border-white/[0.06]" />
                  : <p className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 ${idx > 0 ? 'pt-4' : 'pt-1'}`}>{item.group}</p>)}
                <button onClick={() => navigate(item.href)}
                  title={menuCollapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={`relative w-full flex items-center gap-3 px-3 py-2 my-px rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/40 ${active ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'} ${menuCollapsed ? 'justify-center' : ''}`}>
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gold-400" />}
                  <span className={active ? 'text-gold-400' : ''}>{menuIcon(item.d)}</span>
                  {!menuCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  {!menuCollapsed && item.badge && notifCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {notifCount > 99 ? '99+' : notifCount}
                    </span>
                  )}
                  {menuCollapsed && item.badge && notifCount > 0 && (
                    <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0F1A2E]" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-white/[0.06]">
          <div className={`flex items-center mb-2 px-1 ${menuCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-white/10 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            {!menuCollapsed && <div className="min-w-0"><p className="text-[12px] font-medium truncate">{user.name}</p><p className="text-[10px] text-slate-500">{roleLabel}</p></div>}
          </div>
          <button onClick={handleLogout} title={menuCollapsed ? 'Sair' : undefined} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] transition-colors ${menuCollapsed ? '' : 'gap-2'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {!menuCollapsed && 'Sair'}
          </button>
        </div>
      </aside>
    </>
  );
}
