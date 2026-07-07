'use client';

import { useState, useEffect } from 'react';

interface User { id: string; name: string; email: string; role: string; active: boolean; emAlmoco: boolean; }

export default function MecanicosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');

  async function fetchUsers() {
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    setUsers(data.filter((u: User) => u.role === 'MECANICO'));
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function toggleActive(id: string) {
    await fetch(`/api/usuarios/${id}`, { method: 'PUT' });
    fetchUsers();
  }

  async function criar() {
    if (!form.name || !form.email) { setMsg('Preencha nome e email.'); return; }
    const res = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role: 'MECANICO' }) });
    if (res.ok) { setModal(false); setForm({ name: '', email: '', password: '' }); fetchUsers(); setMsg(''); }
    else { const e = await res.json(); setMsg(e.error || 'Erro ao criar.'); }
  }

  const emAlmoco = users.filter(u => u.emAlmoco && u.active).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">MECANICOS</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.filter(u => u.active).length} ativos {emAlmoco > 0 ? `- ${emAlmoco} em almoco` : ''}</p>
        </div>
        <button onClick={() => { setForm({ name: '', email: '', password: '' }); setMsg(''); setModal(true); }} className="btn-primary inline-flex items-center gap-2 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Novo mecanico
        </button>
      </div>

      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : users.length === 0 ? (
        <div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhum mecanico cadastrado.</p></div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Nome</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 uppercase"></th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="py-2 px-3 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      {u.name}
                      {u.emAlmoco && u.active && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Almoco</span>}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-xs">{u.email}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${u.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-500">{u.active ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button onClick={() => toggleActive(u.id)} className={`text-xs font-medium ${u.active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}`}>
                      {u.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Novo Mecanico</h2>
            {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">{msg}</div>}
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-slate-600">Nome</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field mt-1" /></div>
              <div><label className="text-xs font-medium text-slate-600">Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field mt-1" /></div>
              <div><label className="text-xs font-medium text-slate-600">Senha</label><input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field mt-1" placeholder="Deixe em branco para padrao" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
              <button onClick={() => setModal(false)} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={criar} className="btn-primary text-xs">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
