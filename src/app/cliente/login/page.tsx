'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoOficina from '@/components/LogoOficina';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ClienteLoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<'login'|'cadastro'>('login');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [modeloMoto, setModeloMoto] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const r = await fetch('/api/cliente/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone, password,
          ...(modo === 'cadastro' ? {
            nome, email: email || null, cpf: cpf || null,
            whatsapp: whatsapp || null,
            dataNascimento: dataNascimento || null,
            modeloMoto: modeloMoto || null,
            endereco: endereco || null, cidade: cidade || null,
            estado: estado || null, cep: cep || null,
          } : {}),
        }),
      });

      const data = await r.json();

      if (r.ok) {
        sessionStorage.setItem('marquinho-cliente', JSON.stringify({
          ...data.cliente,
          token: data.token,
        }));
        router.push('/cliente');
      } else {
        setMsg(data.error || 'Erro ao autenticar.');
      }
    } catch {
      setMsg('Erro de conexão.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <LogoOficina className="w-14 h-14 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-600/20 overflow-hidden" textClassName="text-white font-extrabold text-lg" />
          <h1 className="text-xl font-extrabold text-slate-800">{modo === 'login' ? 'Entrar' : 'Criar Conta'}</h1>
          <p className="text-xs text-slate-400 mt-1">Portal do Cliente — Marquinho Moto Peças</p>
        </div>

        {msg && (
          <div className={`px-4 py-3 rounded-lg text-xs mb-4 font-medium ${msg.includes('sucesso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          {/* Campos comuns */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold">Telefone *</label>
            <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999" required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold">Senha *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Sua senha" required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
          </div>

          {/* Cadastro — campos extras */}
          {modo === 'cadastro' && (
            <>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">Nome completo *</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome" required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">CPF</label>
                  <input type="text" value={cpf} onChange={e => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp</label>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Data de Nascimento</label>
                  <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Modelo da Moto</label>
                  <input type="text" value={modeloMoto} onChange={e => setModeloMoto(e.target.value)}
                    placeholder="Honda CG 160"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">CEP</label>
                <input type="text" value={cep} onChange={e => setCep(e.target.value)}
                  placeholder="00000-000" maxLength={9}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">Endereço</label>
                <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
                  placeholder="Rua, número, complemento"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Cidade</label>
                  <input type="text" value={cidade} onChange={e => setCidade(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Estado</label>
                  <input type="text" value={estado} onChange={e => setEstado(e.target.value)}
                    placeholder="SP" maxLength={2}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 mt-1" />
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-extrabold transition-colors shadow-lg shadow-brand-600/20">
            {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          {modo === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setMsg(''); }}
            className="text-brand-600 font-bold hover:underline">
            {modo === 'login' ? 'Criar conta' : 'Fazer login'}
          </button>
        </p>
      </div>
    </div>
  );
}
