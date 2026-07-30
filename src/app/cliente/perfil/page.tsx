'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientePerfilPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirma, setSenhaConfirma] = useState('');
  const [senhaMsg, setSenhaMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    fetch('/api/cliente/perfil', { headers: { Authorization: `Bearer ${JSON.parse(c).token}` } })
      .then(r => r.json()).then(d => { setPerfil(d); setForm(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  async function salvar() {
    const c = JSON.parse(sessionStorage.getItem('marquinho-cliente') || '{}');
    const r = await fetch('/api/cliente/perfil', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.token}` },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      const d = await r.json();
      setPerfil(d); setEditando(false);
      setMsg('✓ Perfil atualizado com sucesso!');
      setTimeout(() => setMsg(''), 3000);
    }
  }

  async function alterarSenha() {
    setSenhaMsg('');
    if (senhaNova !== senhaConfirma) { setSenhaMsg('Senhas não conferem'); return; }
    if (senhaNova.length < 6) { setSenhaMsg('Mínimo 6 caracteres'); return; }
    const c = JSON.parse(sessionStorage.getItem('marquinho-cliente') || '{}');
    const r = await fetch('/api/cliente/perfil', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.token}` },
      body: JSON.stringify({ senhaAtual, novaSenha: senhaNova }),
    });
    if (r.ok) {
      setSenhaMsg('✓ Senha alterada com sucesso!');
      setSenhaAtual(''); setSenhaNova(''); setSenhaConfirma('');
      setTimeout(() => setSenhaMsg(''), 3000);
    } else {
      const { error } = await r.json().catch(() => ({ error: 'Erro ao alterar senha' }));
      setSenhaMsg(error || 'Erro ao alterar senha');
    }
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-extrabold text-slate-800">Meu Perfil</h1>

      {msg && (
        <div className="px-4 py-3 rounded-lg text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">{msg}</div>
      )}

      {/* Dados pessoais */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-slate-700">Dados Pessoais</h2>
          {!editando ? (
            <button onClick={() => setEditando(true)}
              className="px-3 py-1.5 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-lg">
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => { setEditando(false); setForm({ ...perfil }); }}
                className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-lg">Cancelar</button>
              <button onClick={salvar}
                className="px-3 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700">Salvar</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'nome', label: 'Nome completo', type: 'text' },
            { key: 'cpf', label: 'CPF', type: 'text' },
            { key: 'telefone', label: 'Telefone', type: 'text' },
            { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
            { key: 'email', label: 'E-mail', type: 'email' },
            { key: 'dataNascimento', label: 'Data de nascimento', type: 'date' },
            { key: 'modeloMoto', label: 'Modelo da Moto', type: 'text' },
            { key: 'cep', label: 'CEP', type: 'text' },
            { key: 'endereco', label: 'Endereço', type: 'text' },
            { key: 'cidade', label: 'Cidade', type: 'text' },
            { key: 'estado', label: 'Estado', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</label>
              {editando ? (
                <input type={f.type} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-brand-400" />
              ) : (
                <p className="text-sm text-slate-700 mt-1">
                  {f.key === 'dataNascimento' && perfil[f.key]
                    ? new Date(perfil[f.key]).toLocaleDateString('pt-BR')
                    : perfil[f.key] || <span className="text-slate-300 italic">Não informado</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alterar senha */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-extrabold text-slate-700 mb-4">Alterar Senha</h2>

        {senhaMsg && (
          <div className={`px-4 py-3 rounded-lg text-xs mb-3 font-medium ${senhaMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {senhaMsg}
          </div>
        )}

        <div className="space-y-3 max-w-sm">
          <div>
            <label className="text-[11px] font-bold text-slate-500">Senha atual</label>
            <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500">Nova senha</label>
            <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500">Confirmar nova senha</label>
            <input type="password" value={senhaConfirma} onChange={e => setSenhaConfirma(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <button onClick={alterarSenha}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700">
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  );
}
