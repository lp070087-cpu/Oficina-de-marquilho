'use client';
// VERSÃO SCANNER 2026 — SCANNER UNIVERSAL + INTEGRAÇÃO (FASE 15-D)
import { useState, useEffect } from 'react';
import ScannerUniversal from '@/components/scanner/ScannerUniversal';
import { useEstoqueRefresh } from '@/lib/estoque-events';

interface Categoria { id:string; nome:string; slug:string; }
interface Peca { id:string; nome:string; codigo:string; codigoBarras?:string; precoVenda:number; precoCusto:number; custoMedio:number; quantidade:number; quantidadeLoja:number; estoqueMinimo:number; marca?:string; compatibilidade?:string; localizacao?:string; categoria:{nome:string;id:string}; }

export default function EstoqueScannerPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [found, setFound] = useState<Peca|null>(null);
  const [qtdCentral, setQtdCentral] = useState('1');
  const [qtdLoja, setQtdLoja] = useState('0');
  const [valorCusto, setValorCusto] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');
  const [cadastroNovo, setCadastroNovo] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formNovo, setFormNovo] = useState({
    nome:'', codigo:'', codigoBarras:'', marca:'',
    precoVenda:'', precoCusto:'', compatibilidade:'', categoriaId:'',
    quantidade:'0', quantidadeLoja:'0', estoqueMinimo:'5',
    fornecedor:'', localizacao:'', descricao:'',
  });
  const { triggerRefresh } = useEstoqueRefresh();

  useEffect(() => { fetch('/api/categorias').then(r => r.json()).then(setCategorias).catch(() => {}); }, []);

  async function buscar(code:string) {
    if (!code.trim()) return;
    setLoading(true); setMsg(''); setMsgOk(''); setFound(null); setCadastroNovo(false);
    const res = await fetch(`/api/pecas?barcode=${encodeURIComponent(code.trim())}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length>0) {
      const p = data[0];
      setFound(p);
      setValorCusto(p.custoMedio?String(Number(p.custoMedio)):String(Number(p.precoCusto)));
    } else {
      setCadastroNovo(true);
      setFormNovo({ nome:'', codigo:'', codigoBarras:code, marca:'', precoVenda:'', precoCusto:'', compatibilidade:'', categoriaId:categorias[0]?.id||'', quantidade:'0', quantidadeLoja:'0', estoqueMinimo:'5', fornecedor:'', localizacao:'', descricao:'' });
    }
    setLoading(false);
  }

  function handleDetected(code:string) { setShowScanner(false); buscar(code); }

  async function entradaEstoque() {
    if (!found) return;
    const qc = parseInt(qtdCentral)||0;
    const ql = parseInt(qtdLoja)||0;
    const custo = parseFloat(valorCusto)||Number(found.precoCusto);
    if (qc+ql===0) { setMsg('Informe a quantidade.'); return; }
    setLoading(true); setMsg('');
    const novaQtd = found.quantidade + qc;
    const novaQtdLoja = (found.quantidadeLoja||0) + ql;
    await fetch(`/api/pecas/${found.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...found, quantidade:novaQtd, quantidadeLoja:novaQtdLoja, precoCusto:custo, custoMedio:custo, categoriaId:found.categoria.id }) });
    if (qc>0) await fetch('/api/relatorios/movimentacao', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pecaId:found.id, tipo:'ENTRADA', quantidade:qc, valorUnitario:custo, origem:'CENTRAL', observacao:'Entrada via scanner' }) });
    if (ql>0) await fetch('/api/relatorios/movimentacao', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pecaId:found.id, tipo:'ENTRADA', quantidade:ql, valorUnitario:custo, destino:'LOJA', observacao:'Entrada direta loja' }) });
    setFound(null); setQtdCentral('1'); setQtdLoja('0');
    setMsgOk(`${qc+ql} un. adicionadas (${qc} central + ${ql} loja).`);
    triggerRefresh();
    setLoading(false);
  }

  async function cadastrarProduto() {
    if (!formNovo.nome||!formNovo.categoriaId) { setMsg('Preencha nome e categoria.'); return; }
    const qc = parseInt(formNovo.quantidade)||0;
    const ql = parseInt(formNovo.quantidadeLoja)||0;
    const custo = parseFloat(valorCusto)||0;
    const codigo = formNovo.codigo || `SCAN-${Date.now().toString(36).toUpperCase()}`;
    setLoading(true);
    const res = await fetch('/api/pecas', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...formNovo, codigo, precoVenda:Number(formNovo.precoVenda)||0, precoCusto:custo, custoMedio:custo, quantidade:qc, quantidadeLoja:ql, estoqueMinimo:Number(formNovo.estoqueMinimo)||5 }) });
    if (res.ok) {
      const p = await res.json();
      if (qc>0) await fetch('/api/relatorios/movimentacao', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pecaId:p.id, tipo:'ENTRADA', quantidade:qc, valorUnitario:custo, observacao:'Cadastro via scanner' }) });
      setCadastroNovo(false); setMsgOk(`Produto "${p.nome}" cadastrado com ${qc} un.`);
      triggerRefresh();
    } else { const e = await res.json(); setMsg(e.error||'Erro.'); }
    setLoading(false);
  }

  const fm = (v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">ENTRADA SCANNER</h1>
      <p className="text-sm text-slate-500 mb-6">Escaneie o codigo de barras com camera, USB ou digite manualmente</p>
      {msgOk&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-bold">{msgOk}</div>}
      {msg&&<div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

      {/* Botao principal — Scanner Universal */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={()=>setShowScanner(true)} className="btn-primary inline-flex items-center gap-2 text-sm flex-1 justify-center py-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
          Abrir Scanner Universal
        </button>
      </div>

      {loading&&<p className="text-xs text-slate-400 mb-4 text-center">Buscando...</p>}

      {/* Produto encontrado */}
      {found&&(
        <div className="card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{found.nome}</h3>
              <p className="text-xs text-slate-500">{found.marca||found.categoria.nome}</p>
              <p className="text-xs text-slate-400 font-mono mt-1">SKU: {found.codigo}</p>
              {found.codigoBarras&&<p className="text-xs text-slate-400 font-mono">Barcode: {found.codigoBarras}</p>}
              {found.localizacao&&<p className="text-xs text-slate-400">Local: {found.localizacao}</p>}
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Encontrado</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-400 uppercase">Central</p><p className="text-lg font-bold">{found.quantidade}</p></div>
            <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-400 uppercase">Loja</p><p className="text-lg font-bold">{found.quantidadeLoja||0}</p></div>
            <div className="bg-slate-50 rounded-lg p-3"><p className="text-[10px] text-slate-400 uppercase">Custo medio</p><p className="text-lg font-bold">{fm(Number(found.custoMedio)||Number(found.precoCusto))}</p></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Qtd Central</label><input type="number" value={qtdCentral} onChange={e=>setQtdCentral(e.target.value)} className="input-field mt-1.5 text-center font-bold" min="0"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Qtd Loja</label><input type="number" value={qtdLoja} onChange={e=>setQtdLoja(e.target.value)} className="input-field mt-1.5 text-center font-bold" min="0"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Custo Unit.</label><input type="number" step="0.01" value={valorCusto} onChange={e=>setValorCusto(e.target.value)} className="input-field mt-1.5 text-center font-bold"/></div>
          </div>

          <div className="flex gap-2">
            <button onClick={()=>setFound(null)} className="btn-secondary text-xs">Cancelar</button>
            <button onClick={entradaEstoque} disabled={loading} className="btn-primary text-xs flex-1">Confirmar entrada</button>
          </div>
        </div>
      )}

      {/* Cadastro novo */}
      {cadastroNovo && (
        <div className="card space-y-3 mt-6 border-2 border-amber-300 bg-amber-50/30">
          <div className="flex items-center gap-2 text-amber-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <h3 className="text-sm font-bold">Produto nao encontrado — Cadastrar novo</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase">Nome *</label><input value={formNovo.nome} onChange={e=>setFormNovo({...formNovo,nome:e.target.value})} className="input-field mt-1.5 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">SKU</label><input value={formNovo.codigo} onChange={e=>setFormNovo({...formNovo,codigo:e.target.value})} className="input-field mt-1.5 text-xs" placeholder="Auto-gerado se vazio"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Cod. Barras</label><input value={formNovo.codigoBarras} onChange={e=>setFormNovo({...formNovo,codigoBarras:e.target.value})} className="input-field mt-1.5 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Categoria *</label><select value={formNovo.categoriaId} onChange={e=>setFormNovo({...formNovo,categoriaId:e.target.value})} className="input-field mt-1.5 text-xs"><option value="">Selecionar</option>{categorias.map(c=>(<option key={c.id} value={c.id}>{c.nome}</option>))}</select></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Marca</label><input value={formNovo.marca} onChange={e=>setFormNovo({...formNovo,marca:e.target.value})} className="input-field mt-1.5 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Fornecedor</label><input value={formNovo.fornecedor} onChange={e=>setFormNovo({...formNovo,fornecedor:e.target.value})} className="input-field mt-1.5 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Compatibilidade</label><input value={formNovo.compatibilidade} onChange={e=>setFormNovo({...formNovo,compatibilidade:e.target.value})} className="input-field mt-1.5 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Localizacao</label><input value={formNovo.localizacao} onChange={e=>setFormNovo({...formNovo,localizacao:e.target.value})} className="input-field mt-1.5 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Preco Venda</label><input type="number" step="0.01" value={formNovo.precoVenda} onChange={e=>setFormNovo({...formNovo,precoVenda:e.target.value})} className="input-field mt-1.5 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Preco Custo</label><input type="number" step="0.01" value={formNovo.precoCusto} onChange={e=>setFormNovo({...formNovo,precoCusto:e.target.value})} className="input-field mt-1.5 text-xs"/></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Qtd Central</label><input type="number" value={formNovo.quantidade} onChange={e=>setFormNovo({...formNovo,quantidade:e.target.value})} className="input-field mt-1.5 text-center font-bold" min="0"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Qtd Loja</label><input type="number" value={formNovo.quantidadeLoja} onChange={e=>setFormNovo({...formNovo,quantidadeLoja:e.target.value})} className="input-field mt-1.5 text-center font-bold" min="0"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Est. Minimo</label><input type="number" value={formNovo.estoqueMinimo} onChange={e=>setFormNovo({...formNovo,estoqueMinimo:e.target.value})} className="input-field mt-1.5 text-center font-bold" min="1"/></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={()=>setCadastroNovo(false)} className="btn-secondary text-xs">Cancelar</button>
            <button onClick={cadastrarProduto} disabled={loading} className="btn-primary text-xs">{loading?'Salvando...':'Cadastrar produto'}</button>
          </div>
        </div>
      )}

      {showScanner && <ScannerUniversal onDetected={handleDetected} onClose={()=>setShowScanner(false)} />}
    </div>
  );
}
