'use client';

import { useState } from 'react';
import LoginLayout from '@/components/LoginLayout';

export default function EntradaAtendimento() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (entrando || !senha) return;
    setEntrando(true); setErro('');
    try {
      const r = await fetch('/api/auth/atendimento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || 'Não foi possível entrar.');
      window.location.href = body.redirectTo;
    } catch (e) { setErro((e as Error).message); setSenha(''); setEntrando(false); }
  }

  return (
    <LoginLayout subtitulo="Atendimento">
      <form onSubmit={entrar} className="space-y-4 rounded-2xl border border-slate-200 border-t-4 border-t-brand-600 bg-white p-6 text-center shadow-lg shadow-slate-900/5 sm:p-7">
        {erro && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{erro}</p>}
        <div>
          <label htmlFor="senha-atendimento" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Sua senha individual</label>
          <input id="senha-atendimento" type="password" autoComplete="current-password" autoFocus value={senha} onChange={e => setSenha(e.target.value)} className="input-field mt-1.5" placeholder="Digite sua senha" />
        </div>
        <button disabled={entrando || !senha} className="btn-primary w-full">{entrando ? 'Entrando...' : 'Entrar'}</button>
        <a href="/" className="block text-center text-[13px] font-medium text-brand-600 hover:underline">Acesso administrativo</a>
        <p className="text-[12px] text-slate-500">Esqueceu a senha? Peça à administração (DONA) para redefinir seu acesso.</p>
      </form>
    </LoginLayout>
  );
}
