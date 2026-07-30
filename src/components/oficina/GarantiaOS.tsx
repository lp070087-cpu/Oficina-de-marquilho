'use client';

import { useState } from 'react';

interface GarantiaOSProps {
  osId: string;
  garantiaDias?: number | null;
  garantiaAte?: string | null;
  dataPagamento?: string | null;
  onUpdate?: () => void;
}

const OPCOES_GARANTIA = [
  { dias: 30, label: '30 dias', desc: '1 mês' },
  { dias: 60, label: '60 dias', desc: '2 meses' },
  { dias: 90, label: '90 dias', desc: '3 meses' },
  { dias: 180, label: '180 dias', desc: '6 meses' },
  { dias: 365, label: '1 ano', desc: '12 meses' },
];

export default function GarantiaOS({ osId, garantiaDias: garantiaInicial, garantiaAte: garantiaAteInicial, onUpdate }: GarantiaOSProps) {
  const [garantiaDias, setGarantiaDias] = useState(garantiaInicial || null);
  const [garantiaAte, setGarantiaAte] = useState(garantiaAteInicial || null);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);

  async function definirGarantia(dias: number) {
    setSaving(true);
    try {
      const res = await fetch(`/api/ordens/${osId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garantiaDias: dias }),
      });
      const data = await res.json();
      if (res.ok) {
        setGarantiaDias(data.garantiaDias);
        setGarantiaAte(data.garantiaAte);
        setEditando(false);
        onUpdate?.();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function removerGarantia() {
    setSaving(true);
    try {
      const res = await fetch(`/api/ordens/${osId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garantiaDias: 0 }),
      });
      if (res.ok) {
        setGarantiaDias(null);
        setGarantiaAte(null);
        onUpdate?.();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const garantiaValida = garantiaAte ? new Date(garantiaAte) > hoje : false;
  const diasRestantes = garantiaAte
    ? Math.max(0, Math.ceil((new Date(garantiaAte).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-4">
      {garantiaDias && garantiaAte ? (
        <div className={`rounded-xl border p-4 ${garantiaValida ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${garantiaValida ? 'text-emerald-600' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span className={`text-sm font-bold ${garantiaValida ? 'text-emerald-700' : 'text-red-700'}`}>
                {garantiaValida ? 'Garantia Válida' : 'Garantia Expirada'}
              </span>
            </div>
            <button onClick={() => setEditando(!editando)} className="text-xs text-brand-600 font-semibold hover:text-brand-700">
              {editando ? 'Cancelar' : 'Alterar'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Duração</p>
              <p className="text-lg font-bold text-slate-800">{garantiaDias} dias</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Válida até</p>
              <p className="text-base font-bold text-slate-800">{new Date(garantiaAte).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">{garantiaValida ? 'Restam' : 'Expirada há'}</p>
              <p className={`text-lg font-bold ${garantiaValida ? 'text-emerald-700' : 'text-red-600'}`}>
                {diasRestantes} dias
              </p>
            </div>
          </div>

          {editando && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-700">Nova garantia:</p>
              <div className="flex flex-wrap gap-2">
                {OPCOES_GARANTIA.map(op => (
                  <button key={op.dias} onClick={() => definirGarantia(op.dias)} disabled={saving}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      garantiaDias === op.dias
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                    }`}>
                    {op.label}
                    <span className="block text-[10px] opacity-70">{op.desc}</span>
                  </button>
                ))}
              </div>
              <button onClick={removerGarantia} disabled={saving}
                className="text-xs text-red-600 font-semibold hover:text-red-700">Remover garantia</button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-1">Sem garantia definida</p>
          <p className="text-xs text-slate-400 mb-4">Defina o período de garantia do serviço</p>

          <div className="flex flex-wrap justify-center gap-2">
            {OPCOES_GARANTIA.map(op => (
              <button key={op.dias} onClick={() => definirGarantia(op.dias)} disabled={saving}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all">
                {op.label}
                <span className="block text-[10px] text-slate-400">{op.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
