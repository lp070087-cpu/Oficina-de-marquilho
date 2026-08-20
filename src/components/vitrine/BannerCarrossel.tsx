'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Banner {
  id: string; titulo?: string; subtitulo?: string;
  imagemDesktop?: string; imagemMobile?: string;
  ctaTexto?: string; ctaLink?: string; ativo: boolean;
  corTexto?: string; overlay?: string; opacidade?: string; posicaoConteudo?: string;
}

export default function BannerCarrossel({ banners: propBanners }: { banners?: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [banners, setBanners] = useState<Banner[]>(propBanners || []);
  const [carregado, setCarregado] = useState(!!propBanners);

  // Item 3: quando chamado sem prop (Vitrine pública), busca do /api/vitrine/banners
  // que já retorna SÓ banners ativos dentro do período (GET público).
  useEffect(() => {
    if (propBanners && propBanners.length > 0) { setBanners(propBanners); setCarregado(true); return; }
    fetch('/api/vitrine/banners').then(r => r.json()).then((d: Banner[]) => {
      if (Array.isArray(d)) setBanners(d);
    }).catch(() => {}).finally(() => setCarregado(true));
  }, [propBanners]);

  const active = banners.filter(b => b.ativo);
  const next = useCallback(() => setCurrent(prev => (prev + 1) % (active.length || 1)), [active.length]);
  const prev = useCallback(() => setCurrent(prev => prev === 0 ? (active.length || 1) - 1 : prev - 1), [active.length]);

  useEffect(() => {
    if (active.length <= 1 || paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [active.length, paused, next]);

  if (!carregado) return <div className="aspect-[4/1] max-md:aspect-[2/1] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />;
  if (active.length === 0) return null;

  const b = active[current];
  const txtColor = b.corTexto || '#ffffff';
  const overlayStyle = b.overlay ? { backgroundColor: b.overlay, opacity: parseFloat(b.opacidade || '0.3') } : {};
  // Mobile: usa imagemMobile se existir; senão usa a Desktop como fallback (sem quebrar).
  const mobileImg = b.imagemMobile || b.imagemDesktop;

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Overlay configurável */}
      <div className="absolute inset-0 z-0" style={overlayStyle} />

      {/* Com imagem: container respeita a proporção oficial (desktop 4:1, mobile 2:1).
          object-cover num container na MESMA proporção da arte = imagem INTEIRA, sem corte. */}
      {b.imagemDesktop && (
        <>
          {/* Desktop — container 4:1 (1600×400). A arte preenche o container na MESMA
              proporção → imagem INTEIRA, sem corte. object-contain garante que mesmo
              arquivos fora da proporção apareçam completos (letterbox). */}
          <div className="relative hidden md:block w-full aspect-[4/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imagemDesktop} alt={b.titulo || 'Banner'} className="absolute inset-0 w-full h-full object-contain bg-slate-900" />
            <div className={`absolute inset-0 z-10 flex items-center px-6 lg:px-12 ${b.posicaoConteudo === 'right' ? 'justify-end text-right' : ''}`}>
              <div className="max-w-xl">
                {b.titulo && <span className="inline-block bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">{b.titulo}</span>}
                {b.subtitulo && <h1 className="text-lg md:text-xl lg:text-2xl font-extrabold mb-1 leading-tight" style={{ color: txtColor }}>{b.subtitulo}</h1>}
                {b.ctaLink && b.ctaTexto && (
                  <Link href={b.ctaLink} className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-bold text-xs transition-colors shadow-lg shadow-brand-600/30">{b.ctaTexto}</Link>
                )}
              </div>
            </div>
          </div>
          {/* Mobile (2:1) — imagemMobile oficial 600×300; fallback: Desktop sem quebrar */}
          <div className="relative md:hidden w-full aspect-[2/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mobileImg || b.imagemDesktop} alt={b.titulo || 'Banner'} className="absolute inset-0 w-full h-full object-contain bg-slate-900" />
            <div className={`absolute inset-0 z-10 flex items-center px-4 ${b.posicaoConteudo === 'right' ? 'justify-end text-right' : ''}`}>
              <div className="max-w-xs">
                {b.titulo && <span className="inline-block bg-brand-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">{b.titulo}</span>}
                {b.subtitulo && <h1 className="text-sm font-extrabold leading-tight" style={{ color: txtColor }}>{b.subtitulo}</h1>}
                {b.ctaLink && b.ctaTexto && (
                  <Link href={b.ctaLink} className="inline-flex items-center gap-2 mt-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-bold text-[11px] transition-colors">{b.ctaTexto}</Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sem imagem: hero padrão com gradiente + conteúdo completo */}
      {!b.imagemDesktop && (
        <div className="relative w-full aspect-[4/1] max-md:aspect-[2/1] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center px-6 md:px-12">
          <div className={`max-w-xl ${b.posicaoConteudo === 'right' ? 'ml-auto text-right' : ''}`}>
            {b.titulo && <span className="inline-block bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">{b.titulo}</span>}
            <h1 className="text-lg md:text-2xl lg:text-3xl font-extrabold mb-1 leading-tight" style={{ color: txtColor }}>{b.subtitulo || 'Tudo para sua moto com precos de atacado'}</h1>
            <p className="text-xs md:text-sm text-white/60 mb-3 max-w-lg">Monte seu orcamento online e retire na loja.</p>
            <div className="flex items-center gap-2 flex-wrap">
              {b.ctaLink && b.ctaTexto && (
                <Link href={b.ctaLink} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-bold text-xs transition-colors shadow-lg shadow-brand-600/30">{b.ctaTexto}</Link>
              )}
              <a href="https://wa.me/558198143879" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-md font-bold text-xs transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

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
