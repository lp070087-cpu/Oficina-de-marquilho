'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setClienteVitrine } from '@/lib/vitrine-session';

export default function VitrineLogin() {
  const router = useRouter();
  const [isCadastro, setIsCadastro] = useState(false);
  const [form, setForm] = useState({ nome: '', sobrenome: '', telefone: '', email: '', password: '', modeloMoto: '' });
  const [manterConectado, setManterConectado] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  // Item 9 — redireciona de volta para onde o cliente estava (ex: /vitrine/checkout)
  // após login/cadastro. Só aceita caminhos internos (evita open redirect).
  const [redirect, setRedirect] = useState('/vitrine/carrinho');
  useEffect(() => {
    try {
      const r = new URLSearchParams(window.location.search).get('redirect');
      if (r && r.startsWith('/vitrine/')) setRedirect(r);
    } catch { /* ignora */ }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      // Login SOMENTE por email + senha (correção da DONA). Cadastro: nome+sobrenome+telefone+email+senha.
      const body = isCadastro
        ? {
            nome: form.nome, sobrenome: form.sobrenome, telefone: form.telefone,
            email: form.email, password: form.password, modeloMoto: form.modeloMoto || null,
          }
        : { email: form.email.trim(), password: form.password };
      const r = await fetch('/api/vitrine/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const { token, cliente } = await r.json();
        // "Manter conectado" REAL: checked → localStorage (persiste); unchecked → sessionStorage.
        setClienteVitrine({
          id: cliente.id, nome: cliente.nome, telefone: cliente.telefone,
          email: cliente.email || null, modeloMoto: cliente.modeloMoto, token,
        }, manterConectado);
        router.push(redirect);
      } else {
        const e = await r.json();
        setMsg(e.error || 'Erro.');
      }
    } catch {
      setMsg('Erro de conexão.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={() => router.push('/vitrine')} className="text-xs text-slate-400 hover:text-slate-600 mb-4 inline-block">← Voltar</button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-600/25"><span className="text-white font-extrabold text-lg">MP</span></div>
          <h1 className="text-lg font-extrabold text-slate-800">Marquinho Moto Peças</h1>
          <p className="text-xs text-slate-500 mt-0.5">{isCadastro ? 'Crie sua conta' : 'Acesse sua conta'}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs">{msg}</div>}

          {isCadastro && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nome</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="input-field mt-1.5" placeholder="Nome" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sobrenome</label>
                <input value={form.sobrenome} onChange={e => setForm({ ...form, sobrenome: e.target.value })} className="input-field mt-1.5" placeholder="Sobrenome" required />
              </div>
            </div>
          )}

          {/* Login: SOMENTE email + senha. Cadastro: email obrigatório + telefone. */}
          {!isCadastro && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field mt-1.5" placeholder="seu@email.com" required />
            </div>
          )}

          {isCadastro && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field mt-1.5" placeholder="seu@email.com" required />
            </div>
          )}

          {isCadastro && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Telefone / WhatsApp</label>
              <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="input-field mt-1.5" placeholder="(11) 99999-9999" required />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Senha</label>
            <div className="relative mt-1.5">
              <input
                type={verSenha ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field pr-10"
                placeholder="Mínimo 4 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setVerSenha(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {verSenha ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-2.209m5.857-2.533A9.98 9.98 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.972 9.972 0 01-3.315 4.528M3 3l18 18"/></svg>
                )}
              </button>
            </div>
          </div>

          {isCadastro && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Modelo da moto</label>
              <input value={form.modeloMoto} onChange={e => setForm({ ...form, modeloMoto: e.target.value })} className="input-field mt-1.5" placeholder="Ex: CG 160" />
            </div>
          )}

          {!isCadastro && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manterConectado}
                  onChange={e => setManterConectado(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Manter conectado
              </label>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-extrabold uppercase tracking-wider transition-colors">
            {loading ? 'Carregando...' : isCadastro ? 'Criar conta' : 'Entrar'}
          </button>

          {!isCadastro && (
            <p className="text-center text-[11px] text-slate-400">
              Esqueceu a senha? Fale com a loja no{' '}
              <a href="https://wa.me/558198143879" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:underline">WhatsApp</a>.
            </p>
          )}

          <button type="button" onClick={() => setIsCadastro(!isCadastro)} className="w-full text-xs text-brand-600 hover:text-brand-700 font-bold">
            {isCadastro ? 'Já tenho conta' : 'Criar nova conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
