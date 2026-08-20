'use client';

import { useState, useEffect } from 'react';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface AvaliacaoData {
  id: string; nota: number; titulo?: string; comentario?: string; fotos?: string;
  verificada: boolean; createdAt: string; cliente: { nome: string };
}

// Renderiza N estrelas cheias (âmbar) + (5-N) estrelas cinza vazias.
function Estrelas({ nota, size = 'text-sm' }: { nota: number; size?: string }) {
  return (
    <span className={`${size} inline-flex items-center gap-0.5`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= nota ? 'text-amber-400' : 'text-slate-300'}>★</span>
      ))}
    </span>
  );
}

export default function AvaliacoesVitrine({ pecaId }: { pecaId: string }) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoData[]>([]);
  const [media, setMedia] = useState(0);
  const [total, setTotal] = useState(0);
  const [dist, setDist] = useState<Record<number, number>>({ 1:0,2:0,3:0,4:0,5:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    fetch(`/api/vitrine/avaliacoes?pecaId=${pecaId}`)
      .then(r => r.json()).then(d => {
        if (!ativo) return;
        setAvaliacoes(d.avaliacoes || []);
        setMedia(d.media || 0);
        setTotal(d.total || 0);
        setDist(d.distribuicao || { 1:0,2:0,3:0,4:0,5:0 });
      }).catch(() => { /* silencioso */ })
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, [pecaId]);

  if (loading) return <div className="py-4"><div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-slate-800">{total > 0 ? media.toFixed(1) : '—'}</p>
          <Estrelas nota={total > 0 ? Math.round(media) : 0} size="text-sm" />
          <p className="text-[10px] text-slate-400 mt-0.5">{total > 0 ? `${total} avaliações` : 'Sem avaliações'}</p>
        </div>
        <div className="flex-1 space-y-1 min-w-[140px] sm:min-w-[180px]">
          {[5,4,3,2,1].map(n => {
            const pct = total > 0 ? (dist[n] / total) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right text-slate-500">{n}★</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-slate-400">{dist[n]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      {avaliacoes.length === 0 ? (
        <div className="py-10 text-center">
          <Estrelas nota={0} size="text-3xl" />
          <p className="text-xs text-slate-400 mt-3">Seja o primeiro a avaliar este produto.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map(a => (
            <div key={a.id} className="border-b border-slate-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-700">{a.cliente.nome}</span>
                <Estrelas nota={a.nota} size="text-xs" />
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
