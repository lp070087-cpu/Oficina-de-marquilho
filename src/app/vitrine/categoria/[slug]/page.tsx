import Link from 'next/link';
import VitrineProdutoCard from '@/components/vitrine/ProdutoCard';

interface Peca {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number;
  quantidade: number; estoqueMinimo: number; oferta: boolean; destaque: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string };
}
interface Categoria { id: string; nome: string; slug: string; }

async function getData(slug: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const [pr, cr] = await Promise.all([fetch(`${base}/api/vitrine`,{cache:'no-store'}), fetch(`${base}/api/categorias`,{cache:'no-store'})]);
  return { pecas: (await pr.json()) as Peca[], categorias: (await cr.json()) as Categoria[], slug };
}

const categoriasMenu = [
  { label: 'Geral', slug: '' },
  { label: 'Motor', slug: 'motor' }, { label: 'Freios', slug: 'freios' }, { label: 'Eletrica', slug: 'eletrica' },
  { label: 'Suspensao', slug: 'suspensao' }, { label: 'Transmissao', slug: 'transmissao' },
  { label: 'Carroceria', slug: 'carroceria' }, { label: 'Pneus', slug: 'rodas-e-pneus' },
  { label: 'Oleos', slug: 'oleos-e-fluidos' }, { label: 'Escapamento', slug: 'escapamento' }, { label: 'Acessorios', slug: 'acessorios' },
];

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { pecas, categorias } = await getData(slug);
  const categoria = categorias.find(c => c.slug === slug);
  const pecasCategoria = pecas.filter(p => p.categoria.slug === slug);

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      {/* Header */}
      <header className="bg-[#111] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-6">
            <Link href="/vitrine" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/25"><span className="font-extrabold text-white text-sm">MP</span></div>
              <div className="hidden sm:block"><p className="font-extrabold text-sm">Marquinho</p><p className="text-[10px] text-slate-400">Moto Pecas</p></div>
            </Link>
            <div className="flex-1 max-w-2xl">
              <div className="relative"><input placeholder="O que voce busca?" className="w-full bg-white/10 border border-white/10 rounded-md py-2.5 px-4 pl-11 text-sm text-white placeholder:text-slate-400 outline-none focus:bg-white/15 transition-colors"/>
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/vitrine/login" className="flex flex-col items-center px-3 py-1.5 rounded-md hover:bg-white/5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg><span className="text-[10px] text-slate-400 mt-0.5">Entrar</span></Link>
              <Link href="/vitrine/carrinho" className="flex flex-col items-center px-3 py-1.5 rounded-md hover:bg-white/5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg><span className="text-[10px] text-slate-400 mt-0.5">Carrinho</span></Link>
            </div>
          </div>
        </div>
        <div className="bg-brand-600">
          <div className="max-w-7xl mx-auto px-4 flex items-center h-10 gap-0.5 overflow-x-auto">
            {categoriasMenu.map(c => (
              <Link key={c.slug} href={c.slug ? `/vitrine/categoria/${c.slug}` : '/vitrine'}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${c.slug === slug || (!c.slug && !slug) ? 'bg-brand-700 text-white' : 'text-white/80 hover:text-white hover:bg-brand-700'}`}
              >{c.label}</Link>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <Link href="/vitrine" className="hover:text-brand-600">Home</Link><span>/</span><span className="text-slate-600 font-medium">{categoria?.nome || slug}</span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-extrabold text-slate-800">{categoria?.nome || slug} <span className="text-slate-400 font-normal text-sm">({pecasCategoria.length} produtos)</span></h1>
        </div>

        {pecasCategoria.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center"><p className="text-sm text-slate-400">Nenhum produto nesta categoria.</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pecasCategoria.map(p => <VitrineProdutoCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      <footer className="bg-slate-900 text-slate-400 mt-10"><div className="max-w-7xl mx-auto px-4 py-8 text-center text-xs"><p>Marquinho Moto Pecas &copy; {new Date().getFullYear()}</p></div></footer>
    </div>
  );
}
