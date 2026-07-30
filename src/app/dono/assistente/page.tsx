'use client';
// ASSISTENTE GERENCIAL — Consultas administrativas (sem funcoes operacionais)
// Scanner, cadastro, XML e importacao foram movidos para o Estoque Central

import { useEffect } from 'react';
import { useAssistenteIA } from '@/components/assistente-ia/Hooks/useAssistenteIA';
import { AssistenteHeader } from '@/components/assistente-ia/Header/AssistenteHeader';
import { VoiceSettingsPanel } from '@/components/assistente-ia/Voice/VoiceSettingsPanel';
import { DashboardPanel } from '@/components/assistente-ia/Dashboard/DashboardPanel';
import { GerentePanel } from '@/components/assistente-ia/GerenteIA/GerentePanel';

export default function AssistenteGerencialPage() {
  const ctx = useAssistenteIA();

  // Cleanup SpeechRecognition e sintese de voz ao desmontar
  useEffect(() => {
    return () => { ctx.cleanup?.(); };
  }, [ctx.cleanup]);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto relative">
      <AssistenteHeader ctx={ctx} />
      <VoiceSettingsPanel ctx={ctx} />
      <DashboardPanel ctx={ctx} />
      <GerentePanel ctx={ctx} />
    </div>
  );
}
