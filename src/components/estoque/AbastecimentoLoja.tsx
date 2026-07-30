'use client';

import { useState, useEffect } from 'react';

interface Peca {
  id: string; nome: string; codigo: string; codigoBarras?: string;
  quantidade: number; quantidadeLoja: number; estoqueMinimo: number;
  precoVenda: number; precoCusto: number;
  marca?: string; categoria: { nome: string; id: string };
}

interface SugestaoAbastecimento {
  peca: Peca;
  qtdSugerida: number;
  motivo: string;
  prioridade: 'alta' | 'media' | 'baixa';
  pontuacao: number;
}

export default function AbastecimentoLoja() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoAbastecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [transferindo, setTransferindo] = useState<string | null>(null);
  const [qtds, setQtds] = useState<Record<string, string>>({});
  const [msgOk, setMsgOk] = useState('');

  useEffect(() => {
    fetch('/api/pecas')
      .then((r) => r.json())
      .then((data: Peca[]) => {
        setPecas(data);
        setLoading(false);
        const sugs = gerarSugestoes(data);
        setSugestoes(sugs);
        // Inicializa quantidades
        const qMap: Record<string, string> = {};
        for (const s of sugs) {
          qMap[s.peca.id] = String(s.qtdSugerida);
        }
        setQtds(qMap);
      });
  }, []);

  function gerarSugestoes(pecas: Peca[]): SugestaoAbastecimento[] {
    const sugs: SugestaoAbastecimento[] = [];

    for (const p of pecas) {
      let pontuacao = 0;
      let qtdSugerida = 0;
      const motivos: string[] = [];

      // 1. Loja esta zerada ou abaixo do minimo
      if ((p.quantidadeLoja || 0) <= 0) {
        pontuacao += 40;
        motivos.push('Loja sem estoque');
      } else if ((p.quantidadeLoja || 0) < Math.max(2, Math.ceil(p.estoqueMinimo / 3))) {
        pontuacao += 25;
        motivos.push('Loja com estoque baixo');
      }

      // 2. Central tem excesso
      if (p.quantidade > 10) {
        pontuacao += 20;
        motivos.push('Central com excesso');
        qtdSugerida = Math.min(p.quantidade, Math.ceil(p.quantidade * 0.4));
      }

      // 3. Central tem mas loja nao tem nada
      if (p.quantidade > 0 && (p.quantidadeLoja || 0) === 0) {
        pontuacao += 30;
        if (!motivos.includes('Loja sem estoque')) motivos.push('Loja precisa deste item');
        qtdSugerida = Math.max(qtdSugerida, Math.min(p.quantidade, Math.max(2, p.estoqueMinimo)));
      }

      // 4. Preco de venda alto (mais lucro na loja)
      if (Number(p.precoVenda) > 100) {
        pontuacao += 10;
        motivos.push('Produto de alto valor');
      }

      // 5. Estoque minimo como referencia
      if (p.quantidade > p.estoqueMinimo * 2) {
        pontuacao += 15;
        qtdSugerida = Math.max(qtdSugerida, Math.ceil(p.estoqueMinimo / 2));
      }

      // Calcula qtd sugerida se nao definida
      if (qtdSugerida === 0 && pontuacao > 0) {
        qtdSugerida = Math.min(p.quantidade, Math.max(1, Math.ceil(p.estoqueMinimo / 2)));
      }

      // Nao sugere se central tambem esta zerada
      if (p.quantidade <= 0) continue;

      // So inclui se tem pontuacao minima
      if (pontuacao >= 15) {
        let prioridade: 'alta' | 'media' | 'baixa';
        if (pontuacao >= 60) prioridade = 'alta';
        else if (pontuacao >= 35) prioridade = 'media';
        else prioridade = 'baixa';

        sugs.push({
          peca: p,
          qtdSugerida: Math.max(1, qtdSugerida),
          motivo: motivos.join('; '),
          prioridade,
          pontuacao,
        });
      }
    }

    // Ordena por prioridade e pontuacao
    return sugs.sort((a, b) => {
      const ordem = { alta: 0, media: 1, baixa: 2 };
      if (ordem[a.prioridade] !== ordem[b.prioridade]) return ordem[a.prioridade] - ordem[b.prioridade];
      return b.pontuacao - a.pontuacao;
    });
  }

  async function transferir(pecaId: string) {
    const qtd = parseInt(qtds[pecaId] || '0');
    if (qtd <= 0) return;

    setTransferindo(pecaId);
    const res = await fetch('/api/transferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pecaId, quantidade: qtd, de: 'CENTRAL', para: 'LOJA' }),
    });

    if (res.ok) {
      setMsgOk(`Transferencia de ${qtd} un. concluida!`);
      // Atualiza dados locais
      setPecas((prev) =>
        prev.map((p) =>
          p.id === pecaId
            ? { ...p, quantidade: p.quantidade - qtd, quantidadeLoja: (p.quantidadeLoja || 0) + qtd }
            : p
        )
      );
      // Remove das sugestoes
      setSugestoes((prev) => prev.filter((s) => s.peca.id !== pecaId));
      setTimeout(() => setMsgOk(''), 3500);
    }
    setTransferindo(null);
  }

  async function transferirTodas() {
    const filtradas = sugestoes.filter(
      (s) => filtroPrioridade === 'todas' || s.prioridade === filtroPrioridade
    );
    for (const s of filtradas) {
      await transferir(s.peca.id);
    }
  }

  const prioridadeCor: Record<string, string> = {
    alta: 'border-red-200 bg-red-50/50',
    media: 'border-amber-200 bg-amber-50/50',
    baixa: 'border-slate-200 bg-slate-50/50',
  };
  const prioridadeBadge: Record<string, string> = {
    alta: 'bg-red-100 text-red-700',
    media: 'bg-amber-100 text-amber-700',
    baixa: 'bg-slate-100 text-slate-600',
  };
  const prioridadeLabel: Record<string, string> = {
    alta: 'Alta',
    media: 'Media',
    baixa: 'Baixa',
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-slate-100 rounded w-48" />
          <div className="h-3 bg-slate-100 rounded w-64" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const filtradas =
    filtroPrioridade === 'todas'
      ? sugestoes
      : sugestoes.filter((s) => s.prioridade === filtroPrioridade);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-slate-800">
          🤖 Abastecimento Inteligente da Loja
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Sugestoes automaticas baseadas em giro, estoque minimo e historico
      </p>

      {msgOk && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-bold mb-4">
          {msgOk}
        </div>
      )}

      {sugestoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-700">Loja abastecida!</p>
          <p className="text-xs text-slate-400 mt-1">Nao ha sugestoes de abastecimento no momento.</p>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex items-center gap-2 mb-4">
            {(['todas', 'alta', 'media', 'baixa'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroPrioridade(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  filtroPrioridade === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f === 'todas'
                  ? `Todas (${sugestoes.length})`
                  : `${prioridadeLabel[f]} (${sugestoes.filter((s) => s.prioridade === f).length})`}
              </button>
            ))}
            {filtradas.length > 1 && (
              <button
                onClick={transferirTodas}
                className="ml-auto px-4 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Transferir todas
              </button>
            )}
          </div>

          {/* Lista de sugestoes */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filtradas.map((s) => (
              <div
                key={s.peca.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${prioridadeCor[s.prioridade]}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${prioridadeBadge[s.prioridade]}`}
                    >
                      {prioridadeLabel[s.prioridade]}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 truncate">{s.peca.nome}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1">
                    SKU: {s.peca.codigo} · {s.peca.categoria?.nome}
                    {s.peca.marca ? ` · ${s.peca.marca}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-500">{s.motivo}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-slate-400">
                      Central: <strong className="text-slate-700">{s.peca.quantidade}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Loja: <strong className="text-brand-600">{s.peca.quantidadeLoja || 0}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Min: <strong className="text-slate-500">{s.peca.estoqueMinimo}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Score: <strong className="text-slate-600">{s.pontuacao}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <input
                    type="number"
                    value={qtds[s.peca.id] || ''}
                    onChange={(e) =>
                      setQtds((prev) => ({ ...prev, [s.peca.id]: e.target.value }))
                    }
                    min="1"
                    max={s.peca.quantidade}
                    className="w-14 text-center text-sm font-bold border border-slate-200 rounded-lg py-1.5 px-2 outline-none focus:border-brand-400 transition-colors"
                  />
                  <button
                    onClick={() => transferir(s.peca.id)}
                    disabled={transferindo === s.peca.id || !qtds[s.peca.id]}
                    className="text-[11px] font-bold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {transferindo === s.peca.id ? '...' : '→ Loja'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
