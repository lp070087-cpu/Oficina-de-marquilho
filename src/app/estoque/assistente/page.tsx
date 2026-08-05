'use client';
// VERSÃO ASSISTENTE IA 2026 — ARQUITETURA MODULAR (FASE 1 — CHAT REDESIGN)

import { useEffect } from 'react';
import { useAssistenteIA } from '@/components/assistente-ia/Hooks/useAssistenteIA';
import { AssistenteHeader } from '@/components/assistente-ia/Header/AssistenteHeader';
import { VoiceSettingsPanel } from '@/components/assistente-ia/Voice/VoiceSettingsPanel';
import { ChatPanel } from '@/components/assistente-ia/Chat/ChatPanel';

export default function AssistenteIAPage() {
  const ctx = useAssistenteIA();

  // Cleanup SpeechRecognition e síntese de voz ao desmontar
  useEffect(() => {
    return () => { ctx.cleanup?.(); };
  }, [ctx.cleanup]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      <AssistenteHeader ctx={ctx} />
      <VoiceSettingsPanel ctx={ctx} />
      {/* FASE 1 — ChatPanel como interface principal */}
      <ChatPanel ctx={ctx} />
    </div>
  );
}
