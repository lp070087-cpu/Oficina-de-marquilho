import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marquinho Moto Pecas',
  description: 'Sistema de gestao de oficina e estoque',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Marquinho', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
