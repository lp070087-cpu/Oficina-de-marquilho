'use client';

import { useState, useEffect } from 'react';

interface User { id:string;name:string;email:string;username?:string;role:string;active:boolean;tipoBalcao?:string;lastLoginAt?:string;mustChangePassword?:boolean;lockedUntil?:string; }

function gerarSenhaTemporaria(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default function BalcoesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [modalReset, setModalReset] = useState<User | null>(null);
  const [editando, setEditando] = useState<User|null>(null);
  const [form, setForm] = useState({ name:'',email:'',username:'',password:'',tipoBalcao:'' });
  const [novaSenha, setNovaSenha] = useState('');
  const [forcarTroca, setForcarTroca] = useState(false);
  const [msg, setMsg] = useState('');

  async function fetchUsers() {
    const res = await fetch('/api/usuarios');
    const data = await res.json();
    setUsers(data.filter((u:User) => (u.role==='BALCAO'||u.role==='ESTOQUE'||u.role==='MECANICO') && u.active));
    setLoading(false);
  }
  useEffect(()=>{fetchUsers();},[]);

  function abrirNovo() { setEditando(null); setForm({ name:'',email:'',username:'',password:'',tipoBalcao:'' }); setMsg(''); setModal(true); }
  function abrirEditar(u:User) { setEditando(u); setForm({ name:u.name,email:u.email,username:u.username||'',password:'',tipoBalcao:u.tipoBalcao||'' }); setMsg(''); setModal(true); }
  function abrirReset(u:User) { setModalReset(u); setNovaSenha(''); setForcarTroca(false); setMsg(''); }

  async function salvar() {
    if (!form.name||!form.email) { setMsg('Preencha nome e email.'); return; }
    if (editando) {
      const body:any = { name:form.name, username:form.username||null, tipoBalcao:form.tipoBalcao||null };
      if (form.password) body.password = form.password;
      const res = await fetch(`/api/usuarios/${editando.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (res.ok) { setModal(false); fetchUsers(); }
      else { const e = await res.json(); setMsg(e.error||'Erro.'); }
    } else {
      if (!form.password) { setMsg('Defina uma senha.'); return; }
      let role = 'BALCAO';
      if (form.tipoBalcao === 'ESTOQUE_CENTRAL') role = 'ESTOQUE';
      const res = await fetch('/api/usuarios', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, role, createdBy:'DONO' }) });
      if (res.ok) { setModal(false); setForm({ name:'',email:'',username:'',password:'',tipoBalcao:'' }); fetchUsers(); }
      else { const e = await res.json(); setMsg(e.error||'Erro.'); }
    }
  }

  async function toggleActive(id:string) {
    await fetch(`/api/usuarios/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ active: false }) });
    fetchUsers();
  }

  async function toggleBlock(u:User) {
    if (u.lockedUntil) {
      await fetch(`/api/usuarios/${u.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ lockedUntil: null, failedLoginAttempts: 0 }) });
    } else {
      await fetch(`/api/usuarios/${u.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ lockedUntil: new Date(Date.now()+30*60000).toISOString() }) });
    }
    fetchUsers();
  }

  async function redefinirSenha() {
    if (!modalReset||!novaSenha) { setMsg('Digite a nova senha.'); return; }
    const body:any = { password: novaSenha };
    if (forcarTroca) body.mustChangePassword = true;
    const res = await fetch(`/api/usuarios/${modalReset.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { setModalReset(null); fetchUsers(); }
    else { const e = await res.json(); setMsg(e.error||'Erro.'); }
  }

  function gerarESalvar() {
    setNovaSenha(gerarSenhaTemporaria());
    setForcarTroca(true);
    setMsg('');
  }

  const tipoLabel: Record<string,string> = { SERVICOS:'Balcao Servicos', ESTOQUE_CENTRAL:'Estoque Central', VENDA_LOJA:'Balcao Venda' };
  const filter = users.filter(u=>!busca||u.name.toLowerCase().includes(busca.toLowerCase())||(u.email||'').includes(busca));
  const ativos = users.filter(u=>u.active).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-slate-800 tracking-tight">FUNCIONARIOS</h1><p className="text-sm text-slate-500 mt-0.5">{ativos} ativos</p></div>
        <button onClick={abrirNovo} className="btn-primary inline-flex items-center gap-2 text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Novo funcionario</button>
      </div>

      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." className="input-field max-w-md mb-4"/>

      {loading?<p className="text-sm text-slate-400">Carregando...</p>:filter.length===0?(<div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhum funcionario cadastrado.</p></div>):(
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Login</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Perfil</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Ultimo acesso</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Acoes</th>
            </tr></thead>
            <tbody>{filter.map(u=>(
              <tr key={u.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${!u.active?'opacity-50':''}`}>
                <td className="py-2.5 px-3"><p className="font-medium text-slate-700">{u.name}</p>{u.mustChangePassword&&<span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Trocar senha</span>}</td>
                <td className="py-2.5 px-3 text-xs text-slate-500">{u.email}</td>
                <td className="py-2.5 px-3 text-xs"><span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">{tipoLabel[u.tipoBalcao||'']||u.role}</span></td>
                <td className="py-2.5 px-3 text-xs text-slate-400">{u.lastLoginAt?new Date(u.lastLoginAt).toLocaleDateString('pt-BR'):'-'}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-flex items-center gap-1.5 ${u.lockedUntil?'text-red-500':u.active?'text-emerald-600':'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.lockedUntil?'bg-red-500':u.active?'bg-emerald-500':'bg-slate-300'}`}/>
                    <span className="text-xs font-medium">{u.lockedUntil?'Bloqueado':u.active?'Ativo':'Inativo'}</span>
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    <button onClick={()=>abrirEditar(u)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Editar</button>
                    <button onClick={()=>abrirReset(u)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Senha</button>
                    <button onClick={()=>toggleBlock(u)} className={`text-xs font-medium ${u.lockedUntil?'text-emerald-600 hover:text-emerald-700':'text-orange-600 hover:text-orange-700'}`}>{u.lockedUntil?'Desbloq.':'Bloq.'}</button>
                    <button onClick={()=>toggleActive(u.id)} className={`text-xs font-medium ${u.active?'text-red-500 hover:text-red-700':'text-emerald-600 hover:text-emerald-700'}`}>{u.active?'Desat.':'Ativar'}</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 my-4">
            <h2 className="text-base font-bold text-slate-800 mb-4">{editando?'Editar Funcionario':'Novo Funcionario'}</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}
            <div className="space-y-4">
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Nome *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Email de login *</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field mt-1.5" disabled={!!editando}/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Usuario (opcional)</label><input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} className="input-field mt-1.5"/></div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Perfil</label>
                <select value={form.tipoBalcao} onChange={e=>setForm({...form,tipoBalcao:e.target.value})} className="input-field mt-1.5">
                  <option value="">Selecionar...</option>
                  <option value="SERVICOS">Balcao de Servicos</option>
                  <option value="ESTOQUE_CENTRAL">Estoque Central</option>
                  <option value="VENDA_LOJA">Balcao de Venda</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">{editando?'Nova senha (deixe vazio para manter)':'Senha de acesso *'}</label>
                <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-field mt-1.5" placeholder={editando?'Manter atual':'Senha'}/>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button onClick={()=>setModal(false)} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={salvar} className="btn-primary text-xs">{editando?'Salvar':'Criar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal redefinir senha */}
      {modalReset && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 my-4">
            <h2 className="text-base font-bold text-slate-800 mb-3">Redefinir Senha — {modalReset.name}</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Nova senha</label>
                <input type="text" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} className="input-field mt-1.5 font-mono" placeholder="Digite ou gere automaticamente"/>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input type="checkbox" checked={forcarTroca} onChange={e=>setForcarTroca(e.target.checked)} className="rounded"/> Forcar troca no proximo login
              </label>
              <button onClick={gerarESalvar} className="btn-secondary text-xs w-full">Gerar senha temporaria</button>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button onClick={()=>setModalReset(null)} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={redefinirSenha} className="btn-primary text-xs">Salvar nova senha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
