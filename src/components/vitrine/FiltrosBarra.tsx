'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Filtros {
  marca: string; categoria: string; precoMin: string; precoMax: string;
  promocao: boolean; disponivel: boolean; compatibilidade: string; subcategoria: string;
}

export default function FiltrosBarra({
  categorias, marcas, filtros, onChange, mode, onModeChange,
}: {
  categorias: { slug: string; nome: string; subcategorias?: { slug: string; nome: string }[] }[];
  marcas: string[];
  filtros: Filtros;
  onChange: (f: Filtros) => void;
  mode?: 'grid' | 'list';
  onModeChange?: (m: 'grid' | 'list') => void;
}) {
  const catAtiva = categorias.find(c => c.slug === filtros.categoria);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Categoria */}
        <select value={filtros.categoria} onChange={e => onChange({ ...filtros, categoria: e.target.value, subcategoria: '' })}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-400">
          <option value="">Todas categorias</option>
          {categorias.map(c => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
        </select>

        {/* Subcategoria (se categoria tiver) */}
        {catAtiva?.subcategorias && catAtiva.subcategorias.length > 0 && (
          <select value={filtros.subcategoria} onChange={e => onChange({ ...filtros, subcategoria: e.target.value })}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none focus:border-brand-400">
            <option value="">Todas subcategorias</option>
            {catAtiva.subcategorias.map(s => <option key={s.slug} value={s.slug}>{s.nome}</option>)}
          </select>
        )}

        {/* Marca */}
        <select value={filtros.marca} onChange={e => onChange({ ...filtros, marca: e.target.value })}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-400">
          <option value="">Todas marcas</option>
          {marcas.filter(Boolean).map(m => <option key={m} value={m!}>{m}</option>)}
        </select>

        {/* Compatibilidade */}
        <input type="text" placeholder="Moto/Modelo" value={filtros.compatibilidade}
          onChange={e => onChange({ ...filtros, compatibilidade: e.target.value })}
          className="w-full sm:w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-400" />

        {/* Preço */}
        <input type="number" placeholder="Preço mín" value={filtros.precoMin}
          onChange={e => onChange({ ...filtros, precoMin: e.target.value })}
          className="w-20 sm:w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-400" />
        <span className="text-slate-300">—</span>
        <input type="number" placeholder="Preço máx" value={filtros.precoMax}
          onChange={e => onChange({ ...filtros, precoMax: e.target.value })}
          className="w-20 sm:w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-400" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs">
          {/* Promoção */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={filtros.promocao} onChange={e => onChange({ ...filtros, promocao: e.target.checked })} className="rounded w-3.5 h-3.5" />
            <span className="text-[11px] text-red-500 font-semibold">🔥 Promoção</span>
          </label>

          {/* Disponível */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={filtros.disponivel} onChange={e => onChange({ ...filtros, disponivel: e.target.checked })} className="rounded w-3.5 h-3.5" />
            <span className="text-[11px] text-emerald-600 font-semibold">✅ Disponível</span>
          </label>
        </div>

        {/* Modo Grade/Lista */}
        {onModeChange && (
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => onModeChange('grid')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${mode === 'grid' ? 'bg-white text-brand-600 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-600'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            </button>
            <button onClick={() => onModeChange('list')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${mode === 'list' ? 'bg-white text-brand-600 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-600'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
