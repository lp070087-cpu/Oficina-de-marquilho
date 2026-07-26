'use client';

import { useEffect, useState } from 'react';

interface Categoria { id: string; nome: string; slug: string; }

const FALLBACK_CATEGORIAS = [
  { slug: 'motor', label: 'Motor' },
  { slug: 'freios', label: 'Freios' },
  { slug: 'suspensao', label: 'Suspensão' },
  { slug: 'eletrica', label: 'Elétrica' },
  { slug: 'transmissao', label: 'Transmissão' },
  { slug: 'escapamento', label: 'Escapamento' },
  { slug: 'carenagem', label: 'Carenagem' },
  { slug: 'lubrificantes', label: 'Lubrificantes' },
  { slug: 'acessorios', label: 'Acessórios' },
  { slug: 'capacetes', label: 'Capacetes' },
  { slug: 'pneus', label: 'Pneus' },
  { slug: 'rolamentos', label: 'Rolamentos' },
  { slug: 'cabos', label: 'Cabos' },
  { slug: 'filtros', label: 'Filtros' },
  { slug: 'outros', label: 'Outros' },
];

export default function EstoqueCategorias({ active, onChange }: { active: string; onChange: (s: string) => void }) {
  const [categorias, setCategorias] = useState<{ slug: string; label: string }[]>(FALLBACK_CATEGORIAS);

  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then((data: Categoria[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategorias(data.map(c => ({ slug: c.slug, label: c.nome })));
        }
      })
      .catch(() => { /* mantem fallback */ });
  }, []);

  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
          active === ''
            ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        Todos
      </button>
      {categorias.map(c => (
        <button
          key={c.slug}
          onClick={() => onChange(c.slug)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
            active === c.slug
              ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
