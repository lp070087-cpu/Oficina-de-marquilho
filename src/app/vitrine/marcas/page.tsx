import { Metadata } from 'next';
import MarcasVitrine from '@/components/vitrine/MarcasVitrine';
import LogoOficina from '@/components/LogoOficina';

export const metadata: Metadata = {
  title: 'Marcas — Marquinho Moto Peças',
  description: 'Confira todas as marcas disponíveis em nossa loja de peças para motos.',
};

export default function MarcasPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#0D1117] text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/vitrine" className="flex items-center gap-2.5">
            <LogoOficina className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center overflow-hidden" textClassName="font-extrabold text-white text-xs" />
            <span className="font-extrabold text-sm">Marcas</span>
          </a>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MarcasVitrine />
      </div>
    </div>
  );
}
