import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Marquinho Moto Pecas - Pecas e Acessorios para Motos',
  description: 'Pecas, acessorios, pneus e oleos para sua moto. Monte seu orcamento online e retire na loja.',
};

export const viewport: Viewport = { themeColor: '#2563eb', width: 'device-width', initialScale: 1 };

export default function VitrineLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F3F6FB]">{children}</div>;
}
