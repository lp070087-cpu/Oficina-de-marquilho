'use client';

import { useState } from 'react';

interface ItemNF { id: string; nome: string; codigo: string; quantidade: number; valorUnitario: number; }

export default function NFManualPage() {
  const [cliente, setCliente] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');
  const [itens, setItens] = useState<ItemNF[]>([]);
  const [formItem, setFormItem] = useState({ nome:'', codigo:'', quantidade:'1', valorUnitario:'' });
  const [msg, setMsg] = useState('');

  function addItem() {
    if (!formItem.nome) { setMsg('Preencha o nome do produto.'); return; }
    setItens([...itens, { id: Date.now().toString(), nome: formItem.nome, codigo: formItem.codigo, quantidade: parseInt(formItem.quantidade)||1, valorUnitario: parseFloat(formItem.valorUnitario)||0 }]);
    setFormItem({ nome:'', codigo:'', quantidade:'1', valorUnitario:'' });
    setMsg('');
  }

  function removeItem(id: string) { setItens(itens.filter(i => i.id !== id)); }

  const total = itens.reduce((s,i) => s + i.valorUnitario * i.quantidade, 0);
  const fm = (v:number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

  function imprimir() {
    const w = window.open('','_blank','width=800,height=600');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Nota Fiscal - Marquinho</title><style>body{font-family:Arial;padding:40px;max-width:700px;margin:0 auto}.header{text-align:center;margin-bottom:30px}.header h1{font-size:20px;margin:0}.header p{font-size:12px;color:#666}.linha{border-top:1px solid #ddd;margin:15px 0}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:8px;border-bottom:2px solid #2563eb;color:#2563eb}td{padding:8px;border-bottom:1px solid #eee}.total{text-align:right;font-size:16px;font-weight:bold;margin-top:15px}.footer{text-align:center;font-size:11px;color:#999;margin-top:40px}</style></head><body>
<div class="header"><h1>Marquinho Moto Pecas</h1><p>Nota Fiscal Manual</p><p>CNPJ: 00.000.000/0001-00</p></div>
<div class="linha"></div>
<p><strong>Cliente:</strong> ${cliente||'---'}</p><p><strong>CPF/CNPJ:</strong> ${cpf||'---'}</p><p><strong>Endereco:</strong> ${endereco||'---'}</p>
<div class="linha"></div>
<table><thead><tr><th>Produto</th><th>Codigo</th><th>Qtd</th><th>Vlr Unit</th><th>Total</th></tr></thead>
<tbody>${itens.map(i=>`<tr><td>${i.nome}</td><td>${i.codigo||'-'}</td><td>${i.quantidade}</td><td>${fm(i.valorUnitario)}</td><td>${fm(i.valorUnitario*i.quantidade)}</td></tr>`).join('')}</tbody></table>
<p class="total">Total: ${fm(total)}</p>
${obs?`<p><strong>Obs:</strong> ${obs}</p>`:''}
<div class="footer"><p>Data: ${new Date().toLocaleDateString('pt-BR')}</p><p>Marquinho Moto Pecas - Atacado & Varejo</p></div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">NOTA FISCAL MANUAL</h1>
          <p className="text-sm text-slate-500 mt-0.5">Controle interno - sem integracao fiscal</p>
        </div>
      </div>

      <div className="card space-y-4 mb-6">
        <h3 className="text-sm font-bold text-slate-800">Dados do cliente</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase">Nome do cliente</label><input value={cliente} onChange={e=>setCliente(e.target.value)} className="input-field mt-1.5" placeholder="Nome completo"/></div>
          <div><label className="text-xs font-semibold text-slate-600 uppercase">CPF/CNPJ</label><input value={cpf} onChange={e=>setCpf(e.target.value)} className="input-field mt-1.5" placeholder="000.000.000-00"/></div>
          <div><label className="text-xs font-semibold text-slate-600 uppercase">Endereco</label><input value={endereco} onChange={e=>setEndereco(e.target.value)} className="input-field mt-1.5" placeholder="Rua, numero, bairro"/></div>
        </div>
      </div>

      <div className="card space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Produtos</h3>
          <span className="text-xs text-slate-400">{itens.length} item(ns)</span>
        </div>

        {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">{msg}</div>}

        <div className="flex gap-2 items-end">
          <div className="flex-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Produto</label><input value={formItem.nome} onChange={e=>setFormItem({...formItem,nome:e.target.value})} className="input-field mt-1 text-xs" placeholder="Nome do produto"/></div>
          <div className="w-24"><label className="text-[10px] font-semibold text-slate-500 uppercase">Codigo</label><input value={formItem.codigo} onChange={e=>setFormItem({...formItem,codigo:e.target.value})} className="input-field mt-1 text-xs"/></div>
          <div className="w-16"><label className="text-[10px] font-semibold text-slate-500 uppercase">Qtd</label><input type="number" value={formItem.quantidade} onChange={e=>setFormItem({...formItem,quantidade:e.target.value})} className="input-field mt-1 text-xs" min="1"/></div>
          <div className="w-28"><label className="text-[10px] font-semibold text-slate-500 uppercase">Vlr Unit</label><input type="number" step="0.01" value={formItem.valorUnitario} onChange={e=>setFormItem({...formItem,valorUnitario:e.target.value})} className="input-field mt-1 text-xs"/></div>
          <button onClick={addItem} className="btn-primary text-xs px-3 h-[38px]">+</button>
        </div>

        {itens.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50"><th className="text-left py-2 px-3 font-medium text-slate-500">Produto</th><th className="text-left py-2 px-3 font-medium text-slate-500">Cod</th><th className="text-center py-2 px-3 font-medium text-slate-500">Qtd</th><th className="text-right py-2 px-3 font-medium text-slate-500">Unit</th><th className="text-right py-2 px-3 font-medium text-slate-500">Total</th><th className="text-right py-2 px-3"></th></tr></thead>
              <tbody>{itens.map(i=>(
                <tr key={i.id} className="border-t border-slate-50">
                  <td className="py-1.5 px-3 text-slate-700">{i.nome}</td><td className="py-1.5 px-3 text-slate-400 font-mono">{i.codigo||'-'}</td><td className="py-1.5 px-3 text-center">{i.quantidade}</td><td className="py-1.5 px-3 text-right text-slate-500">{fm(i.valorUnitario)}</td><td className="py-1.5 px-3 text-right font-bold">{fm(i.valorUnitario*i.quantidade)}</td>
                  <td className="py-1.5 px-3 text-right"><button onClick={()=>removeItem(i.id)} className="text-red-500 text-[10px]">x</button></td>
                </tr>
              ))}</tbody>
              <tfoot><tr className="bg-brand-50"><td colSpan={4} className="py-2.5 px-3 text-right text-sm font-bold text-slate-700">Total</td><td className="py-2.5 px-3 text-right text-sm font-extrabold text-brand-700">{fm(total)}</td><td></td></tr></tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="card space-y-4 mb-6">
        <h3 className="text-sm font-bold text-slate-800">Observacoes</h3>
        <textarea value={obs} onChange={e=>setObs(e.target.value)} className="input-field" rows={2} placeholder="Observacoes adicionais..."/>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={imprimir} disabled={itens.length===0} className="btn-primary text-xs inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Imprimir / Gerar PDF
        </button>
      </div>
    </div>
  );
}
