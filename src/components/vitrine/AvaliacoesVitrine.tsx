'use client';

import { useState } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface AvaliacaoData {
  id: string; nota: number; titulo?: string; comentario?: string; fotos?: string;
  verificada: boolean; createdAt: string; cliente: { nome: string };
}

export default function AvaliacoesVitrine({ pecaId }: { pecaId: string }) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoData[]>([]);
  const [media, setMedia] = useState(0);
  const [total, setTotal] = useState(0);
  const [dist, setDist] = useState<Record<number, number>>({ 1:0,2:0,3:0,4:0,5:0 });
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch(`/api/vitrine/avaliacoes?pecaId=${pecaId}`)
      .then(r => r.json()).then(d => {
        setAvaliacoes(d.avaliacoes || []);
        setMedia(d.media || 0);
        setTotal(d.total || 0);
        setDist(d.distribuicao || { 1:0,2:0,3:0,4:0,5:0 });
      }).finally(() => setLoading(false));
  });

  if (loading) return <div className="py-4"><div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  const estrelas = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-slate-800">{media.toFixed(1)}</p>
          <p className="text-sm text-yellow-500">{estrelas(Math.round(media))}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{total} avaliações</p>
        </div>
        <div className="flex-1 space-y-1 min-w-[180px]">
          {[5,4,3,2,1].map(n => {
            const pct = total > 0 ? (dist[n] / total) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right text-slate-500">{n}★</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-slate-400">{dist[n]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      {avaliacoes.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">Nenhuma avaliação ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map(a => (
            <div key={a.id} className="border-b border-slate-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-700">{a.cliente.nome}</span>
                <span className="text-yellow-500 text-xs">{estrelas(a.nota)}</span>
                {a.verificada && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded">Verificada</span>}
              </div>
              {a.titulo && <p className="text-xs font-semibold text-slate-700 mb-1">{a.titulo}</p>}
              {a.comentario && <p className="text-xs text-slate-500 leading-relaxed">{a.comentario}</p>}
              <p className="text-[9px] text-slate-400 mt-2">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
