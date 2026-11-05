'use client';

import { useEffect, useMemo, useState } from 'react';
import { MENSAGEM_PADRAO, formatarNumero, montarMensagem, validarNumeroWhatsApp } from '@/lib/whatsapp-regras';

type Config = { numero: string; nomeExibicao: string; ativo: boolean; mensagem: string; configurado: boolean; numeroFormatado: string; atualizadoPor?: string | null; atualizadoEm?: string | null; apiOficial?: boolean };
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-emerald-600';

export default function WhatsAppOficinaPage() {
  const [salvo, setSalvo] = useState<Config | null>(null);
  const [form, setForm] = useState({ numero: '', nomeExibicao: 'Marquinho Moto Peças', ativo: true, mensagem: MENSAGEM_PADRAO });
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/configuracoes/whatsapp', { cache: 'no-store' }).then(async r => {
      const c = await r.json();
      if (!r.ok) throw new Error(c.error || 'Não foi possível carregar');
      setSalvo(c);
      setForm({ numero: c.numero ? formatarNumero(c.numero) : '', nomeExibicao: c.nomeExibicao, ativo: c.ativo, mensagem: c.mensagem });
    }).catch(e => setErro(e.message));
  }, []);

  const numeroValido = validarNumeroWhatsApp(form.numero);
  const previa = useMemo(() => montarMensagem(form.mensagem || '', { nomeExibicao: form.nomeExibicao || '—', codigoPedido: '6700-MP', linkComprovante: `${typeof window !== 'undefined' ? window.location.origin : ''}/comprovante/…`, nomeCliente: 'Cliente', validade: '7 dias' }), [form.mensagem, form.nomeExibicao]);
  const alterado = !salvo || salvo.numero !== numeroValido || salvo.nomeExibicao !== form.nomeExibicao.trim() || salvo.ativo !== form.ativo || salvo.mensagem !== form.mensagem.trim();

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setAviso('');
    if (!numeroValido) { setErro('Número inválido. Informe DDI + DDD + número, ex.: +55 (81) 99999-8888'); return; }
    setSalvando(true);
    try {
      const r = await fetch('/api/configuracoes/whatsapp', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, numero: numeroValido }) });
      const c = await r.json();
      if (!r.ok) throw new Error(c.error || 'Não foi possível salvar');
      setSalvo(c);
      setForm({ numero: formatarNumero(c.numero), nomeExibicao: c.nomeExibicao, ativo: c.ativo, mensagem: c.mensagem });
      setAviso('Configuração salva.');
    } catch (e) { setErro((e as Error).message); } finally { setSalvando(false); }
  }

  // Abre uma conversa com o número informado para conferir se ele existe no WhatsApp.
  function testar() {
    if (!numeroValido) { setErro('Informe um número válido para testar.'); return; }
    const texto = `Teste do sistema ${form.nomeExibicao || 'Marquinho Moto Peças'}: conversa aberta pelo painel.`;
    window.open(`https://wa.me/${numeroValido}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
    setAviso('Conversa de teste aberta em outra aba. Nada é enviado sem a sua confirmação no WhatsApp.');
  }

  return <div className="mx-auto w-full max-w-4xl space-y-6 p-4 text-slate-800 lg:p-8">
    <header className="border-b border-slate-200 pb-5">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Configurações</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">WhatsApp da Oficina</h1>
      <p className="mt-2 text-sm text-slate-500">Número oficial, nome de exibição e mensagem usados quando o Caixa compartilha o comprovante com o cliente.</p>
    </header>
    {erro && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{erro}</div>}
    {aviso && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{aviso}</div>}

    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">Número configurado</p><p className="mt-1 break-all font-mono text-lg font-bold">{salvo?.configurado ? salvo.numeroFormatado : 'Não configurado'}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">Envio de comprovantes</p><p className={`mt-1 text-lg font-bold ${salvo?.ativo ? 'text-emerald-700' : 'text-slate-500'}`}>{salvo ? (salvo.ativo ? 'Ativo' : 'Desativado') : '—'}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">Integração oficial (API)</p><p className="mt-1 text-lg font-bold text-slate-600">{salvo?.apiOficial ? 'Credenciais presentes' : 'Não conectada'}</p></div>
    </section>

    <form onSubmit={salvar} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 lg:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Número oficial (com DDI e DDD)
          <input className={`${input} mt-1 font-mono`} inputMode="tel" maxLength={25} placeholder="+55 (81) 99999-8888" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} aria-invalid={!!form.numero && !numeroValido} />
          <span className={`mt-1 block text-xs font-normal ${form.numero && !numeroValido ? 'text-red-700' : 'text-slate-500'}`}>{form.numero ? (numeroValido ? `Será salvo como ${formatarNumero(numeroValido)}` : 'Informe DDI (55), DDD e número') : 'Ex.: +55 81 99999-8888'}</span>
        </label>
        <label className="text-sm font-semibold">Nome de exibição
          <input className={`${input} mt-1`} maxLength={60} value={form.nomeExibicao} onChange={e => setForm({ ...form, nomeExibicao: e.target.value })} />
          <span className="mt-1 block text-xs font-normal text-slate-500">Usado na mensagem ({'{nomeExibicao}'}).</span>
        </label>
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-emerald-600" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} />
        <span><strong>Permitir envio de comprovantes pelo WhatsApp</strong><span className="block text-slate-500">Desativado, o Caixa não mostra o botão de WhatsApp (impressão continua disponível).</span></span>
      </label>
      <label className="block text-sm font-semibold">Mensagem padrão
        <textarea className={`${input} mt-1 min-h-[110px]`} maxLength={1000} value={form.mensagem} onChange={e => setForm({ ...form, mensagem: e.target.value })} />
        <span className="mt-1 block text-xs font-normal text-slate-500">Variáveis: {'{codigoPedido}'}, {'{linkComprovante}'} (obrigatória), {'{nomeExibicao}'}, {'{nomeCliente}'}, {'{validade}'}. <button type="button" className="font-semibold text-emerald-700 underline" onClick={() => setForm({ ...form, mensagem: MENSAGEM_PADRAO })}>Restaurar padrão</button></span>
      </label>
      <div className="rounded-lg bg-[#e7f6ec] p-4 text-sm"><p className="mb-1 text-xs font-bold uppercase text-emerald-800">Prévia</p><p className="whitespace-pre-wrap break-words">{previa}</p></div>
      <div className="flex flex-wrap gap-2">
        <button disabled={salvando || !alterado} className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-40">{salvando ? 'Salvando…' : 'Salvar configuração'}</button>
        <button type="button" onClick={testar} disabled={!numeroValido} className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold hover:bg-slate-50 disabled:opacity-40">Testar abertura da conversa</button>
      </div>
      {salvo?.atualizadoEm && <p className="text-xs text-slate-500">Última alteração: {new Date(salvo.atualizadoEm).toLocaleString('pt-BR', { timeZone: 'America/Recife' })}{salvo.atualizadoPor ? ` por ${salvo.atualizadoPor}` : ''}.</p>}
    </form>

    <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
      <h2 className="text-base font-bold text-slate-800">Como funciona</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>No Caixa, “Enviar pelo WhatsApp” abre a conversa com o cliente já com a mensagem e um link seguro do comprovante. O envio só acontece quando o operador confirma no WhatsApp — o sistema não afirma que o documento foi entregue.</li>
        <li>O link é assinado pelo servidor, identifica apenas a venda, não leva dados do cliente no endereço e expira em 7 dias.</li>
        <li>A conversa sai do WhatsApp aberto no aparelho do Caixa; use nele o número oficial configurado aqui.</li>
        <li>Integração oficial futura (WhatsApp Business Platform): a estrutura já existe e é ativada por credenciais no servidor — nenhuma credencial é pedida nesta tela.</li>
      </ul>
    </section>
  </div>;
}
