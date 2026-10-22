'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import NotificationBell from '@/components/notificacoes/NotificationBell';

interface HeaderProps {
  userName: string;
  userRole?: string;
  totalItens?: number;
  maxItens?: number;
  onMenuToggle?: () => void;
}

const pageTitles: Record<string, string> = {
  '/dono': 'Painel', '/dono/estoque': 'Estoque', '/dono/categorias': 'Categorias', '/dono/ordens': 'Ordens de Servico',
  '/dono/notas': 'Nota Fiscal', '/dono/nf-manual': 'Nota Fiscal Manual',
  '/dono/mecanicos': 'Funcionarios', '/dono/balcoes': 'Balcoes', '/dono/vitrine': 'Vitrine',
  '/dono/fornecedores': 'Fornecedores',
  '/dono/pedidos-loja': 'Pedidos da Loja',
  '/dono/financeiro': 'Financeiro Premium',
  '/dono/notificacoes': 'Central de Notificações',
  '/dono/eventos': 'Eventos do Sistema',
  '/balcao': 'Painel', '/balcao/estoque': 'Estoque', '/balcao/ordens': 'Ordens de Servico',
  '/balcao/notas': 'Nota Fiscal', '/balcao/oficina': 'Oficina Premium',
  '/balcao/pdv': 'PDV', '/balcao/caixa': 'Caixa',
  '/balcao/retirada-qrcode': 'Retirada QR Code',
  '/estoque': 'Painel Estoque', '/estoque/central': 'Estoque Central', '/estoque/loja': 'Estoque da Loja',
  '/estoque/transferencia': 'Transferir p/ Loja', '/estoque/scanner': 'Entrada Scanner',
  '/estoque/importar': 'Entrada Intel. Estoque',
  '/estoque/relatorios': 'Relatorios',
};

export default function Header({ userName, userRole, totalItens, maxItens, onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'Marquinho Moto Pecas';
  const isCliente = pathname.startsWith('/cliente');
  const area = pathname.startsWith('/dono') ? 'Administração' : pathname.startsWith('/balcao') ? 'Balcão' : pathname.startsWith('/estoque') ? 'Estoque Central' : '';

  // Data calculada só no cliente (evita divergência de fuso/hidratação).
  const [hoje, setHoje] = useState('');
  useEffect(() => {
    setHoje(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
  }, []);

  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger mobile */}
        {onMenuToggle && (
          <button onClick={onMenuToggle} aria-label="Abrir menu" className="p-1.5 -ml-1 rounded-md hover:bg-slate-100 lg:hidden">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        )}
        <div className="min-w-0 flex items-center gap-2">
          {area && (
            <>
              <span className="hidden sm:inline text-[13px] text-slate-400">{area}</span>
              <svg className="hidden sm:block w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </>
          )}
          <h1 className="text-[14px] font-semibold text-slate-900 truncate tracking-tight">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        {hoje && <span className="hidden xl:inline text-xs text-slate-400 first-letter:uppercase">{hoje}</span>}
        {totalItens != null && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <strong className="text-slate-700 num">{totalItens.toLocaleString('pt-BR')}</strong> itens ativos
          </span>
        )}
        {/* Notification Bell — apenas para usuários internos */}
        {!isCliente && <NotificationBell />}
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white text-xs font-medium">{userName.charAt(0).toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
}
