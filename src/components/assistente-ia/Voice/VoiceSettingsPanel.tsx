'use client';
import React from 'react';

export function VoiceSettingsPanel({ ctx }: { ctx: any }) {
  const { atualizarVoiceSettings, input, voiceSettings, voiceSettingsAberto } = ctx;

  return (
    <>
      {/* CONFIGURAÇÕES DE VOZ (FASE 7) */}
      {voiceSettingsAberto && (
        <div className="flex-shrink-0 border-b border-slate-200 bg-white animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="px-4 py-3"><div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Configurações de Voz
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Idioma */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">🌐 Idioma</p>
                <select value={voiceSettings.idioma} onChange={e => atualizarVoiceSettings('idioma', e.target.value)}
                  className="w-full text-[10px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand-500/20">
                  <option value="pt-BR">🇧🇷 Português (BR)</option>
                  <option value="pt-PT">🇵🇹 Português (PT)</option>
                  <option value="en-US">🇺🇸 English (US)</option>
                  <option value="es-ES">🇪🇸 Español</option>
                </select>
              </div>
              {/* Velocidade */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">⚡ Velocidade <span className="text-slate-500 font-normal">{voiceSettings.velocidade.toFixed(1)}x</span></p>
                <input type="range" min="0.5" max="2" step="0.1" value={voiceSettings.velocidade}
                  onChange={e => atualizarVoiceSettings('velocidade', parseFloat(e.target.value))}
                  className="w-full accent-brand-600 h-1.5" />
                <div className="flex justify-between text-[8px] text-slate-400 mt-0.5"><span>0.5x</span><span>2.0x</span></div>
              </div>
              {/* Volume */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">🔊 Volume <span className="text-slate-500 font-normal">{Math.round(voiceSettings.volume * 100)}%</span></p>
                <input type="range" min="0" max="1" step="0.1" value={voiceSettings.volume}
                  onChange={e => atualizarVoiceSettings('volume', parseFloat(e.target.value))}
                  className="w-full accent-brand-600 h-1.5" />
                <div className="flex justify-between text-[8px] text-slate-400 mt-0.5"><span>0%</span><span>100%</span></div>
              </div>
              {/* Responder por voz */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex flex-col justify-between">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">🗣️ Responder por voz</p>
                <button onClick={() => atualizarVoiceSettings('responderPorVoz', !voiceSettings.responderPorVoz)}
                  className={`w-full px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 border ${voiceSettings.responderPorVoz ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {voiceSettings.responderPorVoz ? '✅ Ligado' : '⭕ Desligado'}
                </button>
              </div>
              {/* Sensibilidade */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">🎙️ Sensibilidade <span className="text-slate-500 font-normal">{Math.round(voiceSettings.sensibilidade * 100)}%</span></p>
                <input type="range" min="0.3" max="1" step="0.1" value={voiceSettings.sensibilidade}
                  onChange={e => atualizarVoiceSettings('sensibilidade', parseFloat(e.target.value))}
                  className="w-full accent-brand-600 h-1.5" />
                <div className="flex justify-between text-[8px] text-slate-400 mt-0.5"><span>Baixa</span><span>Alta</span></div>
              </div>
            </div>
          </div></div>
        </div>
      )}
    </>
  );
}
