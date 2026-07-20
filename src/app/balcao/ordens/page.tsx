'use client';

import { useState, useEffect, useCallback } from 'react';

interface Peca { id: string; nome: string; codigo: string; precoVenda: number; quantidade: number; quantidadeLoja: number; compatibilidade?: string; categoria: { nome: string }; }
interface ItemOS { id: string; peca: Peca; quantidade: number; precoUnitario: number; adaptado?: boolean; }
interface Mecanico { id: string; name: string; emAlmoco: boolean; }
interface OS {
  id: string; numero: number; nomeCliente: string; telefoneCliente: string;
  modeloMoto: string; placaMoto?: string; anoMoto?: string;
  descricaoProblema: string; diagnostico?: string; status: string; valorTotal: number; valorMaoDeObra: number;
  mecanico?: Mecanico; mecanicoId?: string; balcao?: { name: string }; itens: ItemOS[];
  notaFiscal?: { id: string; numero: string; emitidaEm: string };
  statusPagamento?: string | null; formaPagamento?: string | null;
  valorPago?: number | null; dataPagamento?: string | null; usuarioPagamento?: string | null;
}

const CATALOGO_MOTOS = [
  'CG 160','Titan 160','Bros 160','CG 125 Fan','CG 125 Titan','CG 150 Titan','Biz 125','Biz 110i','Pop 110i',
  'XRE 300','CB 300F','CB 500F','Twister 250','Lander 250','Fazer 250','Factor 150','YBR 125','YS 250',
  'NMax 160','PCX 150','Elite 125','CB 1000R','CB 650R','NC 750X','Shadow 750',
  'GSX 125','GSX-S 750','Hayabusa','V-Strom 650','Ninja 300','Ninja 400','Z400','Z650','Z900',
  'G310R','F850GS','R1200GS','Tiger 900','Street Twin','Bonneville T120',
  'Classic 350','Himalayan','Interceptor 650','Meteor 350','DK150','Chopper 150',
].sort();

export default function OrdensPage() {
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('ABERTAS');
  const [modal, setModal] = useState<{ open: boolean; tipo: 'nova' | 'ver'; os?: OS }>({ open: false, tipo: 'nova' });
  const [form, setForm] = useState({ nomeCliente:'', telefoneCliente:'', modeloMoto:'', placaMoto:'', anoMoto:'', descricaoProblema:'', mecanicoId:'' });
  const [motoBusca, setMotoBusca] = useState('');
  const [motoAberta, setMotoAberta] = useState(false);
  const [mecanicos, setMecanicosLista] = useState<Mecanico[]>([]);
  const [msg, setMsg] = useState('');

  const fetchOrdens = useCallback(async () => {
    const statusMap: Record<string, string> = { ABERTAS:'', ABERTA:'ABERTA', EM_ANDAMENTO:'EM_ANDAMENTO', AGUARDANDO_PECAS:'AGUARDANDO_PECAS', CONCLUIDAS:'CONCLUIDA' };
    const p = new URLSearchParams(); if (statusMap[filtro]) p.set('status', statusMap[filtro]);
    try { const r = await fetch(`/api/ordens?${p}`); setOrdens(await r.json()); } catch {}
    setLoading(false);
  }, [filtro]);
  useEffect(() => { fetchOrdens(); fetch('/api/mecanicos').then(r=>r.json()).then(setMecanicosLista).catch(()=>{}); }, [fetchOrdens]);

  const motosFiltradas = motoBusca ? CATALOGO_MOTOS.filter(m => m.toLowerCase().includes(motoBusca.toLowerCase())).slice(0,12) : CATALOGO_MOTOS.slice(0,12);

  async function criarOS() {
    if (!form.nomeCliente||!form.telefoneCliente||!form.modeloMoto) { setMsg('Preencha os campos obrigatorios.'); return; }
    const res = await fetch('/api/ordens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).catch(()=>null);
    if (res?.ok) { setModal({open:false,tipo:'nova'}); setForm({nomeCliente:'',telefoneCliente:'',modeloMoto:'',placaMoto:'',anoMoto:'',descricaoProblema:'',mecanicoId:''}); fetchOrdens(); setMsg(''); }
    else { const e = await res?.json(); setMsg(e?.error||'Erro ao criar OS.'); }
  }

  function abrirNova() { setForm({nomeCliente:'',telefoneCliente:'',modeloMoto:'',placaMoto:'',anoMoto:'',descricaoProblema:'',mecanicoId:''}); setMotoBusca(''); setMsg(''); setModal({open:true,tipo:'nova'}); }
  function abrirVer(os:OS) { setModal({open:true,tipo:'ver',os}); }

  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const sc: Record<string,string> = { ABERTA:'bg-sky-50 text-sky-700',EM_ANDAMENTO:'bg-amber-50 text-amber-700',AGUARDANDO_PECAS:'bg-orange-50 text-orange-700',PRONTA:'bg-violet-50 text-violet-700',CONCLUIDA:'bg-emerald-50 text-emerald-700',CANCELADA:'bg-red-50 text-red-700' };
  const sl: Record<string,string> = { ABERTA:'Aberta',EM_ANDAMENTO:'Em andamento',AGUARDANDO_PECAS:'Aguard. pecas',PRONTA:'Pronta',CONCLUIDA:'Concluida',CANCELADA:'Cancelada' };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-bold text-slate-800 tracking-tight">ORDENS DE SERVICO</h1><p className="text-sm text-slate-500 mt-0.5">{ordens.length} ordens</p></div>
        <button onClick={abrirNova} className="btn-primary inline-flex items-center gap-2 text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Nova OS</button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['ABERTAS','ABERTA','EM_ANDAMENTO','AGUARDANDO_PECAS','CONCLUIDAS'].map(f=>(<button key={f} onClick={()=>setFiltro(f)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${filtro===f?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>{sl[f]||'Todas'}</button>))}
      </div>
      {loading?<p className="text-sm text-slate-400">Carregando...</p>:ordens.length===0?(<div className="card text-center py-12"><p className="text-sm text-slate-400">Nenhuma OS encontrada.</p></div>):(
        <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100"><th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">OS</th><th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Cliente</th><th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Moto</th><th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Mecanico</th><th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Status</th><th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 uppercase">Valor</th></tr></thead><tbody>{ordens.map(os=>(<tr key={os.id} onClick={()=>abrirVer(os)} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"><td className="py-2 px-3 font-medium text-brand-600">#{os.numero}</td><td className="py-2 px-3 text-slate-700">{os.nomeCliente}</td><td className="py-2 px-3 text-slate-500">{os.modeloMoto}</td><td className="py-2 px-3 text-slate-500 text-xs">{os.mecanico?.name||'-'}</td><td className="py-2 px-3"><span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${sc[os.status]||'bg-slate-50 text-slate-500'}`}>{sl[os.status]||os.status}</span></td><td className="py-2 px-3 text-right font-medium text-slate-700">{fm(Number(os.valorTotal)||0)}</td></tr>))}</tbody></table></div>
      )}

      {modal.open && modal.tipo==='nova' && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Nova Ordem de Servico</h2>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-4">{msg}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs font-medium text-slate-600">Nome do cliente *</label><input value={form.nomeCliente} onChange={e=>setForm({...form,nomeCliente:e.target.value})} className="input-field mt-1"/></div>
              <div><label className="text-xs font-medium text-slate-600">Telefone *</label><input value={form.telefoneCliente} onChange={e=>setForm({...form,telefoneCliente:e.target.value})} className="input-field mt-1" placeholder="(11) 99999-9999"/></div>

              {/* Modelo com select pesquisavel */}
              <div className="relative">
                <label className="text-xs font-medium text-slate-600">Modelo da moto *</label>
                <input value={motoBusca||form.modeloMoto} onChange={e=>{setMotoBusca(e.target.value);setForm({...form,modeloMoto:e.target.value});setMotoAberta(true);}} onFocus={()=>setMotoAberta(true)} onBlur={()=>setTimeout(()=>setMotoAberta(false),200)}
                  className="input-field mt-1" placeholder="Buscar modelo..." autoComplete="off"/>
                {motoAberta && (motoBusca||form.modeloMoto) && (
                  <div className="absolute z-10 bg-white border border-slate-200 rounded-lg shadow-lg w-full max-h-48 overflow-y-auto mt-1">
                    {motosFiltradas.map(m=>(<button key={m} type="button" onMouseDown={()=>{setForm({...form,modeloMoto:m});setMotoBusca('');setMotoAberta(false);}} className="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 hover:text-brand-700">{m}</button>))}
                  </div>
                )}
              </div>

              <div><label className="text-xs font-medium text-slate-600">Mecanico</label><select value={form.mecanicoId} onChange={e=>setForm({...form,mecanicoId:e.target.value})} className="input-field mt-1"><option value="">Selecionar...</option>{mecanicos.map(m=>(<option key={m.id} value={m.id}>{m.name}{m.emAlmoco?' (almoco)':''}</option>))}</select></div>
              <div><label className="text-xs font-medium text-slate-600">Placa</label><input value={form.placaMoto} onChange={e=>setForm({...form,placaMoto:e.target.value})} className="input-field mt-1"/></div>
              <div><label className="text-xs font-medium text-slate-600">Ano</label><input value={form.anoMoto} onChange={e=>setForm({...form,anoMoto:e.target.value})} className="input-field mt-1"/></div>
              <div className="col-span-2"><label className="text-xs font-medium text-slate-600">Problema / Observacoes</label><textarea value={form.descricaoProblema} onChange={e=>setForm({...form,descricaoProblema:e.target.value})} className="input-field mt-1" rows={2}/></div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={()=>setModal({open:false,tipo:'nova'})} className="btn-secondary text-xs">Cancelar</button><button onClick={criarOS} className="btn-primary text-xs">Criar OS</button></div>
          </div>
        </div>
      )}
      {modal.open && modal.tipo==='ver' && modal.os && (<DetalheOSBalcao os={modal.os} onClose={()=>{setModal({open:false,tipo:'ver'});fetchOrdens();}}/>)}
    </div>
  );
}

function getCompatBadge(peca:Peca,modeloMoto:string):{label:string;color:string} {
  const comp=(peca.compatibilidade||'').toLowerCase(); const modelo=modeloMoto.toLowerCase();
  if (comp.includes('universal')) return {label:'Universal',color:'bg-violet-50 text-violet-700'};
  if (comp.includes(modelo)) return {label:'Compativel',color:'bg-emerald-50 text-emerald-700'};
  return {label:'Adaptada',color:'bg-amber-50 text-amber-700'};
}

function DetalheOSBalcao({os,onClose}:{os:OS;onClose:()=>void}) {
  const [tab,setTab]=useState<'itens'|'status'>('itens');
  const [mecId,setMecId]=useState(os.mecanicoId||'');
  const [diagnostico,setDiagnostico]=useState(os.diagnostico||'');
  const [novoStatus,setNovoStatus]=useState(os.status);
  const [pecas,setPecas]=useState<Peca[]>([]);
  const [pecaId,setPecaId]=useState('');
  const [qtd,setQtd]=useState('1');
  const [mostrarTodas,setMostrarTodas]=useState(false);
  const [msg,setMsg]=useState('');
  const [msgOk,setMsgOk]=useState('');
  const [dados,setDados]=useState<OS>(os);
  const [mecanicos,setMecanicos]=useState<Mecanico[]>([]);
  const [maoDeObra,setMaoDeObra]=useState(String(Number(os.valorMaoDeObra)||0));
  const [desconto,setDesconto]=useState('0');

  // Cobranca
  const [showCobranca,setShowCobranca]=useState(false);
  const [cobranca,setCobranca]=useState({pagamento:'PIX',obs:'',entregue:false});

  const carregarPecas=async(todas:boolean)=>{
    const p=new URLSearchParams();
    if (dados.modeloMoto&&!todas) p.set('modelo',dados.modeloMoto);
    if (todas) p.set('todas','1');
    try{const r=await fetch(`/api/pecas?${p}`);setPecas(await r.json());}catch{}
  };
  useEffect(()=>{ fetch('/api/mecanicos').then(r=>r.json()).then(setMecanicos).catch(()=>{});carregarPecas(false); },[]);
  function toggleMostrarTodas(){ const n=!mostrarTodas; setMostrarTodas(n); carregarPecas(n); }

  const fm=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const sc:Record<string,string>={ABERTA:'bg-sky-50 text-sky-700',EM_ANDAMENTO:'bg-amber-50 text-amber-700',AGUARDANDO_PECAS:'bg-orange-50 text-orange-700',PRONTA:'bg-violet-50 text-violet-700',CONCLUIDA:'bg-emerald-50 text-emerald-700',CANCELADA:'bg-red-50 text-red-700'};
  const sl:Record<string,string>={ABERTA:'Aberta',EM_ANDAMENTO:'Em andamento',AGUARDANDO_PECAS:'Aguard. pecas',PRONTA:'Pronta',CONCLUIDA:'Concluida',CANCELADA:'Cancelada'};

  async function atualizarStatus(){
    const body:any={status:novoStatus,mecanicoId:mecId||null,diagnostico:diagnostico||null};
    if (maoDeObra) body.valorMaoDeObra=parseFloat(maoDeObra)||0;
    const r=await fetch(`/api/ordens/${dados.id}/status`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(()=>null);
    if (r){const u=await r.json();setDados(u);setNovoStatus(u.status);setMsgOk('Atualizado.');setTimeout(()=>setMsgOk(''),2000);}
    else{setMsg('Erro ao atualizar.');}
  }

  async function addItem(){
    if(!pecaId)return;
    const r=await fetch(`/api/ordens/${dados.id}/itens`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pecaId,quantidade:Number(qtd)||1})}).catch(()=>null);
    if(r){const u=await r.json();setDados(u);setPecaId('');setQtd('1');setMsg('');}
    else{setMsg('Erro ao adicionar peca.');}
  }

  async function removeItem(itemId:string){
    const r=await fetch(`/api/ordens/${dados.id}/itens`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({itemId})}).catch(()=>null);
    if(r){const u=await r.json();setDados(u);}
  }

  async function finalizarOS(){
    if(!confirm('Finalizar servico? A OS sera marcada como CONCLUIDA.'))return;
    const body:any={status:'CONCLUIDA',mecanicoId:mecId||null,diagnostico:diagnostico||null};
    if (maoDeObra) body.valorMaoDeObra=parseFloat(maoDeObra)||0;
    const r=await fetch(`/api/ordens/${dados.id}/status`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(()=>null);
    if(r){const u=await r.json();setDados(u);setNovoStatus('CONCLUIDA');setMsgOk('OS finalizada!');}
  }

  function linkWhatsApp(){
    const t=encodeURIComponent(`Ola ${dados.nomeCliente}! OS #${dados.numero} - ${dados.modeloMoto}. Total: ${fm(Number(dados.valorTotal))}`);
    window.open(`https://wa.me/55${dados.telefoneCliente.replace(/\D/g,'')}?text=${t}`,'_blank');
  }

  const pecasOrdenadas=[...pecas].sort((a,b)=>{const ba=getCompatBadge(a,dados.modeloMoto);const bb=getCompatBadge(b,dados.modeloMoto);return ({'Compativel':0,'Universal':1,'Adaptada':2}[ba.label]??3)-({'Compativel':0,'Universal':1,'Adaptada':2}[bb.label]??3);});
  const qtdCompativeis=pecas.filter(p=>getCompatBadge(p,dados.modeloMoto).label!=='Adaptada').length;
  const totalPecas=dados.itens.reduce((s,i)=>s+Number(i.precoUnitario)*i.quantidade,0);
  const totalGeral=totalPecas+Number(dados.valorMaoDeObra||0)-(parseFloat(desconto)||0);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div><h2 className="text-base font-semibold text-slate-800">OS #{dados.numero}</h2>
            <p className="text-sm text-slate-500">{dados.nomeCliente} - {dados.modeloMoto}{dados.placaMoto?` (${dados.placaMoto})`:''}</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
        </div>

        <div className="flex border-b border-slate-100 flex-shrink-0">
          <button className="px-4 py-2 text-xs font-medium border-b-2 border-brand-600 text-brand-600">Peças e Valores</button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">{msg}</div>}
          {msgOk&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded text-xs mb-3 font-bold">{msgOk}</div>}

          <div>
            <div className="flex items-center justify-between mb-3 p-2.5 bg-slate-50 rounded-lg text-xs">
              <span>{qtdCompativeis} pecas compativeis com <strong className="text-brand-600">{dados.modeloMoto}</strong></span>
              <button onClick={toggleMostrarTodas} className={`text-xs font-medium px-3 py-1 rounded transition-colors ${mostrarTodas?'bg-amber-100 text-amber-700':'bg-white border border-slate-200 text-slate-600'}`}>{mostrarTodas?'So compativeis':'Mostrar todas'}</button>
            </div>

            <div className="flex gap-2 mb-4">
              <select value={pecaId} onChange={e=>setPecaId(e.target.value)} className="input-field flex-1 text-xs">
                <option value="">Selecionar peca...</option>
                {pecasOrdenadas.map(p=>{const b=getCompatBadge(p,dados.modeloMoto);return(<option key={p.id} value={p.id}>{p.codigo} - {p.nome} — Loja:{p.quantidade||0} Cent:{p.quantidadeLoja||0} [{b.label}]</option>)})}
              </select>
              <input type="number" value={qtd} onChange={e=>setQtd(e.target.value)} className="input-field w-20 text-xs" min="1"/>
              <button onClick={addItem} className="btn-primary text-xs px-3">+</button>
            </div>

            {dados.itens.length===0?(<p className="text-xs text-slate-400 py-4">Nenhuma peca adicionada.</p>):(
              <table className="w-full text-xs">
                <thead><tr><th className="text-left py-1.5 font-medium text-slate-500">Peca</th><th className="text-center py-1.5 font-medium text-slate-500">Tipo</th><th className="text-center py-1.5 font-medium text-slate-500">Loja</th><th className="text-center py-1.5 font-medium text-slate-500">Central</th><th className="text-right py-1.5 font-medium text-slate-500">Qtd</th><th className="text-right py-1.5 font-medium text-slate-500">Unit.</th><th className="text-right py-1.5 font-medium text-slate-500">Subtotal</th><th></th></tr></thead>
                <tbody>{dados.itens.map(i=>{const b=getCompatBadge(i.peca,dados.modeloMoto);const isAd=i.adaptado||b.label==='Adaptada';const pecaOrig=pecas.find(p=>p.id===i.peca.id);const qloja=pecaOrig?.quantidade||0;const qcentral=pecaOrig?.quantidadeLoja||0;return(<tr key={i.id} className="border-b border-slate-50"><td className="py-1.5 text-slate-700">{i.peca.nome}</td><td className="py-1.5 text-center"><span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${isAd?'bg-amber-50 text-amber-700':b.label==='Compativel'?'bg-emerald-50 text-emerald-700':'bg-violet-50 text-violet-700'}`}>{isAd?'Adaptada':b.label}</span></td><td className={`py-1.5 text-center font-bold text-[10px] ${qloja>0?'text-brand-600':'text-red-400'}`}>{qloja}</td><td className={`py-1.5 text-center font-bold text-[10px] ${qcentral>0?'text-slate-500':'text-amber-600'}`}>{qcentral}</td><td className="py-1.5 text-right">{i.quantidade}</td><td className="py-1.5 text-right text-slate-500">{fm(Number(i.precoUnitario))}</td><td className="py-1.5 text-right font-medium">{fm(Number(i.precoUnitario)*i.quantidade)}</td><td className="py-1.5 text-right"><button onClick={()=>removeItem(i.id)} className="text-red-500 text-[11px]">x</button></td></tr>)})}</tbody>
                <tfoot>
                  <tr><td colSpan={6} className="py-1.5 text-right text-xs text-slate-500">Total pecas</td><td className="py-1.5 text-right font-bold">{fm(totalPecas)}</td><td></td></tr>
                  <tr><td colSpan={6} className="py-1.5 text-right text-xs text-slate-500">
                    <span className="mr-2">Mao de obra:</span>
                    <input type="number" step="0.01" value={maoDeObra} onChange={e=>setMaoDeObra(e.target.value)} onBlur={async()=>{const v=parseFloat(maoDeObra)||0;const r=await fetch(`/api/ordens/${dados.id}/status`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:dados.status,valorMaoDeObra:v})});if(r?.ok){const u=await r.json();setDados(u);}}} className="input-field w-24 text-xs text-right"/>
                  </td><td className="py-1.5 text-right font-bold">{fm(parseFloat(maoDeObra)||0)}</td><td></td></tr>
                  <tr><td colSpan={6} className="py-1.5 text-right text-xs text-slate-500">
                    <span className="mr-2">Desconto:</span>
                    <input type="number" step="0.01" value={desconto} onChange={e=>setDesconto(e.target.value)} className="input-field w-24 text-xs text-right"/>
                  </td><td className="py-1.5 text-right font-bold text-red-600">- {fm(parseFloat(desconto)||0)}</td><td></td></tr>
                  <tr className="font-bold bg-brand-50"><td colSpan={6} className="py-2 text-right text-sm text-slate-700">TOTAL GERAL</td><td className="py-2 text-right text-sm text-brand-700">{fm(totalGeral)}</td><td></td></tr>
                </tfoot>
              </table>
            )}
          </div>

        </div>

        {/* Rodapé: Finalizar / Cobrança */}
        <div className="p-4 border-t border-slate-100 space-y-3 flex-shrink-0">
          {(cobranca.entregue) ? (
            <div className="flex items-center justify-between">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white">Moto Entregue ✓</span>
              <button onClick={onClose} className="btn-secondary text-xs">Fechar</button>
            </div>
          ) : dados.statusPagamento==='PAGO' ? (
            <div className="flex items-center justify-between">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">🟢 Pagamento confirmado</span>
              <button onClick={()=>{setCobranca({...cobranca,entregue:true});setMsgOk('Moto entregue!');}} className="btn-primary text-xs">🏍️ Liberar Moto</button>
            </div>
          ) : showCobranca ? (
            <div className="space-y-3 bg-slate-50 rounded-lg p-3 text-xs">
              <h4 className="font-bold text-slate-700">Cobranca — OS #{dados.numero}</h4>
              <div className="grid grid-cols-4 gap-2"><div><span className="text-slate-400">Total:</span> <strong>{fm(totalGeral)}</strong></div><div><span className="text-slate-400">Cliente:</span> <strong>{dados.nomeCliente}</strong></div><div><span className="text-slate-400">Moto:</span> <strong>{dados.modeloMoto}</strong></div><div><span className="text-slate-400">Placa:</span> <strong>{dados.placaMoto||'-'}</strong></div></div>
              <div><label className="text-[10px] font-semibold text-slate-500 uppercase">Pagamento</label><select value={cobranca.pagamento} onChange={e=>setCobranca({...cobranca,pagamento:e.target.value})} className="input-field mt-0.5 text-xs"><option>PIX</option><option>Dinheiro</option><option>Debito</option><option>Credito</option><option>Parcelado</option></select></div>
              <div><label className="text-[10px] font-semibold text-slate-500 uppercase">Observacoes</label><input value={cobranca.obs} onChange={e=>setCobranca({...cobranca,obs:e.target.value})} className="input-field mt-0.5 text-xs"/></div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">🔴 Aguardando pagamento da Dona</span>
              <div className="flex gap-2"><button onClick={()=>{window.print();}} className="btn-secondary text-xs">🖨️ Imprimir Nota Fiscal</button><button onClick={()=>setShowCobranca(false)} className="btn-secondary text-xs">Fechar</button></div>
            </div>
          ) : dados.status==='CONCLUIDA' ? (
            <div className="flex items-center justify-between">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">Concluida</span>
              <div className="flex items-center gap-2">
                <button onClick={linkWhatsApp} className="text-xs text-emerald-600 font-medium">WhatsApp</button>
                <button onClick={()=>setShowCobranca(true)} className="btn-primary text-xs">💰 Gerar Cobranca</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${sc[dados.status]||'bg-slate-50 text-slate-500'}`}>{sl[dados.status]||dados.status}</span>
              <div className="flex items-center gap-2">
                <button onClick={linkWhatsApp} className="text-xs text-emerald-600 font-medium">WhatsApp</button>
                <button onClick={finalizarOS} disabled={dados.status==='CANCELADA'} className="btn-primary text-xs">🔧 Finalizar Servico</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
