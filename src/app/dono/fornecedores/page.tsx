'use client';

import { useState, useEffect } from 'react';

interface Fornecedor { id:string;nome:string;nomeFantasia?:string;cnpj?:string;telefone?:string;whatsapp?:string;email?:string;vendedor?:string;prazoMedioEntrega?:string;formaPagamento?:string;observacoes?:string;ativo:boolean; }

export default function FornecedoresPage() {
  const [forn, setForn] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Fornecedor|null>(null);
  const [form, setForm] = useState({ nome:'', nomeFantasia:'', cnpj:'', telefone:'', whatsapp:'', email:'', vendedor:'', prazoMedioEntrega:'', formaPagamento:'', observacoes:'' });
  const [msg, setMsg] = useState('');

  async function fetchAll() {
    const r = await fetch('/api/fornecedores');
    setForn(await r.json());
    setLoading(false);
  }
  useEffect(()=>{ fetchAll(); },[]);

  function abrirNovo() { setEditando(null); setForm({ nome:'', nomeFantasia:'', cnpj:'', telefone:'', whatsapp:'', email:'', vendedor:'', prazoMedioEntrega:'', formaPagamento:'', observacoes:'' }); setMsg(''); setModal(true); }
  function abrirEditar(f: Fornecedor) {
    setEditando(f);
    setForm({ nome:f.nome, nomeFantasia:f.nomeFantasia||'', cnpj:f.cnpj||'', telefone:f.telefone||'', whatsapp:f.whatsapp||'', email:f.email||'', vendedor:f.vendedor||'', prazoMedioEntrega:f.prazoMedioEntrega||'', formaPagamento:f.formaPagamento||'', observacoes:f.observacoes||'' });
    setMsg(''); setModal(true);
  }

  async function salvar() {
    if (!form.nome) { setMsg('Preencha o nome do fornecedor.'); return; }
    const url = editando ? `/api/fornecedores/${editando.id}` : '/api/fornecedores';
    const method = editando ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    if (r.ok) { setModal(false); fetchAll(); }
    else { const e = await r.json(); setMsg(e.error||'Erro.'); }
  }

  async function desativar(id: string) {
    if (!confirm('Desativar fornecedor?')) return;
    await fetch(`/api/fornecedores/${id}`, { method:'DELETE' });
    fetchAll();
  }

  const filter = forn.filter(f => !busca || f.nome.toLowerCase().includes(busca.toLowerCase()) || (f.cnpj||'').includes(busca));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">FORNECEDORES</h1>
          <p className="text-sm text-slate-500 mt-0.5">{forn.filter(f=>f.ativo).length} ativos</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary inline-flex items-center gap-2 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Novo fornecedor
        </button>
      </div>

      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ..." className="input-field max-w-md mb-4"/>

      {loading ? <p className="text-sm text-slate-400">Carregando...</p> : filter.length===0 ? (
        <div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhum fornecedor encontrado.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Fornecedor</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">CNPJ</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Contato</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Vendedor</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Prazo</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Acoes</th>
            </tr></thead>
            <tbody>{filter.map(f=>(
              <tr key={f.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${!f.ativo?'opacity-50':''}`}>
                <td className="py-2.5 px-3"><p className="font-medium text-slate-700">{f.nome}</p>{f.nomeFantasia&&<p className="text-xs text-slate-400">{f.nomeFantasia}</p>}</td>
                <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">{f.cnpj||'-'}</td>
                <td className="py-2.5 px-3 text-xs text-slate-500">{f.telefone||f.whatsapp||'-'}</td>
                <td className="py-2.5 px-3 text-xs text-slate-500">{f.vendedor||'-'}</td>
                <td className="py-2.5 px-3 text-xs text-slate-500">{f.prazoMedioEntrega||'-'}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`inline-flex items-center gap-1.5 ${f.ativo?'text-emerald-600':'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${f.ativo?'bg-emerald-500':'bg-slate-300'}`}/>
                    <span className="text-xs font-medium">{f.ativo?'Ativo':'Inativo'}</span>
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button onClick={()=>abrirEditar(f)} className="text-xs text-brand-600 hover:text-brand-700 font-medium mr-3">Editar</button>
                  {f.ativo && <button onClick={()=>desativar(f.id)} className="text-xs text-red-500 hover:text-red-700">Desativar</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 my-4">
            <h2 className="text-base font-bold text-slate-800 mb-4">{editando?'Editar Fornecedor':'Novo Fornecedor'}</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">{msg}</div>}
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase">Nome *</label><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Nome fantasia</label><input value={form.nomeFantasia} onChange={e=>setForm({...form,nomeFantasia:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">CNPJ</label><input value={form.cnpj} onChange={e=>setForm({...form,cnpj:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Telefone</label><input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">WhatsApp</label><input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Email</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Vendedor</label><input value={form.vendedor} onChange={e=>setForm({...form,vendedor:e.target.value})} className="input-field mt-1.5"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Prazo medio</label><input value={form.prazoMedioEntrega} onChange={e=>setForm({...form,prazoMedioEntrega:e.target.value})} className="input-field mt-1.5" placeholder="Ex: 3 dias"/></div>
              <div><label className="text-xs font-semibold text-slate-600 uppercase">Forma pagamento</label><input value={form.formaPagamento} onChange={e=>setForm({...form,formaPagamento:e.target.value})} className="input-field mt-1.5" placeholder="Ex: Boleto 30 dias"/></div>
              <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase">Observacoes</label><textarea value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})} className="input-field mt-1.5" rows={2}/></div>
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
