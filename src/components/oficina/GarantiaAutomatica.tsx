'use client';

import { useState, useEffect } from 'react';

interface GarantiaAutomaticaProps {
  osId: string;
  numeroOS?: string;
  garantiaDias?: number | null;
  garantiaAte?: string | null;
  dataConclusao?: string | null;
  readOnly?: boolean;
}

export default function GarantiaAutomatica({ osId, numeroOS, garantiaDias: garantiaDiasProps, garantiaAte: garantiaAteProps, dataConclusao, readOnly = false }: GarantiaAutomaticaProps) {
  const [dias, setDias] = useState(garantiaDiasProps || 90);
  const [salvando, setSalvando] = useState(false);

  const agora = new Date();
  const base = dataConclusao ? new Date(dataConclusao) : new Date();
  const garantiaAteDate = garantiaAteProps ? new Date(garantiaAteProps) : new Date(base.getTime() + dias * 24 * 60 * 60 * 1000);
  const diasRestantes = Math.max(0, Math.ceil((garantiaAteDate.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)));

  function getAlerta(): { nivel: 'critico' | 'alto' | 'medio' | 'baixo' | 'ok'; cor: string; msg: string } | null {
    if (diasRestantes <= 1) return { nivel: 'critico', cor: 'bg-red-500', msg: `Garantia expira AMANHÃ!` };
    if (diasRestantes <= 7) return { nivel: 'alto', cor: 'bg-amber-500', msg: `Garantia expira em ${diasRestantes} dias` };
    if (diasRestantes <= 15) return { nivel: 'medio', cor: 'bg-yellow-500', msg: `Garantia expira em ${diasRestantes} dias` };
    if (diasRestantes <= 30) return { nivel: 'baixo', cor: 'bg-blue-500', msg: `Garantia expira em ${diasRestantes} dias` };
    return { nivel: 'ok', cor: 'bg-emerald-500', msg: `Garantia ativa — ${diasRestantes} dias restantes` };
  }

  const alerta = getAlerta();

  async function salvarGarantia() {
    setSalvando(true);
    try {
      const garantiaAte = new Date(base.getTime() + dias * 24 * 60 * 60 * 1000).toISOString();
      await fetch(`/api/ordens/${osId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garantiaDias: dias, garantiaAte }),
      });
    } catch { /* ignore */ }
    setSalvando(false);
  }

  const OPCOES_GARANTIA = [30, 60, 90, 180, 365];

  const estaExpirada = diasRestantes <= 0;

  return (
    <div className="space-y-4">
      {/* Alerta de garantia */}
      {alerta && (
        <div className={`rounded-xl border p-4 ${alerta.nivel === 'critico' ? 'bg-red-50 border-red-300' :
          alerta.nivel === 'alto' ? 'bg-amber-50 border-amber-300' :
          alerta.nivel === 'medio' ? 'bg-yellow-50 border-yellow-200' :
          alerta.nivel === 'baixo' ? 'bg-blue-50 border-blue-200' :
          'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${alerta.cor} ${alerta.nivel === 'critico' || alerta.nivel === 'alto' ? 'animate-pulse' : ''}`} />
            <div>
              <p className={`text-sm font-bold ${alerta.nivel === 'critico' ? 'text-red-800' :
                alerta.nivel === 'alto' ? 'text-amber-800' :
                alerta.nivel === 'ok' ? 'text-emerald-800' : 'text-slate-800'
              }`}>
                {alerta.msg}
              </p>
              <p className="text-[11px] text-slate-500">
                {estaExpirada
                  ? 'Garantia expirada. Cliente deve arcar com custos de novo reparo.'
                  : `Válida até ${garantiaAteDate.toLocaleDateString('pt-BR')}`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Seletor de dias */}
      {!readOnly && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-700">Período de Garantia</p>
          <div className="flex flex-wrap gap-2">
            {OPCOES_GARANTIA.map(d => (
              <button key={d} onClick={() => setDias(d)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  dias === d ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {d} dias
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400">Dias personalizados</label>
              <input type="number" value={dias} onChange={e => setDias(Number(e.target.value))}
                className="input-field text-xs w-full mt-0.5" min={1} max={730} />
            </div>
            <button onClick={salvarGarantia} disabled={salvando}
              className="btn-primary text-xs px-4 py-2.5 mt-4">
              {salvando ? 'Salvando...' : 'Salvar Garantia'}
            </button>
          </div>
        </div>
      )}

      {/* Datas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Início</p>
          <p className="text-xs font-bold text-slate-700 mt-1">{base.toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Término</p>
          <p className={`text-xs font-bold mt-1 ${estaExpirada ? 'text-red-600' : 'text-slate-700'}`}>
            {garantiaAteDate.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className={`rounded-xl p-3 text-center ${estaExpirada ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <p className="text-[10px] text-slate-400 font-medium">Status</p>
          <p className={`text-xs font-bold mt-1 ${estaExpirada ? 'text-red-600' : 'text-emerald-600'}`}>
            {estaExpirada ? 'Expirada' : `${diasRestantes} dias`}
          </p>
        </div>
      </div>

      {/* Observações */}
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-[11px] font-bold text-slate-700 mb-2">📋 Termos da Garantia</p>
        <ul className="text-[10px] text-slate-500 space-y-1">
          <li>• Cobre defeitos de mão de obra e peças instaladas na oficina</li>
          <li>• Não cobre danos por mau uso, acidentes ou modificações posteriores</li>
          <li>• Manutenções periódicas devem ser realizadas conforme manual do fabricante</li>
          <li>• A garantia é válida a partir da data de conclusão do serviço</li>
        </ul>
      </div>
    </div>
  );
}
