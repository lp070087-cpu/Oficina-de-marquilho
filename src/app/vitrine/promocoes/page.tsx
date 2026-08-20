import { Metadata } from 'next';
import PromocoesVitrine from '@/components/vitrine/PromocoesVitrine';
import LogoOficina from '@/components/LogoOficina';

export const metadata: Metadata = {
  title: 'Promoções — Marquinho Moto Peças',
  description: 'Aproveite nossas ofertas exclusivas com descontos imperdíveis em peças para motos.',
};

export default function PromocoesPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#0D1117] text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/vitrine" className="flex items-center gap-2.5">
            <LogoOficina className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center overflow-hidden" textClassName="font-extrabold text-white text-xs" />
            <span className="font-extrabold text-sm">Promoções</span>
          </a>
          <a href="/vitrine/carrinho" className="px-4 py-2 bg-brand-600 rounded-lg text-xs font-bold">Carrinho</a>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PromocoesVitrine />
      </div>
    </div>
  );
}
