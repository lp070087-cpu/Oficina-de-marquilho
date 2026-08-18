'use client';

import { useState, useEffect } from 'react';
import { getClienteVitrine } from '@/lib/vitrine-session';

export default function PerguntasProduto({ pecaId }: { pecaId: string }) {
  const [perguntas, setPerguntas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaPergunta, setNovaPergunta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/vitrine/perguntas?pecaId=${pecaId}`).then(r => r.json()).then(d => {
      setPerguntas(d.perguntas || []);
      setLoading(false);
    });
  }, [pecaId]);

  async function enviar() {
    if (!novaPergunta.trim()) return;
    const cliente = getClienteVitrine();
    if (!cliente) { setMsg('Faça login para perguntar.'); return; }
    const { token } = cliente;
    setEnviando(true);
    const r = await fetch('/api/vitrine/perguntas', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pecaId, texto: novaPergunta }),
    });
    if (r.ok) {
      const p = await r.json();
      setPerguntas(prev => [p, ...prev]);
      setNovaPergunta('');
      setMsg('Pergunta enviada!');
    } else {
      const e = await r.json();
      setMsg(e.error || 'Erro.');
    }
    setEnviando(false);
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div>
      {/* Form */}
      <div className="mb-5">
        <label className="text-xs font-bold text-slate-700 block mb-2">Tem alguma dúvida? Pergunte aqui:</label>
        <textarea value={novaPergunta} onChange={e => setNovaPergunta(e.target.value)} className="input-field text-xs" rows={2} placeholder="Ex: Este produto serve na CG 160 2020?" />
        <div className="flex items-center justify-between mt-2">
          <button onClick={enviar} disabled={enviando || !novaPergunta.trim()} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
            {enviando ? 'Enviando...' : 'Perguntar'}
          </button>
          {msg && <span className="text-[11px] text-slate-500">{msg}</span>}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-4"><div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>
      ) : perguntas.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">Nenhuma pergunta ainda. Seja o primeiro a perguntar!</p>
      ) : (
        <div className="space-y-3">
          {perguntas.map((p: any) => (
            <div key={p.id} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-base">❓</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">{p.texto}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.cliente.nome} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              {p.respostas.length > 0 && (
                <div className="ml-6 pl-4 border-l-2 border-brand-200 space-y-2 mt-2">
                  {p.respostas.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-2">
                      <span className="text-base">💬</span>
                      <div>
                        <p className="text-xs text-slate-600">{r.texto}</p>
                        <p className="text-[9px] text-brand-500 mt-0.5 font-medium">Marquinho · {new Date(r.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
