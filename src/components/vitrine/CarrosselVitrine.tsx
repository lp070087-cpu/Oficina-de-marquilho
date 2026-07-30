'use client';

import { useState, useEffect } from 'react';

export default function CarrosselVitrine() {
  const [current, setCurrent] = useState(0);
  const slides = [
    { titulo: 'Tudo para sua Moto', subtitulo: 'Peças, acessórios, pneus e óleos com preços de atacado', cta: 'Ver Produtos', link: '/vitrine/catalogo', cor: 'from-brand-600 to-brand-800' },
    { titulo: 'Ofertas da Semana', subtitulo: 'Descontos imperdíveis em peças selecionadas para sua moto', cta: 'Ver Ofertas', link: '/vitrine/promocoes', cor: 'from-red-600 to-red-800' },
    { titulo: 'Oficina Premium', subtitulo: 'Serviços especializados com garantia e agendamento online', cta: 'Agendar Serviço', link: '/vitrine/catalogo', cor: 'from-slate-700 to-slate-900' },
  ];

  useEffect(() => {
    const t = setInterval(() => setCurrent(prev => (prev + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="relative overflow-hidden">
      <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((s, i) => (
          <div key={i} className="w-full flex-shrink-0">
            <div className={`bg-gradient-to-r ${s.cor} px-6 md:px-16 py-14 md:py-20 text-white`}>
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">{s.titulo}</h1>
                <p className="text-base md:text-lg text-white/70 mb-6 max-w-xl mx-auto">{s.subtitulo}</p>
                <a href={s.link} className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-slate-900 rounded-xl text-sm font-extrabold hover:bg-slate-50 transition-colors shadow-xl">
                  {s.cta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-brand-600 w-6' : 'bg-slate-300'}`} />
        ))}
      </div>
    </div>
  );
}
