'use client';
export interface VoiceSettings {
  idioma: string;
  velocidade: number;
  volume: number;
  responderPorVoz: boolean;
  sensibilidade: number;
}

export interface VozComandoRecente {
  id: string;
  comando: string;
  horario: Date;
  resultado: 'sucesso' | 'erro' | 'pendente';
  icon: string;
  intent: string;
}

export const VOICE_SETTINGS_INICIAL: VoiceSettings = {
  idioma: 'pt-BR',
  velocidade: 1.0,
  volume: 1.0,
  responderPorVoz: false,
  sensibilidade: 0.7,
};
