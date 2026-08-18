import { Suspense } from 'react';
import VitrineHomeClient from './VitrineHomeClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marquinho Moto Peças — Peças e Acessórios para Motos',
  description: 'Peças, acessórios, pneus e óleos para sua moto. Monte seu orçamento online e retire na loja. Atendimento rápido pelo WhatsApp.',
  alternates: { canonical: '/vitrine' },
  openGraph: { title: 'Marquinho Moto Peças', description: 'Peças e acessórios para sua moto com preços de atacado.' },
};

interface Categoria { id: string; nome: string; slug: string; subcategorias?: { nome: string; slug: string }[]; }
interface Peca {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number;
  quantidadeLoja: number; destaque: boolean; oferta: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string };
}

// Remove dados internos (_estoque com custo médio/valores) do payload de categorias
// repassado à Vitrine. A API /api/categorias é compartilhada com o admin e NÃO foi alterada.
function limparCategorias(cats: any[]): Categoria[] {
  return (cats || []).map((c: any) => ({
    id: c.id,
    nome: c.nome,
    slug: c.slug,
    subcategorias: (c.subcategorias || []).map((s: any) => ({ nome: s.nome, slug: s.slug })),
  }));
}

async function getVitrineData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://marquinhomotopeças.com' : 'http://localhost:3000');
  try {
    const [pecasRes, catsRes] = await Promise.all([
      fetch(`${baseUrl}/api/vitrine`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/categorias`, { cache: 'no-store' }),
    ]);
    return {
      pecas: ((await pecasRes.json()) as Peca[]) || [],
      categorias: limparCategorias((await catsRes.json()) as any[]) || [],
    };
  } catch {
    return { pecas: [] as Peca[], categorias: [] as Categoria[] };
  }
}

export default async function VitrineHome() {
  const { pecas, categorias } = await getVitrineData();

  const vitrine = pecas;
  const destaques = vitrine.filter(p => p.destaque).slice(0, 8);
  const ofertas = vitrine.filter(p => p.oferta && p.precoOferta).slice(0, 8);
  const lancamentos = [...vitrine].slice(0, 8);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center"><div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>}>
      <VitrineHomeClient
        destaques={destaques}
        ofertas={ofertas}
        lancamentos={lancamentos}
        pecas={vitrine}
        categorias={categorias}
      />
    </Suspense>
  );
}
