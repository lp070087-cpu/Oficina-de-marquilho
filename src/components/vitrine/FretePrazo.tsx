'use client';

import { useState } from 'react';

export default function FretePrazo({ pecaId }: { pecaId: string }) {
  const [cep, setCep] = useState('');
  const [consultado, setConsultado] = useState(false);

  function consultar() {
    // Preparado para integração com Correios/transportadora
    setConsultado(true);
  }

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
      <h4 className="text-xs font-bold text-slate-700 mb-2">🚚 Calcular Frete e Prazo</h4>

      {!consultado ? (
        <div className="flex gap-2">
          <input
            value={cep} onChange={e => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="00000-000"
            className="input-field text-xs flex-1 py-2"
          />
          <button onClick={consultar} disabled={cep.length < 8}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors disabled:cursor-not-allowed">
            Calcular
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-600">📦 Retirada na Loja</span>
              <span className="text-[11px] font-extrabold text-emerald-600">Grátis</span>
            </div>
            <p className="text-[10px] text-slate-400">Retire em até 2h após confirmação</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-600">🚚 PAC (Correios)</span>
              <span className="text-[11px] font-extrabold text-slate-700">A calcular</span>
            </div>
            <p className="text-[10px] text-slate-400">Prazo estimado: 5-12 dias úteis</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-600">✈️ SEDEX (Correios)</span>
              <span className="text-[11px] font-extrabold text-slate-700">A calcular</span>
            </div>
            <p className="text-[10px] text-slate-400">Prazo estimado: 2-4 dias úteis</p>
          </div>
          <button onClick={() => setConsultado(false)} className="text-[10px] text-brand-600 font-bold">Consultar outro CEP</button>
        </div>
      )}
    </div>
  );
}
