'use client';

import { useState, useEffect } from 'react';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';

interface Categoria { id: string; nome: string; slug: string; }
interface Peca { id: string; nome: string; codigo: string; codigoBarras?: string; precoVenda: number; precoCusto: number; quantidade: number; estoqueMinimo: number; marca?: string; compatibilidade?: string; categoria: { nome: string; id: string }; }

export default function ScannerPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [foundPeca, setFoundPeca] = useState<Peca | null>(null);
  const [quantidade, setQuantidade] = useState('1');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');

  // Cadastro rápido
  const [showCadastro, setShowCadastro] = useState(false);
  const [cadastroCode, setCadastroCode] = useState('');
  const [form, setForm] = useState({ nome: '', codigo: '', precoVenda: '', precoCusto: '', quantidade: '', categoriaId: '' });

  useEffect(() => { fetch('/api/categorias').then(r => r.json()).then(setCategorias); }, []);

  async function buscarPorCodigo(code: string) {
    if (!code.trim()) { setMsg('Digite ou escaneie um codigo.'); return; }
    setLoading(true); setMsg(''); setMsgOk(''); setFoundPeca(null); setShowCadastro(false);
    const res = await fetch(`/api/pecas?barcode=${encodeURIComponent(code.trim())}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setFoundPeca(data[0]);
    } else {
      setCadastroCode(code.trim());
      setForm({ nome: '', codigo: '', precoVenda: '', precoCusto: '', quantidade: '1', categoriaId: categorias[0]?.id || '' });
      setShowCadastro(true);
    }
    setLoading(false);
  }

  function handleDetected(code: string) {
    setShowScanner(false);
    setManualCode(code);
    buscarPorCodigo(code);
  }

  async function entradaEstoque() {
    if (!foundPeca) return;
    const qtd = parseInt(quantidade) || 1;
    setLoading(true);
    const res = await fetch(`/api/pecas/${foundPeca.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...foundPeca, quantidade: foundPeca.quantidade + qtd, categoriaId: foundPeca.categoria.id }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFoundPeca(updated);
      setQuantidade('1');
      setMsgOk(`${qtd} unidade(s) adicionada(s)! Total: ${updated.quantidade}`);
    } else { setMsg('Erro ao atualizar estoque.'); }
    setLoading(false);
  }

  async function cadastrarNovo() {
    if (!form.nome || !form.categoriaId) { setMsg('Preencha nome e categoria.'); return; }
    const body = {
      nome: form.nome,
      codigo: form.codigo || `CB-${Date.now()}`,
      codigoBarras: cadastroCode,
      precoVenda: Number(form.precoVenda) || 0,
      precoCusto: Number(form.precoCusto) || 0,
      quantidade: Number(form.quantidade) || 1,
      categoriaId: form.categoriaId,
    };
    setLoading(true); setMsg('');
    const res = await fetch('/api/pecas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const p = await res.json();
      setFoundPeca(p);
      setShowCadastro(false);
      setMsgOk('Produto cadastrado com sucesso!');
    } else {
      const e = await res.json();
      setMsg(e.error || 'Erro ao cadastrar.');
    }
    setLoading(false);
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">ENTRADA DE ESTOQUE</h1>
      <p className="text-sm text-slate-500 mb-6">Escaneie o codigo de barras ou digite manualmente</p>

      {/* Botoes */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setShowScanner(true)} className="btn-primary inline-flex items-center gap-2 text-xs flex-1 justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Escanear com camera
        </button>
      </div>

      {/* Manual */}
      <div className="flex gap-2 mb-6">
        <input value={manualCode} onChange={e => setManualCode(e.target.value)} className="input-field flex-1" placeholder="Digite o codigo de barras..."
          onKeyDown={e => { if (e.key === 'Enter') buscarPorCodigo(manualCode); }} />
        <button onClick={() => buscarPorCodigo(manualCode)} disabled={loading} className="btn-primary text-xs px-4">Buscar</button>
      </div>

      {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}
      {msgOk && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-bold">{msgOk}</div>}

      {loading && <p className="text-xs text-slate-400 mb-4">Buscando...</p>}

      {/* Produto encontrado */}
      {foundPeca && (
        <div className="card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{foundPeca.nome}</h3>
              <p className="text-xs text-slate-500">{foundPeca.marca || foundPeca.categoria.nome}</p>
              <p className="text-xs text-slate-400 font-mono mt-1">SKU: {foundPeca.codigo}</p>
              {foundPeca.codigoBarras && <p className="text-xs text-slate-400 font-mono">Barcode: {foundPeca.codigoBarras}</p>}
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Encontrado</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase">Preco</p>
              <p className="text-sm font-bold text-slate-800">{fm(foundPeca.precoVenda)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase">Custo</p>
              <p className="text-sm font-bold text-slate-800">{fm(foundPeca.precoCusto)}</p>
            </div>
            <div className={`rounded-lg p-3 ${foundPeca.quantidade <= foundPeca.estoqueMinimo ? 'bg-amber-50' : 'bg-slate-50'}`}>
              <p className="text-[10px] text-slate-400 uppercase">Estoque atual</p>
              <p className={`text-sm font-bold ${foundPeca.quantidade <= foundPeca.estoqueMinimo ? 'text-amber-600' : 'text-slate-800'}`}>{foundPeca.quantidade}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 uppercase">Qtd recebida</label>
            <input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} className="input-field w-24 text-center text-lg font-bold" min="1" />
            <button onClick={entradaEstoque} disabled={loading} className="btn-primary text-xs flex-1">
              {loading ? 'Salvando...' : `+ ${quantidade} un.`}
            </button>
          </div>
        </div>
      )}

      {/* Cadastro rapido */}
      {showCadastro && (
        <div className="card space-y-3 mt-6 border-2 border-amber-300 bg-amber-50/30">
          <div className="flex items-center gap-2 text-amber-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <h3 className="text-sm font-bold">Codigo nao encontrado — Cadastre o produto</h3>
          </div>
          <p className="text-xs text-slate-500">Codigo: <strong className="font-mono">{cadastroCode}</strong></p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase">Nome do produto</label><input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="input-field mt-1 text-xs" placeholder="Nome da peca"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Codigo (SKU)</label><input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="input-field mt-1 text-xs" placeholder="Opcional"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Categoria</label><select value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})} className="input-field mt-1 text-xs"><option value="">Selecionar</option>{categorias.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}</select></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Preco venda</label><input type="number" step="0.01" value={form.precoVenda} onChange={e => setForm({...form, precoVenda: e.target.value})} className="input-field mt-1 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Preco custo</label><input type="number" step="0.01" value={form.precoCusto} onChange={e => setForm({...form, precoCusto: e.target.value})} className="input-field mt-1 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Quantidade inicial</label><input type="number" value={form.quantidade} onChange={e => setForm({...form, quantidade: e.target.value})} className="input-field mt-1 text-xs"/></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCadastro(false)} className="btn-secondary text-xs">Cancelar</button>
            <button onClick={cadastrarNovo} disabled={loading} className="btn-primary text-xs">{loading ? 'Salvando...' : 'Cadastrar produto'}</button>
          </div>
        </div>
      )}

      {/* Modal Scanner */}
      {showScanner && <BarcodeScanner onDetected={handleDetected} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
