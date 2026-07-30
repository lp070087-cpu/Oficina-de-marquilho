'use client';

import { useState } from 'react';

export default function NewsletterVitrine() {
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function inscrever(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setLoading(true);
    await fetch('/api/vitrine/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, nome }),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 md:p-12 text-center text-white">
      <h2 className="text-2xl font-extrabold mb-2">Fique por dentro</h2>
      <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">Receba ofertas exclusivas, lançamentos e novidades direto no seu email.</p>
      {sent ? (
        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          <span className="text-sm font-bold">Inscrito com sucesso!</span>
        </div>
      ) : (
        <form onSubmit={inscrever} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-brand-400" />
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="Seu melhor email" className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-brand-400" />
          <button type="submit" disabled={loading} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-extrabold transition-colors whitespace-nowrap">
            {loading ? '...' : 'Inscrever'}
          </button>
        </form>
      )}
    </div>
  );
}
