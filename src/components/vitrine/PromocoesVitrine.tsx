'use client';

import { useState, useEffect } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Preço público oficial (item 6): precoVitrine > precoOferta > precoVenda.
function precoPublico(p: any): number {
  const pv = p?.precoVitrine != null ? Number(p.precoVitrine) : NaN;
  if (Number.isFinite(pv) && pv > 0) return pv;
  if (p?.precoOferta && Number(p.precoOferta) < Number(p.precoVenda)) return Number(p.precoOferta);
  return Number(p?.precoVenda) || 0;
}

export default function PromocoesVitrine() {
  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vitrine/promocoes').then(r => r.json()).then(d => { setPromocoes(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-12"><div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>;

  return (
    <div className="space-y-8">
      {promocoes.map(p => {
        const agora = new Date();
        const fim = new Date(p.dataFim);
        const diff = fim.getTime() - agora.getTime();
        const dias = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        const horas = Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));

        return (
          <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`p-6 ${p.destaque ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-slate-50'}`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className={`text-xl font-extrabold ${p.destaque ? 'text-white' : 'text-slate-800'}`}>{p.titulo}</h2>
                  {p.subtitulo && <p className={`text-sm mt-1 ${p.destaque ? 'text-white/70' : 'text-slate-500'}`}>{p.subtitulo}</p>}
                </div>
                <div className={`px-4 py-2 rounded-lg text-center min-w-[90px] ${p.destaque ? 'bg-white/20 text-white' : 'bg-brand-600 text-white'}`}>
                  <p className="text-[10px] font-bold uppercase">Termina em</p>
                  <p className="text-lg font-extrabold">{dias > 0 ? `${dias}d` : `${horas}h`}</p>
                </div>
              </div>
              {p.percentual && (
                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-extrabold ${p.destaque ? 'bg-white/30 text-white' : 'bg-red-100 text-red-700'}`}>
                  Até {Number(p.percentual)}% OFF
                </span>
              )}
            </div>

            {p.produtos?.length > 0 && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {p.produtos.map((pp: any) => (
                  <a key={pp.id} href={`/vitrine/produto/${pp.peca.id}`} className="group">
                    <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-2">
                      {pp.peca.imagemUrl ? <img src={pp.peca.imagemUrl} alt={pp.peca.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16"/></svg></div>}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 line-clamp-1">{pp.peca.nome}</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xs font-extrabold text-slate-800">{fm(precoPublico(pp.peca))}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {promocoes.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Nenhuma promoção ativa no momento.</p>}
    </div>
  );
}
