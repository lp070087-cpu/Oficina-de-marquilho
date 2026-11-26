'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Alteracao = 'email' | 'senha';
type Retorno = { tipo: Alteracao; mensagem: string; erro: boolean };
const campo = 'input-field block w-full';

function CampoSenha({ id, nome, titulo, nova = false }: { id: string; nome: string; titulo: string; nova?: boolean }) {
  const [visivel, setVisivel] = useState(false);
  const acao = visivel ? 'Ocultar' : 'Mostrar';

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{titulo}</label>
      <div className="relative">
        <input id={id} name={nome} type={visivel ? 'text' : 'password'} autoComplete={nova ? 'new-password' : 'current-password'}
          minLength={nova ? 8 : undefined} required className={`${campo} pr-12`} />
        <button type="button" onClick={() => setVisivel(v => !v)}
          aria-label={`${acao} ${titulo.toLowerCase()}`} aria-controls={id} aria-pressed={visivel}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5" aria-hidden="true">
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
            <circle cx="12" cy="12" r="2.5" />
            {visivel && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function FormulariosConta({ email }: { email: string }) {
  const router = useRouter();
  const [pendente, setPendente] = useState<Alteracao | null>(null);
  const [retorno, setRetorno] = useState<Retorno | null>(null);
  const [versaoCampos, setVersaoCampos] = useState(0);

  async function salvar(event: FormEvent<HTMLFormElement>, tipo: Alteracao) {
    event.preventDefault();
    if (pendente) return;
    const formulario = event.currentTarget;
    const dados = new FormData(formulario);
    const senhaAtual = dados.get('senhaAtual');
    const novaSenha = dados.get('novaSenha');
    const confirmarSenha = dados.get('confirmarSenha');

    if (tipo === 'senha' && novaSenha !== confirmarSenha) {
      setRetorno({ tipo, mensagem: 'A confirmação precisa ser igual à nova senha.', erro: true });
      return;
    }

    setPendente(tipo);
    setRetorno(null);
    try {
      const response = await fetch('/api/auth/minha-conta', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipo === 'email'
          ? { tipo, senhaAtual, novoEmail: dados.get('novoEmail') }
          : { tipo, senhaAtual, novaSenha, confirmarSenha }),
      });
      const resultado = await response.json();
      if (!response.ok) {
        setRetorno({ tipo, mensagem: resultado.error || 'Não foi possível salvar a alteração.', erro: true });
        return;
      }

      if (tipo === 'email') {
        try {
          const anterior = localStorage.getItem('marquinho-saved-email');
          if (localStorage.getItem('marquinho-saved-perfil') === 'DONO' && anterior?.toLowerCase() === email.toLowerCase()) {
            localStorage.setItem('marquinho-saved-email', resultado.email);
          }
        } catch { /* A preferência de login é opcional. */ }
      }
      formulario.reset();
      setVersaoCampos(versao => versao + 1);
      setRetorno({ tipo, mensagem: resultado.mensagem, erro: false });
      router.refresh();
    } catch {
      setRetorno({ tipo, mensagem: 'Não foi possível conectar ao sistema. Tente novamente.', erro: true });
    } finally {
      setPendente(null);
    }
  }

  function feedback(tipo: Alteracao) {
    if (retorno?.tipo !== tipo) return null;
    return <p role={retorno.erro ? 'alert' : 'status'} className={`text-sm ${retorno.erro ? 'text-red-700' : 'text-emerald-700'}`}>{retorno.mensagem}</p>;
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <form className="card min-w-0 space-y-4 p-4 sm:p-6" onSubmit={e => salvar(e, 'email')} aria-labelledby="alterar-email">
        <h2 id="alterar-email" className="text-base font-semibold text-slate-900">Alterar e-mail</h2>
        <div className="space-y-1.5">
          <label htmlFor="email-atual" className="block text-sm font-medium text-slate-700">E-mail atual</label>
          <input id="email-atual" type="email" value={email} readOnly className={`${campo} bg-slate-50 text-slate-600`} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="novo-email" className="block text-sm font-medium text-slate-700">Novo e-mail</label>
          <input id="novo-email" name="novoEmail" type="email" autoComplete="email" maxLength={254} required className={campo} />
        </div>
        <CampoSenha key={`email-${versaoCampos}`} id="senha-atual-email" nome="senhaAtual" titulo="Senha atual" />
        {feedback('email')}
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pendente !== null}>
          {pendente === 'email' ? 'Salvando...' : 'Salvar alteração'}
        </button>
      </form>
      <form className="card min-w-0 space-y-4 p-4 sm:p-6" onSubmit={e => salvar(e, 'senha')} aria-labelledby="alterar-senha">
        <h2 id="alterar-senha" className="text-base font-semibold text-slate-900">Alterar senha</h2>
        <CampoSenha key={`atual-${versaoCampos}`} id="senha-atual" nome="senhaAtual" titulo="Senha atual" />
        <CampoSenha key={`nova-${versaoCampos}`} id="nova-senha" nome="novaSenha" titulo="Nova senha" nova />
        <CampoSenha key={`confirmar-${versaoCampos}`} id="confirmar-senha" nome="confirmarSenha" titulo="Confirmar nova senha" nova />
        {feedback('senha')}
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pendente !== null}>
          {pendente === 'senha' ? 'Alterando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  );
}
