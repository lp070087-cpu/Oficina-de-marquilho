'use client';

import { useState, useEffect, useCallback } from 'react';

interface Servico {
  id: string;
  nome: string;
  descricao?: string | null;
  valor: number;
  tempoEstimado?: number | null;
  garantiaDias?: number | null;
  categoria?: string | null;
  ativo: boolean;
}

const CATEGORIAS = ['Motor', 'Freios', 'Suspensao', 'Eletrica', 'Transmissao', 'Pneus', 'Revisao', 'Diagnostico', 'Outros'];

interface ServicosTabeladosProps {
  onSelecionar?: (servico: Servico) => void;
  selecionados?: string[]; // IDs
}

export default function ServicosTabelados({ onSelecionar, selecionados = [] }: ServicosTabeladosProps) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [showNovo, setShowNovo] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', valor: '0', tempoEstimado: '', garantiaDias: '', categoria: '' });
  const [saving, setSaving] = useState(false);

  const fetchServicos = useCallback(async () => {
    try {
      const params = categoriaFiltro ? `?categoria=${categoriaFiltro}` : '';
      const r = await fetch(`/api/servicos${params}`);
      setServicos(Array.isArray(r.ok ? await r.json() : []) ? await r.json() : []);
    } catch { setServicos([]); }
    setLoading(false);
  }, [categoriaFiltro]);

  useEffect(() => { fetchServicos(); }, [fetchServicos]);

  const filtered = servicos.filter(s => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return s.nome.toLowerCase().includes(q) || (s.descricao || '').toLowerCase().includes(q);
  });

  async function criarServico() {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao || null,
          valor: parseFloat(form.valor) || 0,
          tempoEstimado: form.tempoEstimado ? parseInt(form.tempoEstimado) : null,
          garantiaDias: form.garantiaDias ? parseInt(form.garantiaDias) : null,
          categoria: form.categoria || null,
        }),
      });
      setForm({ nome: '', descricao: '', valor: '0', tempoEstimado: '', garantiaDias: '', categoria: '' });
      setShowNovo(false);
      fetchServicos();
    } catch { /* ignore */ }
    setSaving(false);
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar servico..." className="input-field flex-1 min-w-[150px] text-xs" />
        <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-white">
          <option value="">Todas categorias</option>
          {CATEGORIAS.map(c => (<option key={c} value={c}>{c}</option>))}
        </select>
        <button onClick={() => setShowNovo(!showNovo)}
          className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Novo
        </button>
      </div>

      {/* Form novo servico */}
      {showNovo && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Nome</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="input-field mt-1 text-xs" placeholder="Ex: Troca de oleo" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Valor (R$)</label>
              <input value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} type="number" step="0.01" className="input-field mt-1 text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Categoria</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="input-field mt-1 text-xs">
                <option value="">Selecionar...</option>
                {CATEGORIAS.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Tempo (min)</label>
              <input value={form.tempoEstimado} onChange={e => setForm({ ...form, tempoEstimado: e.target.value })} type="number" className="input-field mt-1 text-xs" placeholder="Ex: 45" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Garantia (dias)</label>
              <select value={form.garantiaDias} onChange={e => setForm({ ...form, garantiaDias: e.target.value })} className="input-field mt-1 text-xs">
                <option value="">Sem garantia</option>
                {[30, 60, 90, 180, 365].map(d => (<option key={d} value={d}>{d} dias</option>))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={criarServico} disabled={saving || !form.nome.trim()}
              className="btn-primary text-xs px-4 py-2">{saving ? 'Salvando...' : 'Salvar Servico'}</button>
            <button onClick={() => setShowNovo(false)} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-slate-400">{servicos.length === 0 ? 'Nenhum servico tabelado. Cadastre o primeiro!' : 'Nenhum servico encontrado.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(s => {
            const sel = selecionados.includes(s.id);
            return (
              <div key={s.id} onClick={() => onSelecionar?.(s)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${sel ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-400' : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-800">{s.nome}</span>
                  <span className="text-sm font-bold text-brand-700">{fm(s.valor)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {s.categoria && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{s.categoria}</span>
                  )}
                  {s.tempoEstimado && (
                    <span className="text-[10px] text-slate-400">⏱ {s.tempoEstimado}min</span>
                  )}
                  {s.garantiaDias && (
                    <span className="text-[10px] text-slate-400">🛡 {s.garantiaDias}d</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
