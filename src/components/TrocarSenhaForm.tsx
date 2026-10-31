'use client';

import { useState } from 'react';
import LoginLayout from '@/components/LoginLayout';

export default function TrocarSenhaForm() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    if (novaSenha !== confirmacao) { setErro('A confirmação não confere com a nova senha.'); return; }
    setSalvando(true); setErro('');
    try {
      const r = await fetch('/api/auth/trocar-senha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senhaAtual, novaSenha }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || 'Não foi possível trocar a senha.');
      window.location.href = body.redirectTo;
    } catch (e) { setErro((e as Error).message); setSalvando(false); }
  }

  return (
    <LoginLayout subtitulo="Troca de senha obrigatória">
      <form onSubmit={salvar} className="space-y-4 rounded-xl border border-slate-200/70 border-t-4 border-t-brand-600 bg-white/70 p-6 shadow-sm">
        <p className="text-[13px] text-slate-600">Sua senha é temporária. Crie uma senha pessoal com ao menos 8 caracteres para continuar.</p>
        {erro && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">{erro}</p>}
        <div>
          <label htmlFor="senha-atual" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Senha temporária</label>
          <input id="senha-atual" type="password" autoComplete="current-password" autoFocus required value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className="input-field mt-1.5" />
        </div>
        <div>
          <label htmlFor="nova-senha" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Nova senha</label>
          <input id="nova-senha" type="password" autoComplete="new-password" required minLength={8} value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className="input-field mt-1.5" />
        </div>
        <div>
          <label htmlFor="confirmar-senha" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Confirmar nova senha</label>
          <input id="confirmar-senha" type="password" autoComplete="new-password" required value={confirmacao} onChange={e => setConfirmacao(e.target.value)} className="input-field mt-1.5" />
        </div>
        <button disabled={salvando} className="btn-primary w-full">{salvando ? 'Salvando...' : 'Salvar nova senha'}</button>
      </form>
    </LoginLayout>
  );
}
