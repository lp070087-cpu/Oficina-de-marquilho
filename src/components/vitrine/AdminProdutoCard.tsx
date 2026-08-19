'use client';

import { useState } from 'react';

interface PecaVitrine {
  id: string; nome: string; codigo: string; precoVenda: number; precoOferta?: number; precoVitrine?: number;
  quantidade: number; estoqueMinimo: number; destaque: boolean; oferta: boolean; vitrine: boolean;
  quantidadeLoja?: number; ativo?: boolean;
  marca?: string; compatibilidade?: string; imagemUrl?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string };
}

export default function AdminProdutoCard({ p, onToggle, onUpload, uploading }: {
  p: PecaVitrine;
  onToggle: (id: string, field: string, val: any) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  uploading: string;
}) {
  const [editPreco, setEditPreco] = useState(false);
  const [precoInput, setPrecoInput] = useState('');
  const [salvandoPreco, setSalvandoPreco] = useState(false);

  const preco = Number(p.precoVenda);
  // Item 6: preço exclusivo da Vitrine. `precoVitrine` é override SOMENTE da Vitrine
  // (nunca altera precoVenda/precoOferta → PDV, OS, Caixa, Notas intactos).
  const temOverride = p.precoVitrine != null && Number(p.precoVitrine) > 0;
  const temOferta = !temOverride && p.oferta && p.precoOferta;
  const precoOferta = temOverride ? Number(p.precoVitrine) : (temOferta ? Number(p.precoOferta) : preco);
  const desconto = temOferta ? Math.round(((preco - precoOferta) / preco) * 100) : 0;
  const precoPix = Math.round(precoOferta * 0.9 * 100) / 100;

  function iniciarEdicao() {
    setPrecoInput((temOverride ? Number(p.precoVitrine) : preco).toFixed(2));
    setEditPreco(true);
  }

  async function salvarPreco() {
    const n = Number(String(precoInput).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return;
    setSalvandoPreco(true);
    try { await onToggle(p.id, 'precoVitrine', Math.round(n * 100) / 100); } finally { setSalvandoPreco(false); setEditPreco(false); }
  }

  function usarPrecoEstoque() {
    onToggle(p.id, 'precoVitrine', null); // remove override → volta a precoVenda/precoOferta
    setEditPreco(false);
  }

  // Correção 1 (DONA): o campo manual `vitrine` NÃO controla mais a exposição pública.
  // A disponibilidade real na Vitrine é: ativo && quantidadeLoja > 0 && precoVenda > 0.
  // O botão antigo 👁/🙈 foi REMOVIDO — este é um indicador somente leitura.
  const disponivelVitrine = p.ativo !== false && (Number(p.quantidadeLoja ?? 0) > 0) && (Number(p.precoVenda) > 0);

  return (
    <div className={`bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group flex flex-col ${disponivelVitrine ? 'border-slate-200' : 'border-dashed border-amber-300 bg-amber-50/30'}`}>
      {/* Imagem - menor e mais compacta */}
      <div className="relative h-40 overflow-hidden">
        {/* Selos */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5">
          {temOferta && <span className="bg-gold-500 text-[#5c3a0a] text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase">-{desconto}%</span>}
          {p.destaque && !temOferta && <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase">⭐ Destaque</span>}
        </div>

        {/* Botoes de acao (sem toggle de vitrine — disponibilidade é derivada da regra oficial) */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-0.5 items-end">
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${disponivelVitrine ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-amber-700 border-amber-300'}`}>
            {disponivelVitrine ? 'VISÍVEL' : 'INDISPONÍVEL'}
          </span>
          <div className="flex gap-0.5">
            <button onClick={() => onToggle(p.id, 'destaque', !p.destaque)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${p.destaque ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-500 border-slate-200'}`}>⭐</button>
            <button onClick={() => onToggle(p.id, 'oferta', !p.oferta)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${p.oferta ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-500 border-slate-200'}`}>🔥</button>
          </div>
        </div>

        {/* Foto + upload overlay */}
        <div className="w-full h-full group-hover:scale-105 transition-transform duration-300 relative">
          {p.imagemUrl ? (
            <img src={p.imagemUrl} alt={p.nome} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${!disponivelVitrine ? 'bg-amber-50' : 'bg-slate-100'}`}>
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
        <div className="mt-auto pt-2 border-t border-slate-100 space-y-1">
          {/* Item 7 — EDIÇÃO DE PREÇO NA ÁREA DA DONA */}
          <div className="flex items-center justify-between gap-1 text-[9px]">
            <span className="text-slate-400">Preço estoque:</span>
            <span className="font-mono text-slate-500">{preco.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] text-slate-400">Preço na Vitrine:</span>
            {editPreco ? (
              <span className="flex items-center gap-1">
                <input value={precoInput} onChange={e => setPrecoInput(e.target.value)}
                  inputMode="decimal" autoFocus
                  className="w-20 px-1.5 py-0.5 border border-brand-400 rounded text-[11px] font-bold text-slate-800 outline-none focus:border-brand-500 text-right"
                  onKeyDown={e => e.key === 'Enter' && salvarPreco()} />
                <button onClick={salvarPreco} disabled={salvandoPreco} className="px-1.5 py-0.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded text-[9px] font-bold">
                  {salvandoPreco ? '…' : 'OK'}
                </button>
              </span>
            ) : (
              <button onClick={iniciarEdicao} className="font-mono text-[11px] font-extrabold text-brand-700 hover:text-brand-800 hover:underline">
                {precoOferta.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
              </button>
            )}
          </div>
          {editPreco ? (
            <div className="flex items-center gap-2 pt-0.5">
              {temOverride && (
                <button onClick={usarPrecoEstoque} className="text-[9px] text-emerald-700 font-bold hover:underline">Usar preço do estoque</button>
              )}
              <button onClick={() => setEditPreco(false)} className="text-[9px] text-slate-400 hover:text-slate-600">Cancelar</button>
            </div>
          ) : (
            <p className="text-[10px] text-brand-700 font-bold">{precoPix.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} no Pix</p>
          )}
        </div>
      </div>
    </div>
  );
}
