'use client';

import { useState } from 'react';

export default function AssistenteIAPage() {
  const [imagens, setImagens] = useState<File[]>([]);
  const [texto, setTexto] = useState('');
  const [previa, setPrevia] = useState<any[]>([]);
  const [resultado, setResultado] = useState<{criados:number;atualizados:number;erros:string[];totalProcessado:number}|null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImagens(prev => [...prev, ...files]);
  }

  function removerImagem(idx: number) { setImagens(prev => prev.filter((_,i) => i !== idx)); }

  function parseTexto(): any[] {
    if (!texto.trim()) return [];
    const lines = texto.trim().split('\n').filter(l => l.trim());
    return lines.map(l => {
      const cols = l.split('\t');
      if (cols.length >= 2) {
        return { codigo: cols[0]?.trim(), nome: cols[1]?.trim(), precoVenda: cols[2]?.replace(/[R$\s]/g,'')?.trim(), precoCusto: cols[3]?.replace(/[R$\s]/g,'')?.trim(), quantidade: cols[4]?.trim() };
      }
      const csvCols = l.split(',').map(c => c.trim().replace(/["']/g,''));
      if (csvCols.length >= 2 && !csvCols[0].toLowerCase().includes('codigo')) {
        return { codigo: csvCols[0], nome: csvCols[1], precoVenda: csvCols[2]?.replace(/[R$\s]/g,''), precoCusto: csvCols[3]?.replace(/[R$\s]/g,''), quantidade: csvCols[4] };
      }
      return { codigo: '', nome: l.trim(), precoVenda: '', precoCusto: '', quantidade: '' };
    });
  }

  async function analisar() {
    const linhas = parseTexto();
    if (linhas.length === 0 && imagens.length === 0) { setMsg('Cole dados ou selecione imagens.'); return; }
    setPrevia(linhas);
    setMsg('');
  }

  async function processar() {
    const linhas = previa.length > 0 ? previa : parseTexto();
    if (linhas.length === 0) { setMsg('Nenhum dado para processar.'); return; }
    setLoading(true); setMsg(''); setResultado(null);
    try {
      const res = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linhas, categoriaDefaultId: '' }),
      });
      const data = await res.json();

      // Upload de imagens se houver (associar às peças processadas)
      if (imagens.length > 0) {
        for (let i = 0; i < Math.min(imagens.length, linhas.length); i++) {
          // Tenta achar a peça criada pelo código
          const codigo = linhas[i]?.codigo;
          if (codigo) {
            const pecaRes = await fetch(`/api/pecas?q=${encodeURIComponent(codigo)}`);
            const pecas = await pecaRes.json();
            const peca = pecas.find((p: any) => p.codigo === codigo);
            if (peca) {
              const fd = new FormData();
              fd.append('imagem', imagens[i]);
              fd.append('pecaId', peca.id);
              await fetch('/api/upload', { method: 'POST', body: fd });
            }
          }
        }
      }

      setResultado(data);
      setPrevia([]);
      setTexto('');
      setImagens([]);
    } catch { setMsg('Erro ao processar.'); }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">ASSISTENTE IA</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cadastro automatico com imagens</p>
      </div>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1A2E] via-[#1a2d4a] to-[#1e3a5f] p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"/>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/10 rounded-full translate-y-1/4 -translate-x-1/4 blur-3xl"/>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-600/30 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg>
            </div>
            <h2 className="text-lg font-bold">CADASTRO AUTOMATICO COM IMAGENS</h2>
          </div>
          <p className="text-sm text-white/70 max-w-2xl">Cole a lista de pecas, selecione as fotos e o assistente cadastra tudo automaticamente.</p>
        </div>
      </div>

      {/* Imagens */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 mb-3">📷 Fotos dos produtos (PNG, JPG, WebP)</h3>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {imagens.map((f, i) => (
            <div key={i} className="relative group">
              <img src={URL.createObjectURL(f)} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200"/>
              <button onClick={()=>removerImagem(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
              <p className="text-[9px] text-slate-400 mt-0.5 truncate w-20 text-center">{f.name}</p>
            </div>
          ))}
          <label className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
            <span className="text-[9px] text-slate-400 mt-1">Adicionar</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles}/>
          </label>
        </div>
        <p className="text-[10px] text-slate-400">Cada imagem sera associada a uma peca na ordem da lista</p>
      </div>

      {/* Texto */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-800 mb-3">📋 Lista de pecas</h3>
        <p className="text-xs text-slate-400 mb-2">Cole do Excel: CODIGO [TAB] NOME [TAB] PRECO [TAB] CUSTO [TAB] QUANTIDADE</p>
        <textarea value={texto} onChange={e=>setTexto(e.target.value)} className="input-field font-mono text-xs" rows={10}
          placeholder="EX001\tEscapamento Esportivo CG 160\t220.00\t145.00\t3&#10;FR010\tDisco de Freio XRE 300\t180.00\t120.00\t2&#10;EL020\tRegulador Bros 160\t85.00\t55.00\t4"/>
      </div>

      {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs">{msg}</div>}

      <div className="flex items-center gap-3">
        <button onClick={analisar} disabled={!texto.trim()&&imagens.length===0} className="btn-secondary text-xs">Analisar / Pre-visualizar</button>
        <button onClick={processar} disabled={loading||(!texto.trim()&&imagens.length===0)} className="btn-primary text-xs">{loading?'Processando...':'Processar tudo'}</button>
      </div>

      {/* Preview */}
      {previa.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Pre-visualizacao ({previa.length} itens)</h3>
          <div className="overflow-auto max-h-60">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Codigo</th>
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Nome</th>
                <th className="text-right py-2 px-2 font-semibold text-slate-500">Preco</th>
                <th className="text-right py-2 px-2 font-semibold text-slate-500">Qtd</th>
                <th className="text-center py-2 px-2 font-semibold text-slate-500">Imagem</th>
              </tr></thead>
              <tbody>{previa.map((l,i)=>(
                <tr key={i} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                  <td className="py-1.5 px-2 font-mono text-slate-500">{l.codigo}</td>
                  <td className="py-1.5 px-2 text-slate-700 font-medium truncate max-w-[250px]">{l.nome}</td>
                  <td className="py-1.5 px-2 text-right text-slate-600">{Number(l.precoVenda||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-slate-700">{l.quantidade||0}</td>
                  <td className="py-1.5 px-2 text-center text-[10px] text-slate-400">{imagens[i]?'✅ '+imagens[i].name:'—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {resultado && (
        <div className={`border rounded-xl p-5 ${resultado.erros.length>0?'bg-amber-50 border-amber-200':'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center"><svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></div>
            <div><p className="font-bold text-slate-800">Processado com sucesso!</p><p className="text-xs text-slate-600">{resultado.criados} criados, {resultado.atualizados} atualizados. Total: {resultado.totalProcessado}</p></div>
          </div>
          {resultado.erros.length>0&&(<div className="mt-3 pt-3 border-t border-amber-200">{resultado.erros.map((e,i)=>(<p key={i} className="text-[11px] text-amber-600">{e}</p>))}</div>)}
        </div>
      )}

      {/* Instrucoes */}
      <div className="grid grid-cols-3 gap-4">
        {[{num:'1',titulo:'Cole os dados',desc:'Copie a lista de pecas do Excel ou GSlim (codigo, nome, preco, custo, quantidade).'},
          {num:'2',titulo:'Selecione as fotos',desc:'Adicione imagens PNG ou JPG. Cada imagem corresponde a uma peca na ordem da lista.'},
          {num:'3',titulo:'Processe',desc:'Clique em Analisar para ver a pre-visualizacao e depois em Processar para cadastrar tudo.'}].map(c=>(
          <div key={c.num} className="card"><div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3"><span className="text-brand-600 font-bold text-sm">{c.num}</span></div><h3 className="text-sm font-semibold text-slate-800 mb-1">{c.titulo}</h3><p className="text-xs text-slate-500">{c.desc}</p></div>
        ))}
      </div>
    </div>
  );
}
