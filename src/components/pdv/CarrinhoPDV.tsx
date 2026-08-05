'use client';

import { useState, useCallback } from 'react';

interface ItemCarrinho {
  id: string;
  pecaId: string;
  nome: string;
  codigo: string;
  imagemUrl?: string;
  precoOriginal: number;
  precoUnitario: number;
  descontoPercent: number;
  descontoReais: number;
  quantidade: number;
  subtotal: number;
  reservado: boolean;
  observacao?: string;
}

interface CarrinhoPDVProps {
  itens: ItemCarrinho[];
  onUpdateQuantidade: (id: string, qtd: number) => void;
  onUpdateDescontoPercent: (id: string, pct: number) => void;
  onUpdateDescontoReais: (id: string, reais: number) => void;
  onUpdateObservacao: (id: string, obs: string) => void;
  onRemover: (id: string) => void;
  onFinalizar: () => void;
  onCancelar: () => void;
  onReservar?: () => void;
  onLiberarReserva?: () => void;
}

export type { ItemCarrinho };

export default function CarrinhoPDV({
  itens, onUpdateQuantidade, onUpdateDescontoPercent, onUpdateDescontoReais,
  onUpdateObservacao, onRemover, onFinalizar, onCancelar, onReservar, onLiberarReserva,
}: CarrinhoPDVProps) {
  const subtotalGeral = itens.reduce((s, i) => s + i.subtotal, 0);
  const totalDescontos = itens.reduce((s, i) => s + (i.descontoReais + (i.precoOriginal * i.descontoPercent / 100) * i.quantidade), 0);
  const totalGeral = subtotalGeral;
  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);
  const temReservas = itens.some(i => i.reservado);
  const [editDescontoPercent, setEditDescontoPercent] = useState<string | null>(null);
  const [editDescontoReais, setEditDescontoReais] = useState<string | null>(null);

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-100 flex-shrink-0 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800">Carrinho</h2>
          <p className="text-[10px] text-slate-400">{itens.length} item(ns) · {totalItens} un.</p>
        </div>
        <div className="flex items-center gap-2">
          {itens.length > 0 && onReservar && !temReservas && (
            <button onClick={onReservar} className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 font-semibold">
              Reservar
            </button>
          )}
          {temReservas && onLiberarReserva && (
            <button onClick={onLiberarReserva} className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 font-semibold">
              Liberar Reservas
            </button>
          )}
          {itens.length > 0 && (
            <button onClick={onCancelar} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="flex-1 overflow-y-auto">
        {itens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">Carrinho vazio</p>
            <p className="text-xs text-slate-400">Escaneie ou busque um produto para comecar</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {itens.map((item) => (
              <div key={item.id} className="p-3 hover:bg-slate-50/50 transition-colors group">
                <div className="flex gap-3">
                  {/* Imagem */}
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 relative">
                    {item.imagemUrl ? (
                      <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      </div>
                    )}
                    {item.reservado && (
                      <div className="absolute top-0 right-0 w-4 h-4 bg-amber-500 rounded-bl-lg flex items-center justify-center">
                        <span className="text-white text-[7px] font-bold">R</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.nome}</p>
                      <button onClick={() => onRemover(item.id)}
                        className="w-5 h-5 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        title="Remover"
                      >×</button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">{item.codigo}</p>

                    {/* Qtd + Preco */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* Quantidade */}
                      <div className="flex items-center bg-slate-100 rounded-lg">
                        <button
                          onClick={() => onUpdateQuantidade(item.id, Math.max(1, item.quantidade - 1))}
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 text-xs"
                        >−</button>
                        <span className="w-8 text-center text-xs font-bold text-slate-700">{item.quantidade}</span>
                        <button
                          onClick={() => onUpdateQuantidade(item.id, item.quantidade + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 text-xs"
                        >+</button>
                      </div>

                      <span className="text-[10px] text-slate-400">×</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-600">{fm(item.precoUnitario)}</span>
                        {item.precoOriginal !== item.precoUnitario && (
                          <span className="text-[9px] text-slate-400 line-through">{fm(item.precoOriginal)}</span>
                        )}
                      </div>

                      {/* Descontos */}
                      <div className="flex items-center gap-1 ml-auto">
                        <div className="flex items-center gap-0.5">
                          <span className="text-[9px] text-slate-400">%</span>
                          {editDescontoPercent === item.id ? (
                            <input
                              type="number" min="0" max="100" step="0.1"
                              value={item.descontoPercent || ''}
                              onChange={e => onUpdateDescontoPercent(item.id, parseFloat(e.target.value) || 0)}
                              onBlur={() => setEditDescontoPercent(null)}
                              onKeyDown={e => { if (e.key === 'Enter') setEditDescontoPercent(null); }}
                              className="w-11 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 text-center"
                              autoFocus
                            />
                          ) : (
                            <button onClick={() => setEditDescontoPercent(item.id)}
                              className="text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded px-1.5 py-0.5 transition-colors">
                              {item.descontoPercent > 0 ? `${item.descontoPercent}%` : '0%'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[9px] text-slate-400">R$</span>
                          {editDescontoReais === item.id ? (
                            <input
                              type="number" min="0" step="0.01"
                              value={item.descontoReais || ''}
                              onChange={e => onUpdateDescontoReais(item.id, parseFloat(e.target.value) || 0)}
                              onBlur={() => setEditDescontoReais(null)}
                              onKeyDown={e => { if (e.key === 'Enter') setEditDescontoReais(null); }}
                              className="w-12 sm:w-16 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded px-1 py-0.5 text-center"
                              autoFocus
                            />
                          ) : (
                            <button onClick={() => setEditDescontoReais(item.id)}
                              className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded px-1.5 py-0.5 transition-colors">
                              {item.descontoReais > 0 ? fm(item.descontoReais) : '0,00'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subtotal + Observacao */}
                    <div className="flex items-center justify-between mt-1.5">
                      <input
                        value={item.observacao || ''}
                        onChange={e => onUpdateObservacao(item.id, e.target.value)}
                        className="text-[10px] text-slate-400 bg-transparent border-none outline-none flex-1 placeholder-slate-300"
                        placeholder="Observacao..."
                      />
                      <div className="flex items-center gap-1 ml-2">
                        {(item.descontoPercent > 0 || item.descontoReais > 0) && (
                          <span className="text-[9px] text-amber-600">
                            (−{fm(item.precoOriginal * item.quantidade - item.subtotal)})
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-800">{fm(item.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — totais + botoes */}
      {itens.length > 0 && (
        <div className="border-t border-slate-200 p-4 space-y-3 flex-shrink-0 bg-white">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({totalItens} un.)</span>
              <span>{fm(subtotalGeral + totalDescontos)}</span>
            </div>
            {totalDescontos > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Descontos</span>
                <span>− {fm(totalDescontos)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-800 pt-1 border-t border-slate-100">
              <span>Total</span>
              <span>{fm(totalGeral)}</span>
            </div>
          </div>

          <button
            onClick={onFinalizar}
            className="btn-primary w-full py-3 text-sm font-bold"
          >
            FINALIZAR VENDA · {fm(totalGeral)}
          </button>
        </div>
      )}
    </div>
  );
}
