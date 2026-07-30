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
  '/dono/assistente': 'Assistente Gerencial', '/dono/fornecedores': 'Fornecedores',
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
  '/estoque/importar': 'Entrada Intel. Estoque', '/estoque/assistente': 'Assistente IA',
  '/estoque/relatorios': 'Relatorios',
};

export default function Header({ userName, userRole, totalItens = 4187, maxItens = 10000, onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'Marquinho Moto Pecas';
  const isCliente = pathname.startsWith('/cliente');

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* Hamburger mobile */}
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="p-1.5 rounded-md hover:bg-slate-100 lg:hidden">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        )}
        <h1 className="text-sm font-semibold text-slate-800 truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="hidden sm:inline text-xs text-slate-400">
          <strong className="text-slate-600">{totalItens.toLocaleString('pt-BR')}</strong> / {maxItens.toLocaleString('pt-BR')} itens
        </span>
        {/* Notification Bell — apenas para usuários internos */}
        {!isCliente && <NotificationBell />}
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white text-xs font-medium">{userName.charAt(0).toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
}
