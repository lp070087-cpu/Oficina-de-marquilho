'use client';

import { useState } from 'react';

interface Imagem { id: string; url: string; tipo: string; }
interface Documento { id: string; nome: string; tipo: string; url: string; }

export default function GaleriaPremium({ imagens, videos, nome }: { imagens: Imagem[]; videos?: Documento[]; nome: string }) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [imgError, setImgError] = useState(false);

  const principal = imagens.find(i => i.tipo === 'PRINCIPAL') || imagens[0];
  const displayImgs = principal ? [principal, ...imagens.filter(i => i.id !== principal.id)] : imagens;

  const current = displayImgs[selected];

  return (
    <>
      <div className="space-y-3">
        {/* Imagem principal */}
        <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden cursor-zoom-in relative"
          onClick={() => setLightbox(true)}>
          {current && !imgError ? (
            <img src={current.url} alt={nome} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={() => setImgError(false)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
          </div>
        </div>

        {/* Miniaturas */}
        {displayImgs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {displayImgs.map((img, i) => (
              <button key={img.id} onClick={() => setSelected(i)}
                className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${i === selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200 hover:border-brand-300'}`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
            {videos?.length && videos.map(v => (
              <button key={v.id} className="w-16 h-16 rounded-lg border border-slate-200 flex items-center justify-center bg-slate-800 flex-shrink-0 hover:border-brand-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && current && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <img src={current.url} alt={nome} className="max-w-full max-h-[90vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          {/* Navegação */}
          {displayImgs.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setSelected(prev => prev > 0 ? prev - 1 : displayImgs.length - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button onClick={e => { e.stopPropagation(); setSelected(prev => prev < displayImgs.length - 1 ? prev + 1 : 0); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
