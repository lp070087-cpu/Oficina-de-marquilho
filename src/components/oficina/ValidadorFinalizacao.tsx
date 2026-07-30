'use client';

import { useState, useEffect } from 'react';

interface BloqueioState {
  podeFinalizar: boolean;
  bloqueios: string[];
  totalBloqueios: number;
}

interface ValidadorFinalizacaoProps {
  osId: string;
  onFinalizar?: () => void;
}

export default function ValidadorFinalizacao({ osId, onFinalizar }: ValidadorFinalizacaoProps) {
  const [validacao, setValidacao] = useState<BloqueioState | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  async function validar() {
    setLoading(true);
    try {
      const r = await fetch(`/api/ordens/${osId}/validar-finalizacao`);
      setValidacao(await r.json());
    } catch { setValidacao(null); }
    setLoading(false);
  }

  useEffect(() => { validar(); }, [osId]);

  async function handleFinalizar() {
    if (!validacao?.podeFinalizar) return;
    setFinalizando(true);
    try {
      await fetch(`/api/ordens/${osId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PRONTA' }),
      });
      onFinalizar?.();
      validar(); // Revalidar
    } catch { /* ignore */ }
    setFinalizando(false);
  }

  if (loading && !validacao) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
          <p className="text-xs text-slate-500">Verificando requisitos...</p>
        </div>
      </div>
    );
  }

  if (!validacao) return null;

  const { podeFinalizar, bloqueios, totalBloqueios } = validacao;

  return (
    <div className="space-y-3">
      {/* Status resumido */}
      <div className={`rounded-xl border p-4 ${
        podeFinalizar ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              podeFinalizar ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {podeFinalizar ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-bold ${podeFinalizar ? 'text-emerald-800' : 'text-red-800'}`}>
                {podeFinalizar ? 'OS pode ser finalizada' : 'OS não pode ser finalizada'}
              </p>
              {!podeFinalizar && (
                <p className="text-[11px] text-red-600">
                  {totalBloqueios} {totalBloqueios === 1 ? 'pendência' : 'pendências'} a resolver
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setShowDetalhes(!showDetalhes)}
            className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold underline">
            {showDetalhes ? 'Ocultar' : 'Detalhes'}
          </button>
        </div>
      </div>

      {/* Detalhes dos bloqueios */}
      {showDetalhes && bloqueios.length > 0 && (
        <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
          <div className="bg-red-50 px-4 py-2 border-b border-red-100">
            <p className="text-xs font-bold text-red-700">Bloqueios ({totalBloqueios})</p>
          </div>
          <div className="divide-y divide-red-50">
            {bloqueios.map((bloqueio, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p className="text-xs text-red-700">{bloqueio}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requisitos checkados (quando showDetalhes e podeFinalizar) */}
      {showDetalhes && podeFinalizar && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-bold text-emerald-700 mb-2">✅ Todos os requisitos atendidos</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              <span className="text-[10px] text-emerald-700">Fotos obrigatórias registradas (Recepção, Antes, Depois)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              <span className="text-[10px] text-emerald-700">Checklist obrigatório concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              <span className="text-[10px] text-emerald-700">Assinatura do cliente coletada</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              <span className="text-[10px] text-emerald-700">Pagamento confirmado</span>
            </div>
          </div>
        </div>
      )}

      {/* Botão finalizar */}
      {podeFinalizar && (
        <button onClick={handleFinalizar} disabled={finalizando}
          className="w-full btn-primary text-sm py-3 font-bold inline-flex items-center justify-center gap-2">
          {finalizando ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Finalizando...</>
          ) : (
            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            Finalizar OS — Moto Pronta para Entrega</>
          )}
        </button>
      )}

      {/* Botão re-validar */}
      <button onClick={validar} disabled={loading}
        className="w-full text-[10px] text-slate-400 hover:text-slate-600 py-1 font-medium underline">
        {loading ? 'Verificando...' : '🔄 Re-verificar requisitos'}
      </button>
    </div>
  );
}
