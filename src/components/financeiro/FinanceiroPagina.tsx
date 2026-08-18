'use client';

import { useState } from 'react';
import DashboardFinanceiro from './DashboardFinanceiro';
import FluxoCaixa from './FluxoCaixa';
import ContasReceber from './ContasReceber';
import ContasPagar from './ContasPagar';
import CentroCustos from './CentroCustos';
import Comissoes from './Comissoes';
import DRE from './DRE';
import AlertasFinanceiros from './AlertasFinanceiros';
import RelatoriosFinanceiros from './RelatoriosFinanceiros';

// BLOCO 9 — IA Financeira e Auditoria removidas da UI (menu superior) por
// decisão da loja. Os componentes (IAFInanceira, AuditoriaFinanceira) e as
// rotas continuam existindo no projeto — apenas não são mais exibidos.
type Tab = 'dashboard' | 'fluxo' | 'receber' | 'pagar' | 'custos' | 'comissoes' | 'dre' | 'relatorios' | 'alertas';

const TABS: { key: Tab; label: string; icon?: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'fluxo', label: 'Fluxo de Caixa', icon: '💵' },
  { key: 'receber', label: 'Contas a Receber', icon: '📥' },
  { key: 'pagar', label: 'Contas a Pagar', icon: '📤' },
  { key: 'custos', label: 'Centro de Custos', icon: '🏢' },
  { key: 'comissoes', label: 'Comissões', icon: '💸' },
  { key: 'dre', label: 'DRE', icon: '📈' },
  { key: 'relatorios', label: 'Relatórios', icon: '📋' },
  { key: 'alertas', label: 'Alertas', icon: '🔔' },
];

export default function FinanceiroPagina() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Financeiro Premium</h1>
            <p className="text-xs text-slate-400 mt-0.5">ERP — Gestão Financeira Completa</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                tab === t.key
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t.icon && <span className="text-sm">{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {tab === 'dashboard' && <DashboardFinanceiro />}
        {tab === 'fluxo' && <FluxoCaixa />}
        {tab === 'receber' && <ContasReceber />}
        {tab === 'pagar' && <ContasPagar />}
        {tab === 'custos' && <CentroCustos />}
        {tab === 'comissoes' && <Comissoes />}
        {tab === 'dre' && <DRE />}
        {tab === 'relatorios' && <RelatoriosFinanceiros />}
        {tab === 'alertas' && <AlertasFinanceiros />}
      </div>
    </div>
  );
}
