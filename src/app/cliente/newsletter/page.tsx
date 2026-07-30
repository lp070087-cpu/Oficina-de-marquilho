'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClienteNewsletterPage() {
  const router = useRouter();
  const [ativo, setAtivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    fetch('/api/cliente/newsletter', { headers: { Authorization: `Bearer ${JSON.parse(c).token}` } })
      .then(r => r.json()).then(d => setAtivo(d.ativo)).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  async function toggle() {
    const c = JSON.parse(sessionStorage.getItem('marquinho-cliente') || '{}');
    const novo = !ativo;
    const r = await fetch('/api/cliente/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.token}` },
      body: JSON.stringify({ ativo: novo }),
    });
    if (r.ok) {
      setAtivo(novo);
      setMsg(novo ? '✓ Você se inscreveu na newsletter!' : 'Você saiu da newsletter.');
    }
    setTimeout(() => setMsg(''), 3000);
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">Newsletter</h1>

      {msg && (
        <div className="px-4 py-3 rounded-lg text-xs bg-brand-50 text-brand-700 border border-brand-200 font-medium">{msg}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-slate-700">Receber ofertas e novidades</p>
            <p className="text-xs text-slate-400 mt-1">
              {ativo ? 'Você está inscrito na newsletter.' : 'Você não está recebendo nossa newsletter.'}
            </p>
          </div>
          <button onClick={toggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400">
          Ao se inscrever, você receberá emails sobre promoções, novos produtos e cupons exclusivos.
          Você pode cancelar a qualquer momento.
        </p>
      </div>
    </div>
  );
}
