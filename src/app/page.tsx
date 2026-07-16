'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PERFIS = [
  { id: 'DONO', label: 'Dono / Administrador', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'BALCAO_SERVICOS', label: 'Balcao de Servicos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'ESTOQUE_CENTRAL', label: 'Estoque Central', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'BALCAO_VENDA', label: 'Balcao de Venda', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
];

export default function LoginPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarEmail, setLembrarEmail] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('marquinho-saved-email');
    if (saved) { setEmail(saved); setLembrarEmail(true); }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil) { setError('Selecione um perfil.'); return; }
    setError(''); setLoading(true);
    if (lembrarEmail) localStorage.setItem('marquinho-saved-email', email);
    else localStorage.removeItem('marquinho-saved-email');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, perfil }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Usuario, senha ou perfil invalido.'); setLoading(false); return; }
      if (data.mustChangePassword) router.push('/trocar-senha');
      else router.push(data.redirectTo);
    } catch { setError('Erro de conexao. Tente novamente.'); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F6FB] p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-5 shadow-lg shadow-brand-600/25">
            <span className="text-white font-bold text-lg">MP</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Marquinho Moto Pecas</h1>
          <p className="text-xs text-slate-500 mt-1">Painel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-[13px] font-medium">{error}</div>}

          {/* Perfil selector */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Selecione o perfil</label>
            <div className="grid grid-cols-2 gap-2">
              {PERFIS.map(p => (
                <button key={p.id} type="button"
                  onClick={() => setPerfil(p.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                    perfil === p.id
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={p.icon} />
                  </svg>
                  <span className="text-[11px] font-semibold leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email ou usuario</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1.5" placeholder="seu@email.com" required autoFocus={!email} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Senha</label>
            <div className="relative mt-1.5">
              <input type={mostrarSenha ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10" placeholder="Sua senha" required autoFocus={!!email} />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                {mostrarSenha ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={lembrarEmail} onChange={(e) => setLembrarEmail(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-xs text-slate-500">Lembrar email neste computador</span>
          </label>

          <button type="submit" disabled={loading || !perfil} className="btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6">Sistema de gestao de oficina e estoque</p>
      </div>
    </div>
  );
}
