'use client';
// VERSÃO IMPORTAR 2026

import { useState, useRef } from 'react';

type Metodo = 'csv' | 'excel' | 'pdf' | 'imagem' | 'ia' | null;

interface ProdutoEntrada {
  idx: number;
  codigoBarras: string; codigoInterno: string; oem: string; sku: string;
  nome: string; marca: string; categoria: string; fornecedor: string;
  quantidade: string; precoCusto: string; precoVenda: string;
  qtdLoja: string; qtdCentral: string;
  existe: boolean; pecaExistente?: any;
}

export default function ImportarPage() {
  const [metodo, setMetodo] = useState<Metodo>(null);
  const [produtos, setProdutos] = useState<ProdutoEntrada[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [resultado, setResultado] = useState<{criados:number;atualizados:number;total:number}|null>(null);
  const [arquivoNome, setArquivoNome] = useState('');
  const [textoIA, setTextoIA] = useState('');
  const [anexoIA, setAnexoIA] = useState<File|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const iaFileRef = useRef<HTMLInputElement>(null);

  function reset() { setMetodo(null); setProdutos([]); setMsg(''); setResultado(null); setArquivoNome(''); setTextoIA(''); setAnexoIA(null); }

  function parseCSV(texto:string): Partial<ProdutoEntrada>[] {
    const lines = texto.trim().split('\n').filter(l=>l.trim());
    if (lines.length<2) return [];
    const h = lines[0].toLowerCase().split(',').map((s:string)=>s.trim().replace(/["']/g,''));
    const mi = (k:string)=>h.findIndex((x:string)=>x===k||x.includes(k));
    const ci=mi('codigo'); const si=mi('sku'); const ni=mi('nome'); const pi=mi('preco'); const ci2=mi('custo'); const qi=mi('quantidade'); const bi=mi('barras');
    return lines.slice(1).map((l,i)=>({
      idx:i, codigoBarras:bi>=0?(l.split(',')[bi]||'').trim():'', codigoInterno:'', oem:'',
      sku:si>=0?(l.split(',')[si]||'').trim():ci>=0?(l.split(',')[ci]||'').trim():'',
      nome:ni>=0?(l.split(',')[ni]||'').trim():'', marca:'', categoria:'', fornecedor:'',
      quantidade:qi>=0?(l.split(',')[qi]||'').trim():'',
      precoCusto:ci2>=0?((l.split(',')[ci2]||'').trim().replace(/[R$\s]/g,'')):'',
      precoVenda:pi>=0?((l.split(',')[pi]||'').trim().replace(/[R$\s]/g,'')):'',
      qtdLoja:'0', qtdCentral:(qi>=0?(l.split(',')[qi]||'').trim():'1'), existe:false,
    }));
  }

  async function processarLinhas(linhas: Partial<ProdutoEntrada>[]) {
    setLoading(true);
    const enriquecidas: ProdutoEntrada[] = [];
    for (const l of linhas) {
      const peca = l.codigoBarras ? await fetch(`/api/pecas?barcode=${encodeURIComponent(l.codigoBarras)}`).then(r=>r.json()).catch(()=>[]) : [];
      const pecaPorSku = l.sku ? await fetch(`/api/pecas?q=${encodeURIComponent(l.sku)}`).then(r=>r.json()).catch(()=>[]) : [];
      const existente = (Array.isArray(peca)&&peca.length>0) ? peca[0] : (Array.isArray(pecaPorSku)&&pecaPorSku.length>0) ? pecaPorSku[0] : null;
      enriquecidas.push({
        idx: l.idx||0, codigoBarras:l.codigoBarras||'', codigoInterno:l.codigoInterno||'', oem:l.oem||'',
        sku:l.sku||'', nome:l.nome||'', marca:l.marca||'', categoria:l.categoria||'', fornecedor:l.fornecedor||'',
        quantidade:l.quantidade||'1', precoCusto:l.precoCusto||'', precoVenda:l.precoVenda||'',
        qtdLoja:l.qtdLoja||'0', qtdCentral:l.qtdCentral||l.quantidade||'1',
        existe:!!existente, pecaExistente:existente,
      });
    }
    setProdutos(enriquecidas);
    setLoading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, tipo: 'csv'|'excel'|'pdf'|'imagem') {
    const file = e.target.files?.[0]; if (!file) return;
    setArquivoNome(file.name); setLoading(true); setMsg(''); setResultado(null);
    if (tipo==='csv') {
      const text = await file.text();
      const linhas = parseCSV(text);
      if (linhas.length===0) { setMsg('Nenhum dado encontrado no arquivo.'); setLoading(false); return; }
      await processarLinhas(linhas);
    } else if (tipo==='excel') {
      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type:'array' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { header:1 });
        if (!jsonData||jsonData.length<2) { setMsg('Planilha vazia ou sem dados.'); setLoading(false); return; }
        const headers = (jsonData[0] as string[]).map((h:string)=>String(h||'').toLowerCase().trim());
        const findCol = (...keys:string[])=>headers.findIndex((h:string)=>keys.some(k=>h.includes(k)));
        const ci=findCol('codigo','sku','cod'); const ni=findCol('nome','descricao','produto','desc');
        const qi=findCol('quantidade','qtd','estoque','saldo'); const pi=findCol('preco','venda','valor');
        const ci2=findCol('custo'); const bi=findCol('barras','barcode');
        const mar=findCol('marca'); const cat=findCol('categoria');
        const linhas: Partial<ProdutoEntrada>[] = jsonData.slice(1).filter((row:any)=>row&&row.length>0).map((row:any,i:number)=>({
          idx:i, codigoBarras:bi>=0?String(row[bi]||'').trim():'', codigoInterno:'', oem:'',
          sku:ci>=0?String(row[ci]||'').trim():'', nome:ni>=0?String(row[ni]||'').trim():'',
          marca:mar>=0?String(row[mar]||'').trim():'', categoria:cat>=0?String(row[cat]||'').trim():'',
          fornecedor:'', quantidade:qi>=0?String(row[qi]||'1').trim():'1',
          precoCusto:ci2>=0?String(row[ci2]||'').replace(/[R$\s]/g,'').trim():'',
          precoVenda:pi>=0?String(row[pi]||'').replace(/[R$\s]/g,'').trim():'',
          qtdLoja:'0', qtdCentral:qi>=0?String(row[qi]||'1').trim():'1', existe:false,
        }));
        await processarLinhas(linhas);
      } catch(e) { setMsg('Erro ao ler Excel. Verifique o formato do arquivo.'); }
    } else if (tipo==='pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs`;
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const linhas: Partial<ProdutoEntrada>[] = [];
        for (let pIdx=1; pIdx<=pdf.numPages; pIdx++) {
          const page = await pdf.getPage(pIdx);
          const content = await page.getTextContent();
          const text = content.items.map((item:any)=>item.str).join(' ');
          const lines = text.split('\n').filter((l:string)=>l.trim().length>5);
          for (const line of lines) {
            const match = line.match(/([A-Z0-9\-]{3,})\s+([\w\sÀ-Ú\.\,\-\/\(\)]{5,})/i);
            if (match) linhas.push({ idx:linhas.length, codigoBarras:'', codigoInterno:'', oem:'', sku:match[1].trim(), nome:match[2].trim(), marca:'', categoria:'', fornecedor:'', quantidade:'1', precoCusto:'', precoVenda:'', qtdLoja:'0', qtdCentral:'1', existe:false });
          }
        }
        if (linhas.length===0) { setMsg('Nenhum produto encontrado no PDF.'); setLoading(false); return; }
        await processarLinhas(linhas);
      } catch(e) { setMsg('Erro ao ler PDF. Verifique o arquivo.'); }
    } else if (tipo==='imagem') {
      try {
        const Tesseract = await import('tesseract.js');
        const imgUrl = URL.createObjectURL(file);
        const { data: { text } } = await Tesseract.recognize(imgUrl, 'por+eng', { logger: (m:any) => { if (m.status==='recognizing text') setMsg(`OCR: ${Math.round(m.progress*100)}%`); } });
        URL.revokeObjectURL(imgUrl);
        setMsg('Imagem analisada. Confira os dados extraidos antes de abastecer.');
        const linhas: Partial<ProdutoEntrada>[] = [];
        const lines = text.split('\n').filter((l:string)=>l.trim().length>3);
        for (const line of lines) {
          const match = line.match(/([A-Z0-9\-]{3,})\s+([\w\sÀ-Ú\.\,\-\/\(\)]{5,})/i);
          if (match) linhas.push({ idx:linhas.length, codigoBarras:'', codigoInterno:'', oem:'', sku:match[1].trim(), nome:match[2].trim(), marca:'', categoria:'', fornecedor:'', quantidade:'1', precoCusto:'', precoVenda:'', qtdLoja:'0', qtdCentral:'1', existe:false });
        }
        if (linhas.length===0) { setMsg('Nao foi possivel identificar produtos na imagem. Digite manualmente.'); setLoading(false); return; }
        await processarLinhas(linhas);
      } catch(e) { setMsg('Erro no OCR. Tente uma imagem mais nitida.'); }
    }
    setLoading(false);
  }

  async function processarIA() {
    const texto = textoIA.trim();
    if (!texto && !anexoIA) { setMsg('Digite algo ou anexe um arquivo.'); return; }
    setLoading(true); setMsg('');
    // Parse IA text
    const linhas: Partial<ProdutoEntrada>[] = [];
    const lines = texto.split('\n').filter(l=>l.trim());
    for (const line of lines) {
      const match = line.match(/(\d+)\s*(?:unidades?|un\.?|litros?|L|kits?)?\s*(?:de\s+)?(.+)/i);
      if (match) {
        linhas.push({ idx:linhas.length, codigoBarras:'', codigoInterno:'', oem:'', sku:'', nome:match[2].trim(), marca:'', categoria:'', fornecedor:'', quantidade:match[1], precoCusto:'', precoVenda:'', qtdLoja:'0', qtdCentral:match[1], existe:false });
      } else if (line.length>3) {
        linhas.push({ idx:linhas.length, codigoBarras:'', codigoInterno:'', oem:'', sku:'', nome:line.trim(), marca:'', categoria:'', fornecedor:'', quantidade:'1', precoCusto:'', precoVenda:'', qtdLoja:'0', qtdCentral:'1', existe:false });
      }
    }
    if (linhas.length===0) { setMsg('Nao foi possivel identificar produtos no texto.'); setLoading(false); return; }
    await processarLinhas(linhas);
  }

  function updateProduto(idx:number, field:keyof ProdutoEntrada, value:string) {
    setProdutos(prev => prev.map(p => p.idx===idx ? {...p, [field]:value} : p));
  }

  async function abastecerEstoque() {
    setLoading(true); setMsg(''); setResultado(null);
    let criados=0, atualizados=0;
    const catRes = await fetch('/api/categorias');
    const cats = await catRes.json();
    const catId = cats[0]?.id||'';
    for (const p of produtos) {
      const body = {
        nome: p.nome, codigo: p.sku||`IMP-${Date.now()}-${p.idx}`, codigoBarras: p.codigoBarras||null,
        precoVenda: parseFloat(p.precoVenda)||0, precoCusto: parseFloat(p.precoCusto)||0, custoMedio: parseFloat(p.precoCusto)||0,
        quantidade: parseInt(p.qtdCentral)||parseInt(p.quantidade)||1,
        quantidadeLoja: parseInt(p.qtdLoja)||0,
        marca: p.marca||null, compatibilidade: null, categoriaId: catId,
      };
      if (p.existe && p.pecaExistente) {
        const res = await fetch(`/api/pecas/${p.pecaExistente.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...p.pecaExistente, quantidade: (p.pecaExistente.quantidade||0)+(parseInt(p.qtdCentral)||1), quantidadeLoja: (p.pecaExistente.quantidadeLoja||0)+(parseInt(p.qtdLoja)||0), categoriaId: p.pecaExistente.categoria?.id||catId, precoCusto: parseFloat(p.precoCusto)||p.pecaExistente.precoCusto, precoVenda: parseFloat(p.precoVenda)||p.pecaExistente.precoVenda }) });
        if (res.ok) atualizados++;
      } else {
        const res = await fetch('/api/pecas', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
        if (res.ok) criados++;
      }
      // Register movement
      await fetch('/api/relatorios/movimentacao', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pecaId:'', tipo:'ENTRADA', quantidade: parseInt(p.qtdCentral)||1, valorUnitario: parseFloat(p.precoCusto)||0, observacao:'Entrada via '+metodo }) });
    }
    setResultado({ criados, atualizados, total:produtos.length });
    setLoading(false);
  }

  const metodos: { key: 'csv'|'excel'|'pdf'|'imagem'; titulo: string; desc: string; icon: string; accept?: string }[] = [
    { key:'csv', titulo:'CSV', desc:'Importar arquivo CSV com dados dos produtos', icon:'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', accept:'.csv'},
    { key:'excel', titulo:'Excel', desc:'Importar planilha .xlsx ou .xls', icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', accept:'.xlsx,.xls'},
    { key:'pdf', titulo:'PDF', desc:'Nota fiscal, pedido ou catalogo em PDF', icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', accept:'.pdf'},
    { key:'imagem', titulo:'Imagem / OCR', desc:'Foto de nota fiscal, etiqueta ou catalogo', icon:'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', accept:'.png,.jpg,.jpeg,.webp,.bmp,.tiff'},
  ];

  if (!metodo) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">ENTRADA INTELIGENTE DE ESTOQUE</h1>
        <p className="text-sm text-slate-500 mb-6">Escolha como deseja abastecer o estoque central</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {metodos.map(m => (
            <button key={m.key} onClick={() => setMetodo(m.key)}
              className="card flex flex-col items-center justify-center text-center p-6 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer min-h-[160px]">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-3 group-hover:bg-brand-100">
                <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={m.icon}/></svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{m.titulo}</h3>
              <p className="text-xs text-slate-400">{m.desc}</p>
              {m.accept && <input ref={fileRef} type="file" accept={m.accept} className="hidden" onChange={e=>handleFileUpload(e, m.key!)}/>}
            </button>
          ))}
          <button key="ia" onClick={() => setMetodo('ia')}
            className="card flex flex-col items-center justify-center text-center p-6 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer min-h-[160px]">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Assistente IA</h3>
            <p className="text-xs text-slate-400">Digitar, colar, audio ou imagem</p>
          </button>
        </div>
      </div>
    );
  }

  // Subfluxo CSV/Excel/PDF/Imagem
  if (metodo==='csv'||metodo==='excel'||metodo==='pdf'||metodo==='imagem') {
    const methodMeta = metodos.find(m=>m.key===metodo)!;
    return (
      <div className="p-6">
        <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 mb-2 inline-block">← Voltar</button>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">{methodMeta.titulo}</h1>
        <p className="text-sm text-slate-500 mb-6">{methodMeta.desc}</p>
        {msg && <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

        {produtos.length===0 && !loading && (
          <button onClick={()=>fileRef.current?.click()} className="btn-primary text-xs mb-6">
            Selecionar arquivo {methodMeta.accept}
          </button>
        )}
        <input ref={fileRef} type="file" accept={methodMeta.accept} className="hidden" onChange={e=>handleFileUpload(e, metodo)}/>

        {loading && (
          <div className="card text-center py-8 mb-4">
            <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
            <p className="text-sm text-slate-500">{arquivoNome ? `Analisando ${arquivoNome}...` : 'Processando...'}</p>
          </div>
        )}

        {produtos.length>0 && (
          <>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label:'Produtos encontrados', value:produtos.length },
                { label:'Ja existem', value:produtos.filter(p=>p.existe).length },
                { label:'Novos', value:produtos.filter(p=>!p.existe).length },
                { label:'Total unidades', value:produtos.reduce((s,p)=>s+(parseInt(p.qtdCentral)||0),0) },
              ].map((c,i)=>(
                <div key={i} className="card-stat"><p className="text-[10px] text-slate-400 uppercase mb-1">{c.label}</p><p className="text-lg font-bold">{c.value}</p></div>
              ))}
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
              Confira se as informacoes extraidas estao corretas antes de abastecer o estoque.
            </p>

            <div className="card-table overflow-auto mb-4">
              <table className="w-full text-[10px]">
                <thead><tr className="border-b border-slate-100 bg-slate-50/60 sticky top-0">
                  <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Barras</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">SKU</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Nome</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Marca</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Categoria</th>
                  <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Forn.</th>
                  <th className="text-center py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Qtd</th>
                  <th className="text-right py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Custo</th>
                  <th className="text-right py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Venda</th>
                  <th className="text-center py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Loja</th>
                </tr></thead>
                <tbody>{produtos.map((p,i)=>(
                  <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                    <td className="py-1 px-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${p.existe?'bg-emerald-50 text-emerald-700':'bg-brand-50 text-brand-700'}`}>{p.existe?'Existe':'Novo'}</span>
                    </td>
                    <td className="py-1 px-1.5"><input value={p.codigoBarras} onChange={e=>updateProduto(p.idx,'codigoBarras',e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] font-mono" placeholder="-"/></td>
                    <td className="py-1 px-1.5"><input value={p.sku} onChange={e=>updateProduto(p.idx,'sku',e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] font-mono w-16" placeholder="-"/></td>
                    <td className="py-1 px-1.5"><input value={p.nome} onChange={e=>updateProduto(p.idx,'nome',e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] font-medium" placeholder="Nome"/></td>
                    <td className="py-1 px-1.5"><input value={p.marca} onChange={e=>updateProduto(p.idx,'marca',e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] w-16" placeholder="-"/></td>
                    <td className="py-1 px-1.5"><input value={p.categoria} onChange={e=>updateProduto(p.idx,'categoria',e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] w-20" placeholder="-"/></td>
                    <td className="py-1 px-1.5"><input value={p.fornecedor} onChange={e=>updateProduto(p.idx,'fornecedor',e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] w-16" placeholder="-"/></td>
                    <td className="py-1 px-1.5"><input type="number" value={p.qtdCentral} onChange={e=>updateProduto(p.idx,'qtdCentral',e.target.value)} className="w-12 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] text-center font-bold"/></td>
                    <td className="py-1 px-1.5"><input type="number" step="0.01" value={p.precoCusto} onChange={e=>updateProduto(p.idx,'precoCusto',e.target.value)} className="w-16 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] text-right" placeholder="0,00"/></td>
                    <td className="py-1 px-1.5"><input type="number" step="0.01" value={p.precoVenda} onChange={e=>updateProduto(p.idx,'precoVenda',e.target.value)} className="w-16 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] text-right" placeholder="0,00"/></td>
                    <td className="py-1 px-1.5"><input type="number" value={p.qtdLoja} onChange={e=>updateProduto(p.idx,'qtdLoja',e.target.value)} className="w-10 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] text-center"/></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={abastecerEstoque} disabled={loading} className="btn-primary text-xs">Abastecer Estoque Central</button>
              <button onClick={reset} className="btn-secondary text-xs">Cancelar</button>
            </div>
          </>
        )}

        {resultado && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="font-bold text-emerald-800 mb-1">Importacao concluida!</p>
            <p className="text-sm text-emerald-700">{resultado.criados} criados, {resultado.atualizados} atualizados. Total: {resultado.total} produtos.</p>
            <button onClick={reset} className="btn-primary text-xs mt-3">Nova importacao</button>
          </div>
        )}
      </div>
    );
  }

  // Subfluxo IA
  return (
    <div className="p-6">
      <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 mb-2 inline-block">← Voltar</button>
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Assistente IA</h1>
      <p className="text-sm text-slate-500 mb-6">Descreva os produtos recebidos ou anexe arquivos</p>
      {msg && <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

      <div className="card mb-4">
        <textarea value={textoIA} onChange={e=>setTextoIA(e.target.value)} className="input-field font-mono text-xs" rows={8}
          placeholder={'Exemplos:\n\nEntraram 10 litros de oleo 20W50\nChegaram 5 kits de embreagem CG 160\nRecebi 3 pastilhas de freio dianteira por R$ 45,90 cada\n2 pneus 90/90-18 Pirelli a R$ 220,00'}/>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label className="btn-secondary text-xs cursor-pointer inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
          {anexoIA ? anexoIA.name : 'Anexar imagem/PDF'}
          <input ref={iaFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e=>{setAnexoIA(e.target.files?.[0]||null);}}/>
        </label>
        <button onClick={processarIA} disabled={loading} className="btn-primary text-xs">Analisar</button>
      </div>

      {loading && (
        <div className="card text-center py-8 mb-4">
          <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-sm text-slate-500">Interpretando...</p>
        </div>
      )}

      {produtos.length>0 && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label:'Produtos identificados', value:produtos.length },
              { label:'Ja existem', value:produtos.filter(p=>p.existe).length },
              { label:'Novos', value:produtos.filter(p=>!p.existe).length },
            ].map((c,i)=>(
              <div key={i} className="card-stat"><p className="text-[10px] text-slate-400 uppercase mb-1">{c.label}</p><p className="text-lg font-bold">{c.value}</p></div>
            ))}
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
            Confira se as informacoes estao corretas antes de abastecer.
          </p>

          <div className="card-table overflow-auto mb-4">
            <table className="w-full text-[10px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Nome</th>
                <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500 uppercase">SKU</th>
                <th className="text-center py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Qtd</th>
                <th className="text-right py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Custo</th>
                <th className="text-right py-1.5 px-1.5 font-semibold text-slate-500 uppercase">Venda</th>
              </tr></thead>
              <tbody>{produtos.map((p,i)=>(
                <tr key={i} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                  <td className="py-1 px-1.5"><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${p.existe?'bg-emerald-50 text-emerald-700':'bg-brand-50 text-brand-700'}`}>{p.existe?'Existe':'Novo'}</span></td>
                  <td className="py-1 px-1.5"><input value={p.nome} onChange={e=>updateProduto(p.idx,'nome',e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] font-medium" placeholder="Nome"/></td>
                  <td className="py-1 px-1.5"><input value={p.sku} onChange={e=>updateProduto(p.idx,'sku',e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] font-mono w-16" placeholder="-"/></td>
                  <td className="py-1 px-1.5"><input type="number" value={p.qtdCentral} onChange={e=>updateProduto(p.idx,'qtdCentral',e.target.value)} className="w-12 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] text-center font-bold"/></td>
                  <td className="py-1 px-1.5"><input type="number" step="0.01" value={p.precoCusto} onChange={e=>updateProduto(p.idx,'precoCusto',e.target.value)} className="w-16 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] text-right"/></td>
                  <td className="py-1 px-1.5"><input type="number" step="0.01" value={p.precoVenda} onChange={e=>updateProduto(p.idx,'precoVenda',e.target.value)} className="w-16 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] text-right"/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={abastecerEstoque} disabled={loading} className="btn-primary text-xs">Confirmar Entrada</button>
            <button onClick={reset} className="btn-secondary text-xs">Cancelar</button>
          </div>
        </>
      )}

      {resultado && (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="font-bold text-emerald-800 mb-1">Concluido!</p>
          <p className="text-sm text-emerald-700">{resultado.criados} criados, {resultado.atualizados} atualizados. Total: {resultado.total}.</p>
          <button onClick={reset} className="btn-primary text-xs mt-3">Nova entrada</button>
        </div>
      )}
    </div>
  );
}
