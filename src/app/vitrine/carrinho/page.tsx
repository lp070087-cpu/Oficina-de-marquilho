'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Peca { id: string; nome: string; codigo: string; precoVenda: number; quantidade: number; estoqueMinimo: number; marca?: string; compatibilidade?: string; categoria: { nome: string }; }
interface CartItem { peca: Peca; quantidade: number; }
interface ClienteData { id: string; nome: string; telefone: string; modeloMoto?: string; }

export default function CarrinhoPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [modeloMoto, setModeloMoto] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    const s = sessionStorage.getItem('marquinho-cart'); if (s) setCart(JSON.parse(s));
    const c = sessionStorage.getItem('marquinho-cliente'); if (c) { const d: ClienteData = JSON.parse(c); setClienteId(d.id); setModeloMoto(d.modeloMoto||''); }
  }, []);

  function atualizarQtd(i: number, q: number) { const n = [...cart]; if (q<=0) n.splice(i,1); else n[i]={...n[i],quantidade:q}; setCart(n); sessionStorage.setItem('marquinho-cart',JSON.stringify(n)); }

  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const total = cart.reduce((s,i)=>s+Number(i.peca.precoVenda)*i.quantidade,0);

  async function finalizar() {
    if(!clienteId){setMsg('Faca login antes de finalizar.');return;} if(cart.length===0){setMsg('Adicione pelo menos uma peca.');return;}
    setLoading(true);setMsg('');
    try{
      const r=await fetch('/api/vitrine/orcamentos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clienteId,modeloMoto:modeloMoto||null,observacao:observacao||null,itens:cart.map(i=>({pecaId:i.peca.id,quantidade:i.quantidade}))})});
      if(r.ok){sessionStorage.removeItem('marquinho-cart');setCart([]);const o=await r.json();setSucesso(`Orcamento #${o.numero} enviado! Entraremos em contato pelo WhatsApp.`);}
      else{const e=await r.json();setMsg(e.error||'Erro.');}
    }catch{setMsg('Erro de conexao.');}
    setLoading(false);
  }

  function linkWhatsApp() {
    const itens = cart.map(i=>`- ${i.peca.nome} (${i.peca.codigo}) x${i.quantidade} = ${fm(Number(i.peca.precoVenda)*i.quantidade)}`).join('\n');
    const txt = encodeURIComponent(`Ola Marquinho! Segue meu orcamento:%0A%0A${itens}%0A%0ATotal: ${fm(total)}%0AMoto: ${modeloMoto||'Nao informada'}%0AObs: ${observacao||'Nenhuma'}`);
    window.open(`https://wa.me/55?text=${txt}`,'_blank');
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#111] text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={()=>router.push('/vitrine')} className="text-slate-400 hover:text-white text-sm">← Voltar</button>
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/25"><span className="font-extrabold text-white text-xs">MP</span></div>
          <span className="font-extrabold text-sm">Marquinho</span>
          <span className="flex-1 text-right font-bold text-sm">Meu Orcamento</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {sucesso ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Orcamento enviado!</h2>
            <p className="text-sm text-slate-500 mb-4">{sucesso}</p>
            <button onClick={()=>router.push('/vitrine')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-extrabold transition-colors">Continuar comprando</button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-extrabold text-slate-800 mb-6">Meu Orcamento</h1>
            {msg&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs mb-4">{msg}</div>}
            {cart.length===0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/></svg></div>
                <p className="text-sm text-slate-400 mb-4">Seu orcamento esta vazio</p>
                <button onClick={()=>router.push('/vitrine')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-extrabold transition-colors">Ver produtos</button>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50/50"><th className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase">Produto</th><th className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase">SKU</th><th className="text-center py-3 px-5 text-xs font-bold text-slate-500 uppercase">Qtd</th><th className="text-right py-3 px-5 text-xs font-bold text-slate-500 uppercase">Unit.</th><th className="text-right py-3 px-5 text-xs font-bold text-slate-500 uppercase">Total</th></tr></thead>
                    <tbody>{cart.map((item,i)=>(
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-3 px-5"><p className="font-semibold text-slate-700">{item.peca.nome}</p><p className="text-xs text-slate-400">{item.peca.compatibilidade||''}</p></td>
                        <td className="py-3 px-5 font-mono text-xs text-slate-500">{item.peca.codigo}</td>
                        <td className="py-3 px-5 text-center"><div className="inline-flex items-center gap-1.5"><button onClick={()=>atualizarQtd(i,item.quantidade-1)} className="w-7 h-7 rounded border border-slate-200 text-xs hover:bg-slate-50 font-medium">-</button><span className="w-8 text-center text-xs font-bold">{item.quantidade}</span><button onClick={()=>atualizarQtd(i,item.quantidade+1)} className="w-7 h-7 rounded border border-slate-200 text-xs hover:bg-slate-50 font-medium">+</button></div></td>
                        <td className="py-3 px-5 text-right text-xs text-slate-500">{fm(Number(item.peca.precoVenda))}</td>
                        <td className="py-3 px-5 text-right text-xs font-extrabold text-slate-700">{fm(Number(item.peca.precoVenda)*item.quantidade)}</td>
                      </tr>
                    ))}</tbody>
                    <tfoot><tr><td colSpan={4} className="py-4 px-5 text-right text-sm font-bold text-slate-500 border-t-2 border-slate-200">Total estimado</td><td className="py-4 px-5 text-right text-lg font-extrabold text-slate-800 border-t-2 border-slate-200">{fm(total)}</td></tr></tfoot>
                  </table>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800">Dados do orcamento</h3>
                  {!clienteId&&<div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-xs font-medium">Faca login para finalizar.</div>}
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Modelo da moto</label><input value={modeloMoto} onChange={e=>setModeloMoto(e.target.value)} className="input-field mt-1.5" placeholder="Ex: CG 160"/></div>
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Observacao</label><textarea value={observacao} onChange={e=>setObservacao(e.target.value)} className="input-field mt-1.5" rows={2} placeholder="Detalhes adicionais..."/></div>
                  </div>
                  <div className="flex items-center gap-3 justify-end pt-2 flex-wrap">
                    <button onClick={()=>router.push('/vitrine')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-50 transition-colors">Continuar comprando</button>
                    <button onClick={linkWhatsApp} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-extrabold transition-colors inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                      Enviar pelo WhatsApp
                    </button>
                    <button onClick={finalizar} disabled={loading||cart.length===0} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-extrabold transition-colors">{loading?'Enviando...':'Finalizar orcamento'}</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
