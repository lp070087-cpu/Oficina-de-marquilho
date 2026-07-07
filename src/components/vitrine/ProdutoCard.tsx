'use client';

interface PecaVitrine {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number;
  quantidade: number; estoqueMinimo: number; destaque: boolean; oferta: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string };
}

const catColors: Record<string, string> = {
  motor: 'from-slate-700 to-slate-600', freios: 'from-rose-700 to-rose-600',
  eletrica: 'from-amber-600 to-amber-500', suspensao: 'from-indigo-600 to-indigo-500',
  transmissao: 'from-slate-600 to-slate-500', carroceria: 'from-sky-600 to-sky-500',
  'rodas-e-pneus': 'from-slate-700 to-slate-600', 'oleos-e-fluidos': 'from-teal-700 to-teal-600',
  escapamento: 'from-slate-600 to-slate-500', acessorios: 'from-brand-600 to-brand-500',
  filtros: 'from-cyan-700 to-cyan-600', 'cabos-e-comandos': 'from-slate-600 to-slate-500',
};

export default function VitrineProdutoCard({ p }: { p: PecaVitrine }) {
  const preco = Number(p.precoVenda);
  const temOferta = p.oferta && p.precoOferta;
  const precoOferta = temOferta ? Number(p.precoOferta) : preco;
  const desconto = temOferta ? Math.round(((preco - precoOferta) / preco) * 100) : 0;
  const precoPix = Math.round(precoOferta * 0.9 * 100) / 100;
  const economia = temOferta ? Math.round((preco - precoOferta) * 100) / 100 : 0;
  const isEsgotado = p.quantidade <= 0;
  const bg = catColors[p.categoria.slug] || catColors.acessorios;

  function handleAdd() {
    const c = sessionStorage.getItem('marquinho-cart');
    const cart = c ? JSON.parse(c) : [];
    const idx = cart.findIndex((i: any) => i.peca.id === p.id);
    if (idx >= 0) cart[idx].quantidade += 1;
    else cart.push({ peca: p, quantidade: 1 });
    sessionStorage.setItem('marquinho-cart', JSON.stringify(cart));
    window.location.href = '/vitrine/carrinho';
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 group flex flex-col">
      {/* Foto do produto */}
      <div className="relative h-44 overflow-hidden">
        {/* Badges */}
        {temOferta && (
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-0.5">
            <span className="bg-gold-500 text-[#5c3a0a] text-[9px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide">-{desconto}% OFF</span>
          </div>
        )}
        {p.destaque && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-brand-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide">Destaque</span>
          </div>
        )}

        {/* Imagem com zoom */}
        <div className="w-full h-full group-hover:scale-105 transition-transform duration-500">
          {p.imagemUrl ? (
            <img src={p.imagemUrl} alt={p.nome} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-b ${bg} flex items-center justify-center`}>
              <svg className="w-12 h-12 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">{p.marca || p.categoria.nome}</p>
        <h3 className="text-xs font-semibold text-slate-800 mb-1 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">{p.nome}</h3>

        <div className="flex items-center justify-between text-[10px] mb-2">
          <span className="text-slate-400 font-mono">{p.codigo}</span>
          <span className={isEsgotado ? 'text-red-500 font-medium' : p.quantidade <= p.estoqueMinimo ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
            {isEsgotado ? 'Esgotado' : p.quantidade <= p.estoqueMinimo ? 'Poucas un.' : 'Disponivel'}
          </span>
        </div>

        {p.compatibilidade && <p className="text-[10px] text-slate-400 truncate mb-2">Comp.: {p.compatibilidade}</p>}

        {/* Preços */}
        <div className="mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-base font-extrabold text-slate-900">{precoOferta.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}</span>
            {temOferta && <span className="text-[10px] text-slate-400 line-through">{preco.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}</span>}
          </div>
          <p className="text-[10px] text-brand-700 font-bold mb-0.5">{precoPix.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})} no Pix</p>
          {economia > 0 && <p className="text-[10px] text-emerald-600 font-semibold mb-2">Economia de {economia.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}</p>}
          <button onClick={handleAdd} disabled={isEsgotado}
            className={`w-full py-2 rounded text-[11px] font-extrabold uppercase tracking-wider transition-all ${isEsgotado ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'}`}>
            {isEsgotado ? 'Indisponivel' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  );
}
