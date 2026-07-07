import '../globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Marquinho Moto Pecas - Pecas e Acessorios para Motos',
  description: 'Pecas, acessorios, pneus e oleos para sua moto. Monte seu orcamento online e retire na loja.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Marquinho', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#2563eb', width: 'device-width', initialScale: 1 };

export default function VitrineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><meta name="mobile-web-app-capable" content="yes" /><link rel="apple-touch-icon" href="/icon-192.png" /></head>
      <body className="min-h-screen bg-[#F3F6FB]">{children}</body>
    </html>
  );
}
