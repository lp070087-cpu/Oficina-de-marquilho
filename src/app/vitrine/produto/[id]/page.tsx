import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { VITRINE_VISIBILITY, publicarPeca, WHATSAPP_LOJA, precoPublico, rotuloAtributosAcessorio } from '@/lib/vitrine-utils';
import CardProdutoPremium from '@/components/vitrine/CardProdutoPremium';
import GaleriaPremium from '@/components/vitrine/GaleriaPremium';
import AdicionarAoCarrinho from '@/components/vitrine/AdicionarAoCarrinho';
import AvaliacoesVitrine from '@/components/vitrine/AvaliacoesVitrine';
import PerguntasProduto from '@/components/vitrine/PerguntasProduto';
import FormasPagamento from '@/components/vitrine/FormasPagamento';
import FretePrazo from '@/components/vitrine/FretePrazo';
import CompartilharProduto from '@/components/vitrine/CompartilharProduto';
import RegistrarVisualizacao from '@/components/vitrine/RegistrarVisualizacao';
import LogoOficina from '@/components/LogoOficina';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const peca = await prisma.peca.findUnique({ where: { id }, include: { categoria: { select: { nome: true, slug: true } } } });
  if (!peca) return { title: 'Produto não encontrado' };
  return {
    title: `${peca.nome} — Marquinho Moto Peças`,
    description: peca.descricaoCurta || peca.descricao || `Compre ${peca.nome} na Marquinho Moto Peças`,
    alternates: { canonical: `/vitrine/produto/${peca.id}` },
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

  // Regra oficial: página 404 se o produto não atende aos critérios de visibilidade.
  const visivel = peca && peca.ativo && peca.quantidadeLoja > 0 && Number(peca.precoVenda) > 0;

  if (!peca || !visivel) {
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
    where: { ...VITRINE_VISIBILITY, id: { not: peca.id }, categoriaId: peca.categoriaId },
    include: { categoria: { select: { nome: true, slug: true } } },
    take: 4,
  });

  const mesmaMarca = peca.marca ? await prisma.peca.findMany({
    where: { ...VITRINE_VISIBILITY, marca: peca.marca, id: { notIn: [peca.id, ...relacionados.map(r => r.id)] } },
    include: { categoria: { select: { nome: true, slug: true } } },
    take: 4,
  }) : [];

  const precoBase = Number(peca.precoVenda);
  // PREÇO PÚBLICO OFICIAL (item 6): precoVitrine (override DONA) > precoOferta > precoVenda.
  const precoAtual = precoPublico(peca);
  // Desconto exibido SEMPRE que o preço público for menor que o preço do estoque —
  // cobre tanto a oferta normal quanto o override da DONA via precoVitrine.
  const temDesconto = precoAtual > 0 && precoAtual < precoBase;
  const economia = temDesconto ? precoBase - precoAtual : 0;
  const desconto = temDesconto ? Math.round((economia / precoBase) * 100) : 0;
  const temPrecoVitrineDiferente = peca.precoVitrine != null && Number(peca.precoVitrine) !== precoBase;
  const disponivel = peca.quantidadeLoja > 0;
  const storeDomain = process.env.NEXT_PUBLIC_STORE_DOMAIN || 'vitrine.marquinhomotopecas.com';
  const baseUrl = `https://${storeDomain}`;
  const url = `${baseUrl}/vitrine/produto/${peca.id}`;
  const duvidasWhatsApp = `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre o produto ${peca.nome}.`)}`;

  // Garantia padrão
  const garantia = '3 meses de garantia contra defeitos de fabricação';

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      {/* Registra visualização/histórico (componente invisível) */}
      <RegistrarVisualizacao pecaId={peca.id} />
      {/* Header */}
      <header className="bg-[#0D1117] text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/vitrine" className="flex items-center gap-2.5">
            <LogoOficina className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center overflow-hidden" textClassName="font-extrabold text-white text-xs" />
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
              imagens={peca.imagens.map(i => ({ id: i.id, url: i.url, tipo: i.tipo, cor: i.cor || null }))}
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
            </div>

            {/* Preço */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-extrabold text-slate-800">{fm(precoAtual)}</span>
              {(temDesconto || temPrecoVitrineDiferente) && (
                <span className="text-lg text-slate-400 line-through">{fm(precoBase)}</span>
              )}
              {temDesconto && <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-extrabold">-{desconto}%</span>}
            </div>
            {temDesconto && <p className="text-sm text-emerald-600 font-semibold mb-1">Economize {fm(economia)}</p>}
            {temPrecoVitrineDiferente && !temDesconto && (
              <p className="text-xs text-brand-700 font-semibold mb-1">Preço especial da Vitrine (preço na loja: {fm(precoBase)})</p>
            )}
            {/* Disponibilidade (sem expor estoque central) */}
            <div className="flex items-center gap-2 mb-4">
              {disponivel ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-700 font-medium">Disponível para retirada na loja</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-xs text-red-700 font-medium">Indisponível no momento</span>
                </>
              )}
            </div>

            {/* Botão Comprar */}
            <div className="mb-4">
              <AdicionarAoCarrinho
                peca={publicarPeca(peca)}
                disponivel={disponivel}
              />
            </div>

            {/* Dúvidas no WhatsApp */}
            <a
              href={duvidasWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-800 font-semibold mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
              Dúvidas? Fale com a loja no WhatsApp
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

          {/* Descrição — AJUSTE 8: se vazia, texto neutro sem inventar specs */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-extrabold text-slate-800 mb-3">📋 Descrição</h2>
            {peca.descricao ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{peca.descricao}</p>
            ) : (
              <p className="text-sm text-slate-500 leading-relaxed">Consulte compatibilidade e disponibilidade para sua moto.</p>
            )}
          </div>

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
              {rotuloAtributosAcessorio(peca) && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">{peca.genero ? 'Gênero / Tamanho' : 'Tamanho'}</span>
                  <span className="font-medium text-slate-700">{rotuloAtributosAcessorio(peca)}</span>
                </div>
              )}
              {/* COR DO CAPACETE — só exibe a linha quando há cor cadastrada.
                  null/vazio → nenhuma linha (nunca exibe "Cor:" vazia). */}
              {peca.cor && peca.cor.trim() ? (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Cor</span>
                  <span className="font-medium text-slate-700">{peca.cor.trim()}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Garantia</span>
                <span className="font-medium text-slate-700">{garantia}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Disponibilidade</span>
                <span className={`font-medium ${disponivel ? 'text-emerald-600' : 'text-red-600'}`}>{disponivel ? 'Em estoque (retirada na loja)' : 'Indisponível'}</span>
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
              {relacionados.map(p => <CardProdutoPremium key={p.id} p={publicarPeca(p) as any} />)}
            </div>
          </div>
        )}

        {/* Mesma Marca */}
        {mesmaMarca.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">🏭 Produtos da mesma marca</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mesmaMarca.map(p => <CardProdutoPremium key={p.id} p={publicarPeca(p) as any} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
