'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Peca { id: string; nome: string; codigo: string; precoVenda: number; quantidade: number; compatibilidade?: string; categoria: { nome: string }; }
interface ItemOS { id: string; peca: Peca; quantidade: number; precoUnitario: number; adaptado?: boolean; }
interface Mecanico { id: string; name: string; emAlmoco: boolean; }
interface OS {
  id: string; numero: number; nomeCliente: string; telefoneCliente: string;
  modeloMoto: string; placaMoto?: string; anoMoto?: string;
  descricaoProblema: string; diagnostico?: string; status: string; valorTotal: number; valorMaoDeObra: number;
  mecanico?: Mecanico; mecanicoId?: string; balcao?: { name: string }; itens: ItemOS[];
  notaFiscal?: { id: string; numero: string; emitidaEm: string };
}

export default function BalcaoDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalPecas:0, osAbertas:0, osEmAndamento:0, osConcluidas:0 });
  const [ordens, setOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nomeCliente:'', telefoneCliente:'', modeloMoto:'', placaMoto:'', anoMoto:'', descricaoProblema:'', mecanicoId:'' });
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pecasRes, ordensRes, mecsRes] = await Promise.all([
          fetch('/api/pecas').then(r=>r.json()),
          fetch('/api/ordens').then(r=>r.json()),
          fetch('/api/mecanicos').then(r=>r.json()).catch(() => []),
        ]);
        const pecas = Array.isArray(pecasRes) ? pecasRes : [];
        const ordensData = Array.isArray(ordensRes) ? ordensRes : [];
        setMecanicos(Array.isArray(mecsRes) ? mecsRes : []);
        setStats({
          totalPecas: pecas.length,
          osAbertas: ordensData.filter((o:any)=>o.status==='ABERTA').length,
          osEmAndamento: ordensData.filter((o:any)=>['EM_ANDAMENTO','AGUARDANDO_PECAS'].includes(o.status)).length,
          osConcluidas: ordensData.filter((o:any)=>['PRONTA','CONCLUIDA'].includes(o.status)).length,
        });
        setOrdens(ordensData.slice(0, 20));
      } catch { setError('Falha ao carregar dados.'); }
      setLoading(false);
    }
    load();
  }, []);

  async function criarOS() {
    if (!form.nomeCliente||!form.telefoneCliente||!form.modeloMoto) { setMsg('Preencha os campos obrigatorios.'); return; }
    setSaving(true);
    const res = await fetch('/api/ordens', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    if (res.ok) {
      setModal(false);
      setForm({ nomeCliente:'',telefoneCliente:'',modeloMoto:'',placaMoto:'',anoMoto:'',descricaoProblema:'',mecanicoId:'' });
      router.push('/balcao/ordens');
    } else { const e = await res.json(); setMsg(e.error||'Erro.'); }
    setSaving(false);
  }

  const formatMoney = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const statusColor: Record<string,string> = { ABERTA:'bg-sky-50 text-sky-700',EM_ANDAMENTO:'bg-amber-50 text-amber-700',AGUARDANDO_PECAS:'bg-orange-50 text-orange-700',PRONTA:'bg-violet-50 text-violet-700',CONCLUIDA:'bg-emerald-50 text-emerald-700',CANCELADA:'bg-red-50 text-red-700' };
  const statusDot: Record<string,string> = { ABERTA:'bg-sky-500',EM_ANDAMENTO:'bg-amber-500',AGUARDANDO_PECAS:'bg-orange-500',PRONTA:'bg-violet-500',CONCLUIDA:'bg-emerald-500',CANCELADA:'bg-red-500' };
  const statusLabel: Record<string,string> = { ABERTA:'Aberta',EM_ANDAMENTO:'Em andamento',AGUARDANDO_PECAS:'Aguard. pecas',PRONTA:'Pronta',CONCLUIDA:'Concluida',CANCELADA:'Cancelada' };

  return (
    <div className="p-6 space-y-6">
      {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs">{error}</div>}

      <div className="grid grid-cols-4 gap-4">
        <div className="card-stat"><p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Pecas no estoque</p><p className="text-2xl font-bold text-slate-800">{stats.totalPecas}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">OS abertas</p><p className="text-2xl font-bold text-sky-600">{stats.osAbertas}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Em andamento</p><p className="text-2xl font-bold text-amber-600">{stats.osEmAndamento}</p></div>
        <div className="card-stat"><p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Concluidas no mes</p><p className="text-2xl font-bold text-emerald-600">{stats.osConcluidas}</p></div>
      </div>

      <button onClick={() => setModal(true)} className="btn-primary inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Nova OS</button>

      <div className="card-table">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Ordens recentes</h3></div>
        <div className="overflow-auto"><table className="w-full text-[13px]">
          <thead><tr className="border-b border-slate-100 bg-slate-50/60"><th className="text-left py-3 px-6 font-medium text-slate-500">OS</th><th className="text-left py-3 px-6 font-medium text-slate-500">Cliente</th><th className="text-left py-3 px-6 font-medium text-slate-500">Moto</th><th className="text-left py-3 px-6 font-medium text-slate-500">Mecanico</th><th className="text-center py-3 px-6 font-medium text-slate-500">Status</th><th className="text-right py-3 px-6 font-medium text-slate-500">Valor</th></tr></thead>
          <tbody>{loading?<tr><td colSpan={6} className="py-10 text-center text-slate-400">Carregando...</td></tr>:ordens.length===0?<tr><td colSpan={6} className="py-10 text-center text-slate-400">Nenhuma OS</td></tr>:ordens.map((os,i)=>(
            <tr key={os.id} className={`border-b border-slate-50 cursor-pointer ${i%2===0?'bg-white':'bg-slate-50/20'}`} onClick={()=>router.push('/balcao/ordens')}>
              <td className="py-3 px-6 font-semibold text-brand-600">#{os.numero}</td>
              <td className="py-3 px-6 text-slate-700 font-medium">{os.nomeCliente}</td>
              <td className="py-3 px-6 text-slate-500">{os.modeloMoto}</td>
              <td className="py-3 px-6 text-slate-500">{os.mecanico?.name||'-'}</td>
              <td className="py-3 px-6 text-center"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColor[os.status]||'bg-slate-50 text-slate-500'}`}><span className={`w-1.5 h-1.5 rounded-full ${statusDot[os.status]||'bg-slate-300'}`}/>{statusLabel[os.status]||os.status}</span></td>
              <td className="py-3 px-6 text-right font-semibold text-slate-700">{formatMoney(Number(os.valorTotal)||0)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Nova Ordem de Servico</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-4">{msg}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs font-medium text-slate-600">Nome do cliente *</label><input value={form.nomeCliente} onChange={e=>setForm({...form,nomeCliente:e.target.value})} className="input-field mt-1"/></div>
              <div><label className="text-xs font-medium text-slate-600">Telefone *</label><input value={form.telefoneCliente} onChange={e=>setForm({...form,telefoneCliente:e.target.value})} className="input-field mt-1" placeholder="(11) 99999-9999"/></div>
              <div><label className="text-xs font-medium text-slate-600">Modelo da moto *</label><input value={form.modeloMoto} onChange={e=>setForm({...form,modeloMoto:e.target.value})} className="input-field mt-1" placeholder="Ex: CG 160" list="modelos"/><datalist id="modelos"><option value="CG 160"/><option value="Titan 160"/><option value="Bros 160"/></datalist></div>
              <div><label className="text-xs font-medium text-slate-600">Mecanico</label><select value={form.mecanicoId} onChange={e=>setForm({...form,mecanicoId:e.target.value})} className="input-field mt-1"><option value="">Selecionar...</option>{mecanicos.map(m=>(<option key={m.id} value={m.id}>{m.name}{m.emAlmoco?' (almoco)':''}</option>))}</select></div>
              <div><label className="text-xs font-medium text-slate-600">Placa</label><input value={form.placaMoto} onChange={e=>setForm({...form,placaMoto:e.target.value})} className="input-field mt-1"/></div>
              <div><label className="text-xs font-medium text-slate-600">Ano</label><input value={form.anoMoto} onChange={e=>setForm({...form,anoMoto:e.target.value})} className="input-field mt-1"/></div>
              <div className="col-span-2"><label className="text-xs font-medium text-slate-600">Problema / Observacoes</label><textarea value={form.descricaoProblema} onChange={e=>setForm({...form,descricaoProblema:e.target.value})} className="input-field mt-1" rows={2}/></div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
              <button onClick={()=>setModal(false)} className="btn-secondary text-xs">Cancelar</button>
              <button onClick={criarOS} disabled={saving} className="btn-primary text-xs">{saving?'Criando...':'Criar OS'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
