'use client';

import { useState, useEffect, useCallback } from 'react';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';

interface Categoria { id: string; nome: string; slug: string; }
interface Peca {
  id: string; nome: string; codigo: string; codigoBarras?: string;
  precoVenda: number; precoCusto: number; custoMedio: number;
  quantidade: number; quantidadeLoja: number; estoqueMinimo: number;
  marca?: string; compatibilidade?: string; localizacao?: string; subcategoria?: string;
  categoria: { nome: string; id: string };
}

export default function ScannerPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [foundPeca, setFoundPeca] = useState<Peca | null>(null);
  const [quantidade, setQuantidade] = useState('1');
  const [valorCusto, setValorCusto] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setValorCusto(''); setFornecedor(''); setObservacao('');
    const res = await fetch(`/api/pecas?barcode=${encodeURIComponent(code.trim())}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const p = data[0];
      setFoundPeca(p);
      setValorCusto(p.custoMedio ? String(Number(p.custoMedio)) : String(Number(p.precoCusto)));
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
    const custo = parseFloat(valorCusto) || Number(foundPeca.precoCusto);
    if (qtd <= 0) { setMsg('Quantidade deve ser maior que zero.'); return; }
    if (custo <= 0) { setMsg('Informe o valor de custo.'); return; }
    setSaving(true); setMsg('');

    // Update peca
    const novaQtd = foundPeca.quantidade + qtd;
    const custoMedioAntigo = Number(foundPeca.custoMedio) || Number(foundPeca.precoCusto) || 0;
    const qtdAntiga = foundPeca.quantidade;
    const novoCustoMedio = qtdAntiga > 0
      ? ((custoMedioAntigo * qtdAntiga) + (custo * qtd)) / (qtdAntiga + qtd)
      : custo;

    const res = await fetch(`/api/pecas/${foundPeca.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...foundPeca,
        quantidade: novaQtd,
        precoCusto: custo,
        custoMedio: Math.round(novoCustoMedio * 100) / 100,
        categoriaId: foundPeca.categoria.id,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      // Register movement
      await fetch('/api/relatorios/movimentacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pecaId: foundPeca.id,
          tipo: 'ENTRADA',
          quantidade: qtd,
          valorUnitario: custo,
          fornecedor: fornecedor || null,
          observacao: observacao || null,
        }),
      });
      setFoundPeca(updated);
      setQuantidade('1');
      setValorCusto('');
      setFornecedor('');
      setObservacao('');
      setMsgOk(`✅ ${qtd} unidade(s) de "${updated.nome}" adicionada(s). Total: ${updated.quantidade}. Custo medio: R$ ${novoCustoMedio.toFixed(2)}`);
    } else { setMsg('Erro ao atualizar estoque.'); }
    setSaving(false);
  }

  async function cadastrarNovo() {
    if (!form.nome || !form.categoriaId) { setMsg('Preencha nome e categoria.'); return; }
    const custo = parseFloat(form.precoCusto) || 0;
    const body = {
      nome: form.nome, codigo: form.codigo || `CB-${Date.now()}`, codigoBarras: cadastroCode,
      precoVenda: Number(form.precoVenda) || 0, precoCusto: custo, custoMedio: custo,
      quantidade: Number(form.quantidade) || 1, categoriaId: form.categoriaId,
    };
    setLoading(true); setMsg('');
    const res = await fetch('/api/pecas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const p = await res.json();
      // Register movement for new product
      await fetch('/api/relatorios/movimentacao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pecaId: p.id, tipo: 'ENTRADA', quantidade: Number(form.quantidade) || 1, valorUnitario: custo, observacao: `Cadastro inicial via scanner - codigo: ${cadastroCode}` }),
      });
      setFoundPeca(p); setShowCadastro(false);
      setValorCusto(String(custo)); setQuantidade('1');
      setMsgOk('Produto cadastrado e entrada registrada com sucesso!');
    } else { const e = await res.json(); setMsg(e.error || 'Erro ao cadastrar.'); }
    setLoading(false);
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">ENTRADA POR SCANNER</h1>
      <p className="text-sm text-slate-500 mb-6">Escaneie o codigo de barras — informe apenas a quantidade e o custo</p>

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
      {msgOk && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs mb-4 font-semibold">{msgOk}</div>}

      {loading && <p className="text-xs text-slate-400 mb-4">Buscando...</p>}

      {/* Produto encontrado - info read-only */}
      {foundPeca && (
        <div className="card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{foundPeca.nome}</h3>
              <p className="text-xs text-slate-500">{foundPeca.marca || foundPeca.categoria.nome} {foundPeca.subcategoria ? `· ${foundPeca.subcategoria}` : ''}</p>
              <p className="text-xs text-slate-400 font-mono mt-1">SKU: {foundPeca.codigo}</p>
              {foundPeca.codigoBarras && <p className="text-xs text-slate-400 font-mono">Barcode: {foundPeca.codigoBarras}</p>}
              {foundPeca.compatibilidade && <p className="text-[10px] text-slate-400 mt-1">Compativel: {foundPeca.compatibilidade}</p>}
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">✓ Encontrado</span>
          </div>

          {/* Status atual - read only */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase">Estoque atual</p>
              <p className={`text-lg font-bold ${foundPeca.quantidade <= foundPeca.estoqueMinimo ? 'text-amber-600' : 'text-slate-800'}`}>{foundPeca.quantidade}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase">Custo medio</p>
              <p className="text-lg font-bold text-slate-800">{fm(Number(foundPeca.custoMedio) || Number(foundPeca.precoCusto))}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase">Preco venda</p>
              <p className="text-lg font-bold text-slate-800">{fm(Number(foundPeca.precoVenda))}</p>
            </div>
          </div>

          {/* Confirmation message */}
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-xs text-brand-800">
            Foram identificadas <strong className="text-brand-900">{quantidade || 'X'}</strong> unidades da peca <strong className="text-brand-900">{foundPeca.nome}</strong>, categoria {foundPeca.categoria.nome}, pelo custo unitario de <strong className="text-brand-900">{fm(parseFloat(valorCusto) || 0)}</strong>.
          </div>

          {/* Editavel: qtd + custo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Quantidade recebida *</label>
              <input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} className="input-field mt-1.5 text-center text-lg font-bold" min="1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Valor custo unitario *</label>
              <input type="number" step="0.01" value={valorCusto} onChange={e => setValorCusto(e.target.value)} className="input-field mt-1.5 text-center text-lg font-bold" placeholder="0,00" />
            </div>
          </div>

          {/* Fornecedor + observacao opcionais */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Fornecedor (opcional)</label>
              <input value={fornecedor} onChange={e => setFornecedor(e.target.value)} className="input-field mt-1.5 text-xs" placeholder="Nome do fornecedor" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Observacao (opcional)</label>
              <input value={observacao} onChange={e => setObservacao(e.target.value)} className="input-field mt-1.5 text-xs" placeholder="Lote, NF, etc." />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button onClick={() => { setFoundPeca(null); setManualCode(''); setMsg(''); setQuantidade('1'); setValorCusto(''); }} className="btn-secondary text-xs">Cancelar</button>
            <button onClick={() => { setFoundPeca(null); setManualCode(''); setMsg(''); setQuantidade('1'); setValorCusto(''); setShowScanner(true); }} className="btn-secondary text-xs">Escanear novamente</button>
            <button onClick={entradaEstoque} disabled={saving} className="btn-primary text-xs flex-1">
              {saving ? 'Salvando...' : '✅ Confirmar entrada'}
            </button>
          </div>
        </div>
      )}

      {/* Cadastro rapido */}
      {showCadastro && (
        <div className="card space-y-3 mt-6 border-2 border-amber-300 bg-amber-50/30">
          <div className="flex items-center gap-2 text-amber-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <h3 className="text-sm font-bold">Produto nao encontrado — Cadastre</h3>
          </div>
          <p className="text-xs text-slate-500">Codigo: <strong className="font-mono">{cadastroCode}</strong></p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-xs font-semibold text-slate-600 uppercase">Nome *</label><input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="input-field mt-1 text-xs" placeholder="Nome da peca"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Codigo (SKU)</label><input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="input-field mt-1 text-xs" placeholder="Opcional"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Categoria *</label><select value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})} className="input-field mt-1 text-xs"><option value="">Selecionar</option>{categorias.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}</select></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Preco venda</label><input type="number" step="0.01" value={form.precoVenda} onChange={e => setForm({...form, precoVenda: e.target.value})} className="input-field mt-1 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Preco custo</label><input type="number" step="0.01" value={form.precoCusto} onChange={e => setForm({...form, precoCusto: e.target.value})} className="input-field mt-1 text-xs"/></div>
            <div><label className="text-xs font-semibold text-slate-600 uppercase">Qtd inicial</label><input type="number" value={form.quantidade} onChange={e => setForm({...form, quantidade: e.target.value})} className="input-field mt-1 text-xs"/></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCadastro(false)} className="btn-secondary text-xs">Cancelar</button>
            <button onClick={cadastrarNovo} disabled={loading} className="btn-primary text-xs">{loading ? 'Salvando...' : 'Cadastrar e dar entrada'}</button>
          </div>
        </div>
      )}

      {showScanner && <BarcodeScanner onDetected={handleDetected} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
