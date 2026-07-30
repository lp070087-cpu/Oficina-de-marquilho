'use client';

import { useState, useEffect, useCallback } from 'react';

interface Revisao {
  id: string;
  tipo: string;
  valor: string;
  descricao?: string | null;
  notificada: boolean;
  createdAt: string;
}

interface RevisoesAgendadasProps {
  osId: string;
}

export default function RevisoesAgendadas({ osId }: RevisoesAgendadasProps) {
  const [revisoes, setRevisoes] = useState<Revisao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'KM', valor: '', descricao: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const fetchRevisoes = useCallback(async () => {
    try {
      const r = await fetch(`/api/ordens/${osId}/revisoes`);
      setRevisoes(Array.isArray(await r.json()) ? await r.json() : []);
    } catch { setRevisoes([]); }
    setLoading(false);
  }, [osId]);

  useEffect(() => { fetchRevisoes(); }, [fetchRevisoes]);

  async function agendarRevisao() {
    if (!form.valor.trim()) { setErro('Informe o valor (km ou data).'); return; }
    setSaving(true);
    setErro('');
    try {
      const res = await fetch(`/api/ordens/${osId}/revisoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: form.tipo, valor: form.valor.trim(), descricao: form.descricao.trim() || null }),
      });
      if (res.ok) {
        setForm({ tipo: 'KM', valor: '', descricao: '' });
        setShowForm(false);
        fetchRevisoes();
      } else {
        const data = await res.json();
        setErro(data.error || 'Erro ao agendar');
      }
    } catch { setErro('Erro ao agendar revisao.'); }
    setSaving(false);
  }

  const revisoesPorTipo = {
    KM: revisoes.filter(r => r.tipo === 'KM'),
    DATA: revisoes.filter(r => r.tipo === 'DATA'),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">{revisoes.length} revisões agendadas</span>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Agendar
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5">
              <button onClick={() => setForm({ ...form, tipo: 'KM' })}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${form.tipo === 'KM' ? 'bg-brand-600 text-white' : 'text-slate-500'}`}>Por KM</button>
              <button onClick={() => setForm({ ...form, tipo: 'DATA' })}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${form.tipo === 'DATA' ? 'bg-brand-600 text-white' : 'text-slate-500'}`}>Por Data</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">{form.tipo === 'KM' ? 'KM' : 'Data'}</label>
              <input value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })}
                type={form.tipo === 'DATA' ? 'date' : 'text'}
                className="input-field mt-1 text-xs" placeholder={form.tipo === 'KM' ? 'Ex: 5000' : 'Selecionar data'} />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Descrição (opcional)</label>
              <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="input-field mt-1 text-xs" placeholder="Ex: Revisão dos 5.000 km" />
            </div>
          </div>
          {erro && <p className="text-[10px] text-red-500 font-medium">{erro}</p>}
          <div className="flex gap-2">
            <button onClick={agendarRevisao} disabled={saving}
              className="btn-primary text-xs px-4 py-2">{saving ? 'Salvando...' : 'Agendar Revisão'}</button>
            <button onClick={() => { setShowForm(false); setErro(''); }} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : revisoes.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-slate-400">Nenhuma revisão agendada</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Agende a próxima revisão por quilometragem ou data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Por KM */}
          {revisoesPorTipo.KM.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Por Quilometragem</p>
              <div className="space-y-1.5">
                {revisoesPorTipo.KM.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">{r.valor}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{r.descricao || `Revisão ${r.valor} km`}</p>
                      <p className="text-[10px] text-slate-400">{r.notificada ? 'Notificada' : 'Pendente'}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">km</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por Data */}
          {revisoesPorTipo.DATA.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Por Data</p>
              <div className="space-y-1.5">
                {revisoesPorTipo.DATA.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{r.descricao || `Revisão agendada`}</p>
                      <p className="text-[10px] text-slate-400">{r.notificada ? 'Notificada' : 'Pendente'} • {new Date(r.valor + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
