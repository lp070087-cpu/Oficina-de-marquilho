'use client';

import { useState, useEffect } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Produto {
  id: string; nome: string; precoVenda: number; precoOferta?: number; precoVitrine?: number;
  marca?: string; compatibilidade?: string; imagemUrl?: string;
  garantia?: string; descricaoCurta?: string;
  categoria: { nome: string; slug: string };
}

// Preço público oficial (item 6): precoVitrine > precoOferta > precoVenda.
function precoPublico(p: Produto): number {
  const pv = p.precoVitrine != null ? Number(p.precoVitrine) : NaN;
  if (Number.isFinite(pv) && pv > 0) return pv;
  if (p.precoOferta && Number(p.precoOferta) < Number(p.precoVenda)) return Number(p.precoOferta);
  return Number(p.precoVenda) || 0;
}

export default function ComparadorVitrine({ produtos: initial, onClose }: { produtos: Produto[]; onClose: () => void }) {
  const [produtos, setProdutos] = useState(initial);

  return (
    <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-slate-800">Comparar Produtos</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {produtos.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Nenhum produto selecionado para comparar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium w-32">Atributo</th>
                    {produtos.map(p => (
                      <th key={p.id} className="py-2 px-3 text-center min-w-[140px] sm:min-w-[180px]">
                        <div className="w-20 h-20 bg-slate-50 rounded-lg mx-auto mb-2 overflow-hidden">
                          {p.imagemUrl ? <img src={p.imagemUrl} alt={p.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16"/></svg></div>}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700 line-clamp-2">{p.nome}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <LinhaComparacao label="Preço" valores={produtos.map(p => fm(precoPublico(p)))} />
                  <LinhaComparacao label="Marca" valores={produtos.map(p => p.marca || '-')} />
                  <LinhaComparacao label="Categoria" valores={produtos.map(p => p.categoria.nome)} />
                  <LinhaComparacao label="Compatibilidade" valores={produtos.map(p => p.compatibilidade || '-')} />
                  <LinhaComparacao label="Descrição" valores={produtos.map(p => p.descricaoCurta || '-')} />
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinhaComparacao({ label, valores }: { label: string; valores: string[] }) {
  return (
    <tr className="hover:bg-slate-50/50">
      <td className="py-2.5 px-3 font-semibold text-slate-500 text-[10px] uppercase tracking-wider">{label}</td>
      {valores.map((v, i) => (
        <td key={i} className="py-2.5 px-3 text-center text-slate-700">{v}</td>
      ))}
    </tr>
  );
}
