'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VitrineLogin() {
  const router = useRouter();
  const [isCadastro, setIsCadastro] = useState(false);
  const [form, setForm] = useState({ nome:'',telefone:'',email:'',password:'',modeloMoto:'' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit(e:React.FormEvent){e.preventDefault();setLoading(true);setMsg('');
    try{
      const body=isCadastro?{nome:form.nome,telefone:form.telefone,email:form.email||null,password:form.password,modeloMoto:form.modeloMoto||null}:{nome:'',telefone:form.telefone,password:form.password};
      const r=await fetch('/api/vitrine/clientes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(r.ok){const{cliente}=await r.json();sessionStorage.setItem('marquinho-cliente',JSON.stringify({id:cliente.id,nome:cliente.nome,telefone:cliente.telefone,modeloMoto:cliente.modeloMoto}));router.push('/vitrine/carrinho');}
      else{const e=await r.json();setMsg(e.error||'Erro.');}
    }catch{setMsg('Erro de conexao.');}
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={()=>router.push('/vitrine')} className="text-xs text-slate-400 hover:text-slate-600 mb-4 inline-block">← Voltar</button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-600/25"><span className="text-white font-extrabold text-lg">MP</span></div>
          <h1 className="text-lg font-extrabold text-slate-800">Marquinho Moto Pecas</h1>
          <p className="text-xs text-slate-500 mt-0.5">{isCadastro?'Crie sua conta':'Acesse sua conta'}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs">{msg}</div>}
          {isCadastro&&<div><label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nome</label><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="input-field mt-1.5" required/></div>}
          <div><label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Telefone / WhatsApp</label><input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})} className="input-field mt-1.5" placeholder="(11) 99999-9999" required/></div>
          {isCadastro&&<div><label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email (opcional)</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field mt-1.5"/></div>}
          <div><label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Senha</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-field mt-1.5" placeholder="Minimo 4 caracteres" required/></div>
          {isCadastro&&<div><label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Modelo da moto</label><input value={form.modeloMoto} onChange={e=>setForm({...form,modeloMoto:e.target.value})} className="input-field mt-1.5" placeholder="Ex: CG 160"/></div>}
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-extrabold uppercase tracking-wider transition-colors">{loading?'Carregando...':isCadastro?'Criar conta':'Entrar'}</button>
          <button type="button" onClick={()=>setIsCadastro(!isCadastro)} className="w-full text-xs text-brand-600 hover:text-brand-700 font-bold">{isCadastro?'Ja tenho conta':'Criar nova conta'}</button>
        </form>
      </div>
    </div>
  );
}
