import type { Metadata } from 'next';

export const atendimentoMetadata: Metadata = {
  title: 'Marquinho — Atendimento',
  description: 'Acesso dos atendentes da Marquinho Moto Peças',
  manifest: '/manifest-atendimento.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Marquinho — Atendimento',
    statusBarStyle: 'black-translucent',
  },
};
