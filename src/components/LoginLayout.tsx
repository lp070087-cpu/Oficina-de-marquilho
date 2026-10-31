import Image from 'next/image';
import type { ReactNode } from 'react';

// Moldura única dos logins: mesma logo, paleta e centralização nas duas entradas.
export default function LoginLayout({ subtitulo, children }: { subtitulo: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center bg-[#F3F6FB] p-4 sm:p-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
        <Image src="/icon-512.png" alt="" width={1024} height={1024} priority sizes="(max-width: 640px) 92vw, 760px"
          className="h-auto w-[min(92vw,88vh,760px)] opacity-[0.15] [mask-image:radial-gradient(circle_closest-side,#000_78%,transparent_92%)] [-webkit-mask-image:radial-gradient(circle_closest-side,#000_78%,transparent_92%)]" />
      </div>
      <div className="relative z-10 w-full max-w-[400px]">
        <header className="mb-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Marquinho Moto Peças</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-brand-900">{subtitulo}</h1>
        </header>
        {children}
        <p className="mt-5 text-center text-[11px] text-slate-500">Sistema de gestão de oficina e estoque</p>
      </div>
    </main>
  );
}
