'use client';

import { useState } from 'react';

/**
 * Frete e Prazo — a loja opera SOMENTE com retirada na loja (o checkout tem a
 * entrega desabilitada: "Em breve"). Este bloco não inventa prazos de Correios
 * nem frete PAC/SEDEX; mostra apenas a retirada, que é a realidade do negócio.
 * Quando a entrega for implementada (integração real de transportadora), este
 * bloco ganha a consulta de CEP de verdade.
 */
export default function FretePrazo({ pecaId }: { pecaId: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
      <h4 className="text-xs font-bold text-slate-700 mb-2">🚚 Frete e Prazo</h4>
      <div className="bg-white rounded-lg p-3 border border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-slate-600">📦 Retirada na Loja</span>
          <span className="text-[11px] font-extrabold text-emerald-600">Grátis</span>
        </div>
        <p className="text-[10px] text-slate-400">Retire em até 2h após confirmação do pedido</p>
      </div>
      <div className="bg-white rounded-lg p-3 border border-slate-200 mt-2 opacity-60">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-slate-400">🚚 Entrega</span>
          <span className="text-[10px] font-bold text-slate-400">EM BREVE</span>
        </div>
        <p className="text-[10px] text-slate-400">Disponível em breve</p>
      </div>
    </div>
  );
}
