import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_STORE_DOMAIN
    ? new URL(`https://${process.env.NEXT_PUBLIC_STORE_DOMAIN}`)
    : new URL('http://localhost:3000'),
  title: 'Marquinho Moto Pecas - Pecas e Acessorios para Motos',
  description: 'Pecas, acessorios, pneus e oleos para sua moto. Monte seu orcamento online e retire na loja.',
  alternates: { canonical: '/vitrine' },
  openGraph: {
    title: 'Marquinho Moto Pecas — Peças e Acessórios para Motos',
    description: 'Peças, acessórios, pneus e óleos para sua moto. Monte seu orçamento online e retire na loja. Atendimento rápido pelo WhatsApp.',
    siteName: 'Marquinho Moto Peças',
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#2563eb', width: 'device-width', initialScale: 1 };

export default function VitrineLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F3F6FB]">{children}</div>;
}
