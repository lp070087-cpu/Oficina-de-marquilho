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
// Categoria vinda do endpoint 100% data-driven /api/vitrine/categorias (item 1).
// Já vem filtrada: só categorias com produtos visíveis (ativo && quantidadeLoja>0 && precoVenda>0),
// com totalProdutos e ordenadas por prioridade (CAPACETES → CAPAS → ACESSÓRIOS → alfabética).
interface CategoriaVitrine { id: string; nome: string; slug: string; icone?: string; totalProdutos: number; subcategorias: { nome: string; slug: string }[]; }
interface Peca {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number; precoVitrine?: number;
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
    const [pecasRes, catsRes, catsVitrineRes] = await Promise.all([
      fetch(`${baseUrl}/api/vitrine`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/categorias`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/vitrine/categorias`, { cache: 'no-store' }),
    ]);
    const catsVitrine = await catsVitrineRes.json().catch(() => []);
    return {
      pecas: ((await pecasRes.json()) as Peca[]) || [],
      categorias: limparCategorias((await catsRes.json()) as any[]) || [],
      categoriasVitrine: (Array.isArray(catsVitrine) ? catsVitrine : []) as CategoriaVitrine[],
    };
  } catch {
    return { pecas: [] as Peca[], categorias: [] as Categoria[], categoriasVitrine: [] as CategoriaVitrine[] };
  }
}

export default async function VitrineHome() {
  const { pecas, categorias, categoriasVitrine } = await getVitrineData();

  const vitrine = pecas;
  const destaques = vitrine.filter(p => p.destaque).slice(0, 8);
  // Oferta legada exibida na seção "Ofertas". Itens com preço exclusivo da Vitrine (precoVitrine)
  // não exibem o badge de oferta (o override prevalece) — por isso ficam de fora desta seção.
  const ofertas = vitrine.filter(p => p.oferta && p.precoOferta && p.precoVitrine == null).slice(0, 8);
  const lancamentos = [...vitrine].slice(0, 8);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center"><div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"/></div>}>
      <VitrineHomeClient
        destaques={destaques}
        ofertas={ofertas}
        lancamentos={lancamentos}
        pecas={vitrine}
        categorias={categorias}
        categoriasVitrine={categoriasVitrine}
      />
    </Suspense>
  );
}
