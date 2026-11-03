'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Sugestao = { id: string; codigo: string; marca: string | null; nomeAtual: string; nomeSugerido: string; motivos: string[]; trocas: { de: string; para: string }[] };
type Historico = { id: string; pecaId: string; createdAt: string; anterior?: string; novo?: string; usuario?: string };
const ROTULO: Record<string, string> = { digitacao: 'Erro de digitação', incompleta: 'Palavra incompleta', acento: 'Acentuação', espacos: 'Espaços' };
const COR: Record<string, string> = { digitacao: 'bg-red-50 text-red-700', incompleta: 'bg-amber-50 text-amber-700', acento: 'bg-blue-50 text-blue-700', espacos: 'bg-slate-100 text-slate-600' };

export default function RevisaoNomesPage() {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [editados, setEditados] = useState<Record<string, string>>({});
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<'textos' | 'espacos' | 'todos'>('textos');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true); setErro('');
    try {
      const r = await fetch('/api/pecas/nomes', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Falha ao carregar sugestões');
      setSugestoes(d.sugestoes); setHistorico(d.historico); setMarcados(new Set()); setEditados({});
    } catch (e) { setErro((e as Error).message); } finally { setCarregando(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const somenteEspacos = (s: Sugestao) => s.motivos.length === 1 && s.motivos[0] === 'espacos';
  const visiveis = useMemo(() => sugestoes.filter(s => filtro === 'todos' || (filtro === 'espacos' ? somenteEspacos(s) : !somenteEspacos(s))), [sugestoes, filtro]);
  const contagem = { textos: sugestoes.filter(s => !somenteEspacos(s)).length, espacos: sugestoes.filter(somenteEspacos).length };
  const todosMarcados = visiveis.length > 0 && visiveis.every(s => marcados.has(s.id));

  function alternar(id: string) { setMarcados(old => { const n = new Set(old); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  async function aprovar() {
    const alteracoes = sugestoes.filter(s => marcados.has(s.id)).map(s => ({ id: s.id, de: s.nomeAtual, para: (editados[s.id] ?? s.nomeSugerido).trim() }));
    if (!alteracoes.length) return;
    if (!confirm(`Salvar ${alteracoes.length} ${alteracoes.length === 1 ? 'nome corrigido' : 'nomes corrigidos'}? O nome anterior fica registrado no histórico.`)) return;
    setSalvando(true); setErro(''); setMsg('');
    try {
      const r = await fetch('/api/pecas/nomes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alteracoes }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Falha ao salvar');
      setMsg(`${d.aplicadas.length} ${d.aplicadas.length === 1 ? 'nome salvo' : 'nomes salvos'}.${d.ignoradas.length ? ` ${d.ignoradas.length} ignorado(s): o nome mudou desde a revisão ou não houve alteração.` : ''}`);
      await carregar();
    } catch (e) { setErro((e as Error).message); } finally { setSalvando(false); }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 p-3 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/dono/estoque" className="text-xs text-slate-500 hover:text-brand-600">← Estoque</Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Revisão de nomes</h1>
          <p className="mt-0.5 text-sm text-slate-500">Possíveis erros de digitação, acentuação e espaços. Nada é alterado sem sua aprovação; SKU, marca e descrição não mudam.</p>
        </div>
        <button onClick={aprovar} disabled={salvando || !marcados.size} className="btn-primary disabled:opacity-40">{salvando ? 'Salvando…' : `Aprovar selecionados (${marcados.size})`}</button>
      </div>
      {erro && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      {msg && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        {([['textos', `Grafia (${contagem.textos})`], ['espacos', `Só espaços (${contagem.espacos})`], ['todos', `Todas (${sugestoes.length})`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} aria-pressed={filtro === k} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filtro === k ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{l}</button>
        ))}
      </div>
      <div className="card-table overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Selecionar todos" checked={todosMarcados} onChange={() => setMarcados(old => { const n = new Set(old); visiveis.forEach(s => todosMarcados ? n.delete(s.id) : n.add(s.id)); return n; })} /></th>
            <th className="px-3 py-3">SKU</th><th className="px-3 py-3">Nome atual</th><th className="px-3 py-3">Sugestão (editável)</th><th className="px-3 py-3">Motivo</th>
          </tr></thead>
          <tbody>
            {carregando && <tr><td colSpan={5} className="py-10 text-center text-slate-400">Analisando o catálogo…</td></tr>}
            {!carregando && !visiveis.length && <tr><td colSpan={5} className="py-10 text-center text-slate-400">Nenhuma sugestão neste filtro.</td></tr>}
            {!carregando && visiveis.map(s => (
              <tr key={s.id} className={`border-b border-slate-50 ${marcados.has(s.id) ? 'bg-brand-50/40' : ''}`}>
                <td className="px-3 py-2"><input type="checkbox" aria-label={`Selecionar ${s.nomeAtual}`} checked={marcados.has(s.id)} onChange={() => alternar(s.id)} /></td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500">{s.codigo}{s.marca ? <span className="block font-sans text-[11px] text-slate-400">{s.marca}</span> : null}</td>
                <td className="px-3 py-2 text-slate-700"><span className="whitespace-pre-wrap rounded bg-slate-50 px-1">{s.nomeAtual}</span></td>
                <td className="px-3 py-2"><input value={editados[s.id] ?? s.nomeSugerido} onChange={e => setEditados(old => ({ ...old, [s.id]: e.target.value }))} className="input-field text-sm" maxLength={200} />{s.trocas.length > 0 && <span className="mt-1 block text-[11px] text-slate-400">{s.trocas.map(t => `${t.de} → ${t.para}`).join(' · ')}</span>}</td>
                <td className="px-3 py-2">{s.motivos.map(m => <span key={m} className={`mr-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${COR[m]}`}>{ROTULO[m] || m}</span>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Histórico de correções</h2>
        <div className="card divide-y divide-slate-100 p-0 text-sm">
          {!historico.length && <p className="p-4 text-slate-400">Nenhuma correção registrada.</p>}
          {historico.map(h => <p key={h.id} className="p-3"><span className="text-slate-400">{new Date(h.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' })} · {h.usuario || 'DONA'}:</span> <span className="line-through decoration-red-400">{h.anterior}</span> → <strong>{h.novo}</strong></p>)}
        </div>
      </section>
    </div>
  );
}
