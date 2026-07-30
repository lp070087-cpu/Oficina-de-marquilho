'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClienteSegurancaPage() {
  const router = useRouter();
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [ultimoLogin, setUltimoLogin] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    fetch('/api/cliente/seguranca', { headers: { Authorization: `Bearer ${JSON.parse(c).token}` } })
      .then(r => r.json()).then(d => { setSessoes(d.sessoes || []); setUltimoLogin(d.ultimoLogin || ''); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  async function encerrarSessao(id: string) {
    const c = JSON.parse(sessionStorage.getItem('marquinho-cliente') || '{}');
    const r = await fetch(`/api/cliente/seguranca?id=${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${c.token}` },
    });
    if (r.ok) {
      setSessoes(prev => prev.filter(s => s.id !== id));
      setMsg(`✓ Sessão encerrada`);
      setTimeout(() => setMsg(''), 3000);
    }
  }

  async function encerrarTodas() {
    if (!confirm('Isso vai encerrar todas as outras sessões. Continuar?')) return;
    const c = JSON.parse(sessionStorage.getItem('marquinho-cliente') || '{}');
    const sessaoAtual = sessoes.find(s => s.ativo && !s._skip);
    const outras = sessoes.filter(s => s.ativo && s.id !== sessaoAtual?.id);
    for (const s of outras) {
      await fetch(`/api/cliente/seguranca?id=${s.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${c.token}` },
      });
    }
    setSessoes(prev => prev.filter(s => !s.ativo || s.id === sessaoAtual?.id));
    setMsg(`✓ ${outras.length} sessão(ões) encerrada(s)`);
    setTimeout(() => setMsg(''), 3000);
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const sessaoAtual = JSON.parse(sessionStorage.getItem('marquinho-cliente') || '{}');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-extrabold text-slate-800">Segurança</h1>

      {msg && (
        <div className="px-4 py-3 rounded-lg text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">{msg}</div>
      )}

      {/* Último login */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-extrabold text-slate-700 mb-3">Informações de Acesso</h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Último login</span>
            <span className="text-slate-600">{ultimoLogin ? new Date(ultimoLogin).toLocaleString('pt-BR') : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Senha</span>
            <span className="text-slate-600">••••••••</span>
          </div>
        </div>
      </div>

      {/* Sessões ativas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-700">Sessões Ativas</h2>
            <p className="text-[10px] text-slate-400 mt-1">Dispositivos conectados à sua conta</p>
          </div>
          {sessoes.filter(s => s.ativo).length > 1 && (
            <button onClick={encerrarTodas}
              className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg">
              Encerrar todas
            </button>
          )}
        </div>

        {sessoes.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">Nenhuma sessão registrada</p>
        ) : (
          <div className="space-y-2">
            {sessoes.map((s, i) => {
              const isCurrent = i === 0; // primeira sessão é a atual
              return (
                <div key={s.id} className={`flex items-center justify-between py-3 px-4 rounded-lg ${isCurrent ? 'bg-brand-50 border border-brand-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-400'}`}>
                      {s.userAgent?.includes('Mobile') || s.userAgent?.includes('Android') || s.userAgent?.includes('iPhone')
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-700">
                          {s.userAgent?.includes('Mobile') || s.userAgent?.includes('Android') || s.userAgent?.includes('iPhone') ? 'Celular' : 'Computador'}
                        </p>
                        {isCurrent && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Atual</span>}
                        {!s.ativo && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600">Encerrada</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.ip || 'IP desconhecido'}</p>
                      <p className="text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  {!isCurrent && s.ativo && (
                    <button onClick={() => encerrarSessao(s.id)}
                      className="px-2 py-1 text-[11px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                      Encerrar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
