'use client';
// VERSÃO ASSISTENTE IA 2026 — ARQUITETURA MODULAR (FASE 13.5)
// Redirecionado para usar os mesmos componentes do estoque/assistente

import { useEffect } from 'react';
import { useAssistenteIA } from '@/components/assistente-ia/Hooks/useAssistenteIA';
import { AssistenteHeader } from '@/components/assistente-ia/Header/AssistenteHeader';
import { VoiceSettingsPanel } from '@/components/assistente-ia/Voice/VoiceSettingsPanel';
import { DashboardPanel } from '@/components/assistente-ia/Dashboard/DashboardPanel';
import { GerentePanel } from '@/components/assistente-ia/GerenteIA/GerentePanel';
import { CentralPanel } from '@/components/assistente-ia/CentralOperacional/CentralPanel';
import { CopilotoPanel } from '@/components/assistente-ia/Copiloto/CopilotoPanel';
import { AutomacaoPanel } from '@/components/assistente-ia/Automacao/AutomacaoPanel';
import { ComprasPanel } from '@/components/assistente-ia/Compras/ComprasPanel';
import { ScannerCadastroPanel } from '@/components/assistente-ia/ScannerCadastro';

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
      <DashboardPanel ctx={ctx} />
      <GerentePanel ctx={ctx} />
      <CentralPanel ctx={ctx} />
      <CopilotoPanel ctx={ctx} />
      <AutomacaoPanel ctx={ctx} />
      <ComprasPanel ctx={ctx} />
      <ScannerCadastroPanel ctx={ctx} />
    </div>
  );
}
