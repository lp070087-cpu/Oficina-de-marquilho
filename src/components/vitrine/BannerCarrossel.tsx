'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Banner {
  id: string; titulo?: string; subtitulo?: string;
  imagemDesktop?: string; imagemMobile?: string;
  ctaTexto?: string; ctaLink?: string; ativo: boolean;
  corTexto?: string; overlay?: string; opacidade?: string; posicaoConteudo?: string;
}

export default function BannerCarrossel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = banners.filter(b => b.ativo);

  const next = useCallback(() => setCurrent(prev => (prev + 1) % (active.length || 1)), [active.length]);
  const prev = useCallback(() => setCurrent(prev => prev === 0 ? (active.length || 1) - 1 : prev - 1), [active.length]);

  useEffect(() => {
    if (active.length <= 1 || paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [active.length, paused, next]);

  if (active.length === 0) return null;

  const b = active[current];
  const txtColor = b.corTexto || '#ffffff';
  const overlayStyle = b.overlay ? { backgroundColor: b.overlay, opacity: parseFloat(b.opacidade || '0.3') } : {};

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Overlay */}
      <div className="absolute inset-0 z-0" style={overlayStyle} />
      {/* BG image */}
      {b.imagemDesktop && <img src={b.imagemDesktop} alt="" className="absolute inset-0 w-full h-full object-cover z-0 opacity-40" />}

      {/* Content */}
      <div className={`relative z-10 max-w-7xl mx-auto px-4 py-14 flex items-center gap-10 ${b.posicaoConteudo === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1">
          {b.titulo && <span className="inline-block bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-4">{b.titulo}</span>}
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 leading-tight" style={{color:txtColor}}>{b.subtitulo || 'Tudo para sua moto com precos de atacado'}</h1>
          <p className="text-base text-white/60 mb-6 max-w-lg">Monte seu orcamento online e retire na loja.</p>
          <div className="flex items-center gap-3 flex-wrap">
            {b.ctaLink && b.ctaTexto && (
              <Link href={b.ctaLink} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-extrabold text-sm transition-colors shadow-lg shadow-brand-600/30">{b.ctaTexto}</Link>
            )}
            <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-md font-bold text-sm transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
        <div className="hidden lg:block flex-shrink-0">
          <div className="w-60 h-60 rounded-full bg-gradient-to-br from-brand-600/30 to-transparent flex items-center justify-center border-4 border-white/5">
            <span className="text-6xl font-extrabold text-brand-500/40">MP</span>
          </div>
        </div>
      </div>

      {/* Arrows + dots */}
      {active.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {active.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
