'use client';

interface PecaVitrine {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number;
  quantidade: number; estoqueMinimo: number; destaque: boolean; oferta: boolean; vitrine: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string };
}

export default function AdminProdutoCard({ p, onToggle, onUpload, uploading }: {
  p: PecaVitrine;
  onToggle: (id: string, field: string, val: any) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  uploading: string;
}) {
  const preco = Number(p.precoVenda);
  const temOferta = p.oferta && p.precoOferta;
  const precoOferta = temOferta ? Number(p.precoOferta) : preco;
  const desconto = temOferta ? Math.round(((preco - precoOferta) / preco) * 100) : 0;
  const precoPix = Math.round(precoOferta * 0.9 * 100) / 100;

  return (
    <div className={`bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group flex flex-col ${p.vitrine ? 'border-slate-200' : 'border-dashed border-amber-300 bg-amber-50/30'}`}>
      {/* Imagem - menor e mais compacta */}
      <div className="relative h-40 overflow-hidden">
        {/* Selos */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5">
          {temOferta && <span className="bg-gold-500 text-[#5c3a0a] text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase">-{desconto}%</span>}
          {p.destaque && !temOferta && <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase">⭐ Destaque</span>}
        </div>

        {/* Botoes de acao */}
        <div className="absolute top-2 right-2 z-20 flex gap-0.5">
          <button onClick={() => onToggle(p.id, 'vitrine', !p.vitrine)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${p.vitrine ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-amber-700 border-amber-300'}`}>
            {p.vitrine ? '👁' : '🙈'}
          </button>
          <button onClick={() => onToggle(p.id, 'destaque', !p.destaque)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${p.destaque ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-500 border-slate-200'}`}>⭐</button>
          <button onClick={() => onToggle(p.id, 'oferta', !p.oferta)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${p.oferta ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-500 border-slate-200'}`}>🔥</button>
        </div>

        {/* Foto + upload overlay */}
        <div className="w-full h-full group-hover:scale-105 transition-transform duration-300 relative">
          {p.imagemUrl ? (
            <img src={p.imagemUrl} alt={p.nome} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${!p.vitrine ? 'bg-amber-50' : 'bg-slate-100'}`}>
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
          )}
          <label className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white text-slate-700 px-2 py-1 rounded text-[10px] font-bold shadow">{uploading===p.id?'⏳':'📷 Foto'}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e)=>onUpload(e,p.id)} disabled={uploading===p.id}/>
          </label>
        </div>
      </div>

      {/* Info compacta */}
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{p.marca || p.categoria.nome}</p>
        <h3 className="text-[11px] font-semibold text-slate-700 mb-1 line-clamp-2 leading-snug">{p.nome}</h3>
        <div className="flex items-center justify-between text-[9px] mb-2">
          <span className="text-slate-400 font-mono">{p.codigo}</span>
          <span className={p.quantidade>0?'text-brand-600 font-medium':'text-red-500'}>{p.quantidade>0?'Disp.':'Esgotado'}</span>
        </div>
        <div className="mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-sm font-extrabold text-slate-800">{precoOferta.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
            {temOferta && <span className="text-[10px] text-slate-400 line-through">{preco.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>}
          </div>
          <p className="text-[10px] text-brand-700 font-bold">{precoPix.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} no Pix</p>
        </div>
      </div>
    </div>
  );
}
