'use client';

const CATEGORIAS_ESTOQUE = [
  { slug:'motor', label:'Motor' },
  { slug:'freios', label:'Freios' },
  { slug:'suspensao', label:'Suspensão' },
  { slug:'eletrica', label:'Elétrica' },
  { slug:'oleos-e-fluidos', label:'Lubrificantes' },
  { slug:'filtros', label:'Filtros' },
  { slug:'transmissao', label:'Transmissão' },
  { slug:'escapamento', label:'Escapamento' },
  { slug:'rodas-e-pneus', label:'Pneus/Rodas' },
  { slug:'cabos-e-comandos', label:'Cabos' },
  { slug:'carroceria', label:'Carroceria' },
  { slug:'acessorios', label:'Acessórios' },
];

export default function EstoqueCategorias({ active, onChange }: { active: string; onChange: (s: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
          active === '' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
        }`}
      >
        Todos
      </button>
      {CATEGORIAS_ESTOQUE.map(c => (
        <button
          key={c.slug}
          onClick={() => onChange(c.slug)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
            active === c.slug ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
