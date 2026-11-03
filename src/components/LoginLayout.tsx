import Image from 'next/image';
import type { ReactNode } from 'react';

// Moldura única dos logins: marca à esquerda, cartão de acesso à direita (empilhado no celular).
export default function LoginLayout({ subtitulo, children }: { subtitulo: string; children: ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] grid-cols-[minmax(0,1fr)] bg-[#F3F6FB] lg:grid-cols-2">
      <section className="relative isolate flex flex-col items-center justify-center overflow-hidden bg-[#0B1626] px-6 py-8 text-center text-white sm:py-10 lg:px-12 lg:py-16">
        {/* Acabamento discreto: brilho dourado e trama fina com as cores da oficina. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(26,86,164,0.45),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(239,176,62,0.16),transparent_55%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1 bg-gradient-to-r from-brand-600 via-gold-400 to-brand-600" />
        <Image src="/icon-512.png" alt="Marquinho Moto Peças" width={512} height={512} priority sizes="(min-width: 1024px) 300px, 112px"
          className="h-28 w-28 rounded-[1.75rem] shadow-2xl shadow-black/40 ring-1 ring-white/10 sm:h-32 sm:w-32 lg:h-[min(300px,38vh)] lg:w-[min(300px,38vh)] lg:rounded-[2.5rem]" />
        <h2 className="mt-5 max-w-md text-xl font-bold leading-tight tracking-tight sm:text-2xl lg:mt-10 lg:text-[2.1rem]">
          Sua oficina organizada.<br /><span className="text-gold-400">Seu negócio em movimento.</span>
        </h2>
        <p className="mt-3 hidden max-w-sm text-[15px] leading-relaxed text-slate-300 sm:block lg:mt-4">
          Controle de estoque, atendimento, serviços e caixa em um só lugar.
        </p>
      </section>

      <section className="flex items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:py-16">
        <div className="w-full max-w-[420px]">
          <header className="mb-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Marquinho Moto Peças</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-brand-900">{subtitulo}</h1>
          </header>
          {children}
          <p className="mt-5 text-center text-[11px] text-slate-500">Sistema de gestão de oficina e estoque</p>
        </div>
      </section>
    </main>
  );
}
