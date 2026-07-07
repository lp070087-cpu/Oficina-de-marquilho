'use client';

import { useState, useEffect } from 'react';

interface User { id: string; name: string; email: string; role: string; active: boolean; }

export default function BalcoesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');

  async function fetchUsers() {
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    setUsers(data.filter((u: User) => u.role === 'BALCAO'));
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function toggleActive(id: string) {
    await fetch(`/api/usuarios/${id}`, { method: 'PUT' });
    fetchUsers();
  }

  function abrirNovo() { setEditando(null); setForm({ name:'', email:'', password:'' }); setMsg(''); setModal(true); }
  function abrirEditar(u: User) { setEditando(u); setForm({ name:u.name, email:u.email, password:'' }); setMsg(''); setModal(true); }

  async function salvar() {
    if (!form.name || !form.email) { setMsg('Preencha nome e email.'); return; }
    if (editando) {
      const body: any = { name: form.name };
      if (form.password) body.password = form.password;
      const res = await fetch(`/api/usuarios/${editando.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (res.ok) { setModal(false); fetchUsers(); setMsg(''); }
      else { const e = await res.json(); setMsg(e.error||'Erro ao salvar.'); }
    } else {
      if (!form.password) { setMsg('Defina uma senha para o balcao.'); return; }
      const res = await fetch('/api/usuarios', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, role:'BALCAO'}) });
      if (res.ok) { setModal(false); setForm({name:'',email:'',password:''}); fetchUsers(); setMsg(''); }
      else { const e = await res.json(); setMsg(e.error||'Erro ao criar.'); }
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">BALCOES</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.filter(u=>u.active).length} ativos — cada balcao faz login com seu email e senha</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary inline-flex items-center gap-2 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Novo balcao
        </button>
      </div>

      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : users.length===0 ? (
        <div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhum balcao cadastrado.</p></div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Email (login)</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Acoes</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-medium text-slate-700">{u.name}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center gap-1.5 ${u.active?'text-emerald-600':'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active?'bg-emerald-500':'bg-slate-300'}`}/>
                      <span className="text-xs font-medium">{u.active?'Ativo':'Inativo'}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right flex items-center justify-end gap-2">
                    <button onClick={()=>abrirEditar(u)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Editar</button>
                    <button onClick={()=>toggleActive(u.id)} className={`text-xs font-medium ${u.active?'text-red-500 hover:text-red-700':'text-emerald-600 hover:text-emerald-700'}`}>
                      {u.active?'Desativar':'Ativar'}
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">{editando?'Editar Balcao':'Novo Balcao'}</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}
            <div className="space-y-4">
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field mt-1.5" placeholder="Ex: Joao"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email de login</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field mt-1.5" placeholder="joao@loja.com" disabled={!!editando}/></div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{editando?'Nova senha (deixe vazio para manter)':'Senha de acesso'}</label>
                <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-field mt-1.5" placeholder={editando?'Manter senha atual':'Defina a senha'}/>
                {editando&&<p className="text-[10px] text-slate-400 mt-1">So preencha se quiser trocar a senha</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button onClick={()=>setModal(false)} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={salvar} className="btn-primary text-xs">{editando?'Salvar':'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
