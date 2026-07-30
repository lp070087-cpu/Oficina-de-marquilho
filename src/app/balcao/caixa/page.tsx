'use client';

import CaixaPDV from '@/components/pdv/CaixaPDV';

export default function BalcaoCaixaPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Caixa</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Gestao de caixa e sessoes</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Caixa → Sessao → Operador
        </div>
      </div>
      <CaixaPDV />
    </div>
  );
}
