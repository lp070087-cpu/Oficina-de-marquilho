'use client';

import { useState, useEffect } from 'react';

interface Mecanico { id: string; name: string; active: boolean; emAlmoco: boolean; }

export default function MecanicosPage() {
  const [users, setUsers] = useState<Mecanico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Mecanico | null>(null);
  const [form, setForm] = useState({ nome: '', sobrenome: '', telefone: '' });
  const [msg, setMsg] = useState('');

  async function fetchUsers() {
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    setUsers(data.filter((u: any) => u.role === 'MECANICO'));
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function toggleActive(id: string) {
    await fetch(`/api/usuarios/${id}`, { method: 'PUT' });
    fetchUsers();
  }

  function abrirNovo() { setEditando(null); setForm({ nome:'', sobrenome:'', telefone:'' }); setMsg(''); setModal(true); }
  function abrirEditar(u: Mecanico) {
    const partes = u.name.split(' ');
    setEditando(u);
    setForm({ nome: partes[0] || '', sobrenome: partes.slice(1).join(' ') || '', telefone: '' });
    setMsg('');
    setModal(true);
  }

  async function salvar() {
    if (!form.nome) { setMsg('Preencha o nome.'); return; }
    const nomeCompleto = form.sobrenome ? `${form.nome} ${form.sobrenome}` : form.nome;
    const body: any = { name: nomeCompleto };
    if (form.telefone) body.telefone = form.telefone;

    if (editando) {
      const res = await fetch(`/api/usuarios/${editando.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (res.ok) { setModal(false); fetchUsers(); }
      else { const e = await res.json(); setMsg(e.error||'Erro.'); }
    } else {
      const email = `mecanico-${Date.now()}@off.local`;
      const res = await fetch('/api/usuarios', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...body, email, password:'mecanico123', role:'MECANICO' }) });
      if (res.ok) { setModal(false); setForm({ nome:'', sobrenome:'', telefone:'' }); fetchUsers(); }
      else { const e = await res.json(); setMsg(e.error||'Erro.'); }
    }
  }

  const emAlmoco = users.filter(u => u.emAlmoco && u.active).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">MECANICOS</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.filter(u=>u.active).length} ativos {emAlmoco>0?`- ${emAlmoco} em almoco`:''}</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary inline-flex items-center gap-2 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Novo mecanico
        </button>
      </div>

      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : users.length===0 ? (
        <div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhum mecanico cadastrado.</p></div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Acoes</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      {u.name}
                      {u.emAlmoco && u.active && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Almoco</span>}
                    </div>
                  </td>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-800 mb-4">{editando?'Editar Mecanico':'Novo Mecanico'}</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}
            <div className="space-y-4">
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome *</label><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="input-field mt-1.5" placeholder="Ex: Joao"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Sobrenome</label><input value={form.sobrenome} onChange={e=>setForm({...form,sobrenome:e.target.value})} className="input-field mt-1.5" placeholder="Ex: Silva"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefone (opcional)</label><input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})} className="input-field mt-1.5" placeholder="(11) 99999-9999"/></div>
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
