import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import CardProdutoPremium from '@/components/vitrine/CardProdutoPremium';
import GaleriaPremium from '@/components/vitrine/GaleriaPremium';
import AvaliacoesVitrine from '@/components/vitrine/AvaliacoesVitrine';
import PerguntasProduto from '@/components/vitrine/PerguntasProduto';
import FormasPagamento from '@/components/vitrine/FormasPagamento';
import FretePrazo from '@/components/vitrine/FretePrazo';
import CompartilharProduto from '@/components/vitrine/CompartilharProduto';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const peca = await prisma.peca.findUnique({ where: { id }, include: { categoria: { select: { nome: true, slug: true } } } });
  if (!peca) return { title: 'Produto não encontrado' };
  return {
    title: `${peca.nome} — Marquinho Moto Peças`,
    description: peca.descricaoCurta || peca.descricao || `Compre ${peca.nome} na Marquinho Moto Peças`,
    openGraph: peca.imagemUrl ? { images: [peca.imagemUrl] } : undefined,
    twitter: peca.imagemUrl ? { card: 'summary_large_image', images: [peca.imagemUrl] } : undefined,
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const peca = await prisma.peca.findUnique({
    where: { id },
    include: {
      categoria: { select: { nome: true, slug: true } },
      imagens: { orderBy: { ordem: 'asc' } },
      documentos: true,
      compatibilidades: true,
    },
  });

  if (!peca) {
    return (
      <div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Produto não encontrado</h1>
          <a href="/vitrine" className="text-brand-600 text-sm mt-2 inline-block">← Voltar para a vitrine</a>
        </div>
      </div>
    );
  }

  const relacionados = await prisma.peca.findMany({
    where: { ativo: true, vitrine: true, id: { not: peca.id }, categoriaId: peca.categoriaId },
    include: { categoria: { select: { nome: true, slug: true } } },
    take: 4,
  });

  const mesmaMarca = peca.marca ? await prisma.peca.findMany({
    where: { ativo: true, vitrine: true, marca: peca.marca, AND: [{ id: { not: peca.id } }, { id: { notIn: relacionados.map(r => r.id) } }] },
    include: { categoria: { select: { nome: true, slug: true } } },
    take: 4,
  }) : [];

  const oferta = peca.oferta && peca.precoOferta;
  const economia = oferta ? Number(peca.precoVenda) - Number(peca.precoOferta) : 0;
  const desconto = oferta ? Math.round((economia / Number(peca.precoVenda)) * 100) : 0;
  const precoAtual = oferta ? Number(peca.precoOferta) : Number(peca.precoVenda);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/vitrine/produto/${peca.id}`;

  // Garantia padrão
  const garantia = '3 meses de garantia contra defeitos de fabricação';

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      {/* Header */}
      <header className="bg-[#0D1117] text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/vitrine" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center"><span className="font-extrabold text-white text-xs">MP</span></div>
            <span className="hidden sm:inline font-extrabold text-sm">Marquinho</span>
          </a>
          <div className="flex items-center gap-3 text-xs">
            <a href="/vitrine/login" className="text-slate-400 hover:text-white">Entrar</a>
            <a href="/vitrine/carrinho" className="px-4 py-2 bg-brand-600 rounded-lg font-bold">Carrinho</a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
          <a href="/vitrine" className="hover:text-brand-600">Home</a>
          <span>/</span>
          <a href={`/vitrine/catalogo?categoria=${peca.categoria.slug}`} className="hover:text-brand-600">{peca.categoria.nome}</a>
          <span>/</span>
          <span className="text-slate-600 font-medium truncate">{peca.nome}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Galeria */}
          <div>
            <GaleriaPremium
              imagens={peca.imagens.map(i => ({ id: i.id, url: i.url, tipo: i.tipo }))}
              videos={peca.documentos.filter(d => d.tipo === 'VIDEO')}
              nome={peca.nome}
            />
          </div>

          {/* Detalhes + Compra */}
          <div>
            {peca.marca && <p className="text-xs text-brand-600 font-bold uppercase tracking-wider mb-2">{peca.marca}</p>}
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">{peca.nome}</h1>
            <div className="flex items-center gap-2 mb-4">
              <CompartilharProduto nome={peca.nome} url={url} />
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-[10px] text-slate-400 font-mono">{peca.codigo}</span>
            </div>

            {/* Preço */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-extrabold text-slate-800">{fm(precoAtual)}</span>
              {oferta && (
                <>
                  <span className="text-lg text-slate-400 line-through">{fm(Number(peca.precoVenda))}</span>
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-extrabold">-{desconto}%</span>
                </>
              )}
            </div>
            {oferta && <p className="text-sm text-emerald-600 font-semibold mb-1">Economize {fm(economia)}</p>}
            <p className="text-xs text-emerald-600 font-semibold mb-4">PIX {fm(precoAtual * 0.95)} (5% de desconto)</p>

            {/* Disponibilidade + Estoque */}
            <div className="flex items-center gap-2 mb-4">
              {peca.quantidade > 0 ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-700 font-medium">Em estoque · {peca.quantidade} un. central, {peca.quantidadeLoja} un. loja</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-xs text-red-700 font-medium">Indisponível</span>
                </>
              )}
            </div>

            {peca.codigoBarras && <p className="text-[10px] text-slate-400 mb-4">Código de Barras: {peca.codigoBarras}</p>}

            {/* Botão Comprar */}
            <a href={`/vitrine/carrinho`}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-extrabold transition-colors shadow-lg shadow-brand-600/25 mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg>
              {peca.quantidade > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
            </a>

            {/* Compatibilidade */}
            {peca.compatibilidades?.length > 0 && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <h3 className="text-xs font-bold text-slate-700 mb-2">🔧 Compatibilidade</h3>
                <div className="space-y-1">
                  {peca.compatibilidades.map((c, i) => (
                    <p key={i} className="text-[11px] text-slate-500">
                      {c.marca} {c.modelo} {c.anoInicial && `${c.anoInicial}`}{c.anoFinal && c.anoFinal !== c.anoInicial ? `-${c.anoFinal}` : ''}{c.motor && ` • ${c.motor}`}{c.versao && ` • ${c.versao}`}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Garantia */}
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-2">🛡️ {garantia}</p>
          </div>
        </div>

        {/* ===== TABS DE INFORMAÇÕES ===== */}
        <div className="space-y-4 mb-12">

          {/* Descrição */}
          {peca.descricao && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-extrabold text-slate-800 mb-3">📋 Descrição</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{peca.descricao}</p>
            </div>
          )}

          {/* Especificações Técnicas */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-extrabold text-slate-800 mb-3">📐 Especificações</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Marca</span>
                <span className="font-medium text-slate-700">{peca.marca || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Categoria</span>
                <span className="font-medium text-slate-700">{peca.categoria.nome}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Código</span>
                <span className="font-mono font-medium text-slate-700">{peca.codigo}</span>
              </div>
              {peca.codigoBarras && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Código de Barras</span>
                  <span className="font-mono font-medium text-slate-700">{peca.codigoBarras}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Garantia</span>
                <span className="font-medium text-slate-700">{garantia}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Disponibilidade</span>
                <span className="font-medium text-emerald-600">{peca.quantidade > 0 ? `Em estoque (${peca.quantidade} un.)` : 'Indisponível'}</span>
              </div>
            </div>
          </div>

          {/* Documentos */}
          {peca.documentos.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-extrabold text-slate-800 mb-3">📄 Documentos</h2>
              <div className="flex flex-wrap gap-2">
                {peca.documentos.map(d => (
                  <a key={d.id} href={d.url} target="_blank"
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors">
                    {d.nome}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Frete e Prazo */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <FretePrazo pecaId={peca.id} />
          </div>

          {/* Formas de Pagamento */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">💳 Formas de Pagamento</h2>
            <FormasPagamento preco={precoAtual} />
          </div>

          {/* Avaliações */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">⭐ Avaliações</h2>
            <AvaliacoesVitrine pecaId={peca.id} />
          </div>

          {/* Perguntas e Respostas */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">❓ Perguntas e Respostas</h2>
            <PerguntasProduto pecaId={peca.id} />
          </div>

        </div>

        {/* Relacionados */}
        {relacionados.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">📦 Produtos Relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relacionados.map(p => <CardProdutoPremium key={p.id} p={p as any} />)}
            </div>
          </div>
        )}

        {/* Mesma Marca */}
        {mesmaMarca.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">🏭 Produtos da mesma marca</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mesmaMarca.map(p => <CardProdutoPremium key={p.id} p={p as any} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
