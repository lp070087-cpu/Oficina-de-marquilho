'use client';

import { useState, useEffect } from 'react';

interface Funcionario {
  id: string; name: string; cargo: string | null; telefone: string | null;
  observacoes: string | null; active: boolean; role: string;
}

const CARGOS = [
  'Administrador', 'Gerente', 'Estoquista', 'Atendente Loja',
  'Balcao Servicos', 'Balcao Venda', 'Mecanico', 'Mecanico de Servicos',
  'Mecanico Avulso', 'Auxiliar',
];

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [form, setForm] = useState({ name: '', cargo: '', telefone: '', observacoes: '' });
  const [msg, setMsg] = useState('');

  async function fetchFuncionarios() {
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    setFuncionarios(data.filter((u: any) => u.role === 'MECANICO'));
    setLoading(false);
  }

  useEffect(() => { fetchFuncionarios(); }, []);

  async function toggleActive(id: string) {
    const f = funcionarios.find(fn => fn.id === id);
    await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !f?.active }),
    });
    fetchFuncionarios();
  }

  function abrirNovo() { setEditando(null); setForm({ name: '', cargo: '', telefone: '', observacoes: '' }); setMsg(''); setModal(true); }
  function abrirEditar(f: Funcionario) {
    setEditando(f);
    setForm({ name: f.name, cargo: f.cargo || '', telefone: f.telefone || '', observacoes: f.observacoes || '' });
    setMsg('');
    setModal(true);
  }

  async function salvar() {
    if (!form.name.trim()) { setMsg('Preencha o nome.'); return; }
    const body: any = { name: form.name.trim(), cargo: form.cargo || null, telefone: form.telefone || null, observacoes: form.observacoes || null };

    if (editando) {
      const res = await fetch(`/api/usuarios/${editando.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) { setModal(false); fetchFuncionarios(); }
      else { const e = await res.json(); setMsg(e.error || 'Erro.'); }
    } else {
      // Mecanicos nao tem login — criamos com email placeholder e senha aleatoria
      const email = `func-${Date.now()}@interno.local`;
      const senhaTemporaria = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase();
      const res = await fetch('/api/usuarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, email, password: senhaTemporaria, role: 'MECANICO' }),
      });
      if (res.ok) { setModal(false); setForm({ name: '', cargo: '', telefone: '', observacoes: '' }); fetchFuncionarios(); }
      else { const e = await res.json(); setMsg(e.error || 'Erro.'); }
    }
  }

  const ativos = funcionarios.filter(f => f.active).length;
  const filter = funcionarios.filter(f =>
    !busca || f.name.toLowerCase().includes(busca.toLowerCase()) ||
    (f.cargo || '').toLowerCase().includes(busca.toLowerCase()) ||
    (f.telefone || '').includes(busca)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">FUNCIONARIOS</h1>
          <p className="text-sm text-slate-500 mt-0.5">{funcionarios.length} cadastrados &middot; {ativos} ativos</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary inline-flex items-center gap-2 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Novo funcionario
        </button>
      </div>

      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, cargo ou telefone..." className="input-field max-w-md mb-4" />

      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : filter.length === 0 ? (
        <div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhum funcionario cadastrado.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase">Nome</th>
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase">Cargo</th>
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase">Telefone</th>
              <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase">Acoes</th>
            </tr></thead>
            <tbody>
              {filter.map(f => (
                <tr key={f.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${!f.active ? 'opacity-50' : ''}`}>
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-slate-700">{f.name}</p>
                    {f.observacoes && <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{f.observacoes}</p>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-medium">{f.cargo || '—'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">{f.telefone || '—'}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 ${f.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${f.active ? 'bg-emerald-500' : 'bg-slate-300'}`}/>
                      <span className="text-xs font-medium">{f.active ? 'Ativo' : 'Inativo'}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => abrirEditar(f)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Editar</button>
                      <button onClick={() => toggleActive(f.id)} className={`text-xs font-medium ${f.active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}`}>
                        {f.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-800 mb-4">{editando ? 'Editar Funcionario' : 'Novo Funcionario'}</h2>
            {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field mt-1.5" placeholder="Nome completo" autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cargo</label>
                <select value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} className="input-field mt-1.5">
                  <option value="">Selecionar cargo...</option>
                  {CARGOS.map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefone</label>
                <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="input-field mt-1.5" placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Observacoes</label>
                <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} className="input-field mt-1.5" rows={2} placeholder="Observacoes internas..." />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 italic">Funcionarios com cargo de Mecanico sao usados para selecao nas Ordens de Servico. Eles nao possuem login no sistema.</p>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <button onClick={() => setModal(false)} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={salvar} className="btn-primary text-xs">{editando ? 'Salvar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
