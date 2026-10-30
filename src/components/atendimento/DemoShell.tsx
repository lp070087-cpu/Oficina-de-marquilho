'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { DemoPerfil } from '@/lib/atendimento-demo-perfil';
import { key } from './demo';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const aba = (ativa: boolean) => `rounded-md px-3 py-2.5 text-sm font-semibold ${ativa ? 'bg-orange-600 text-white' : 'text-slate-200 hover:bg-slate-700'}`;

function entrar(perfil: DemoPerfil) {
  document.cookie = `demo-perfil=${perfil}; path=/; SameSite=Lax`;
  window.location.assign(perfil === 'DONA' ? '/balcao/recebimento' : '/balcao/atendimento');
}

function PainelDemo() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  useEffect(() => {
    try { setPedidos(JSON.parse(localStorage.getItem(key) || '[]')); } catch { setPedidos([]); }
  }, []);
  const pagos = pedidos.filter(p => p.status === 'PAGO');
  const cartoes: [string, string][] = [
    ['Aguardando pagamento', String(pedidos.length - pagos.length)],
    ['Pedidos pagos', String(pagos.length)],
    ['Total recebido', brl(pagos.reduce((s, p) => s + Math.round(Number(p.total) * 100), 0) / 100)],
  ];
  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <div><p className="text-xs font-bold uppercase tracking-wide text-orange-700">Marquinho Moto Peças</p><h1 className="text-3xl font-bold text-slate-900">Painel da DONA</h1><p className="text-sm text-slate-500">Prévia da demonstração, calculada só com os pedidos fictícios deste navegador. Não é o painel real.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">{cartoes.map(([rotulo, valor]) => <div key={rotulo} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{rotulo}</p><p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p></div>)}</div>
  </main>;
}

export default function DemoShell({ perfil, children }: { perfil: DemoPerfil; children: React.ReactNode }) {
  const [painel, setPainel] = useState(false);
  return <div className="min-h-screen bg-[#F3F6FB]">
    <nav className="z-50 flex lg:sticky lg:top-0 flex-wrap items-center gap-4 bg-slate-900 p-4 text-white">
      <strong>MODO DEMO — SEM PERSISTÊNCIA REAL</strong>
      {perfil === 'ATENDENTE'
        ? <Link href="/balcao/atendimento" className={aba(true)}>Atendimento</Link>
        : <div className="flex gap-1"><button type="button" className={aba(!painel)} onClick={() => setPainel(false)}>Caixa</button><button type="button" className={aba(painel)} onClick={() => setPainel(true)}>Painel da DONA</button></div>}
      <label className="ml-auto flex items-center gap-2 text-sm">Entrar como
        <select aria-label="Perfil da demonstração" value={perfil} onChange={e => entrar(e.target.value as DemoPerfil)} className="rounded-md bg-slate-700 px-2 py-2.5 text-white">
          <option value="ATENDENTE">ATENDENTE</option>
          <option value="DONA">DONA</option>
        </select>
      </label>
    </nav>
    {painel ? <PainelDemo /> : children}
  </div>;
}
