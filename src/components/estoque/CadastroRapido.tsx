'use client';

import { useState, useRef } from 'react';

interface Categoria { id: string; nome: string; slug: string; }

interface PecaRapida {
  id?: string;
  nome: string;
  codigo: string;
  codigoBarras: string;
  precoVenda: string;
  precoCusto: string;
  quantidade: string;
  categoriaId: string;
  marca: string;
}

interface CadastroRapidoProps {
  categorias: Categoria[];
  onPecaDetectada?: (data: PecaRapida) => void;
  onPecaNova?: (data: PecaRapida) => void;
  categoriaIdPadrao?: string;
  destino?: 'central' | 'loja';
}

export default function CadastroRapido({
  categorias,
  onPecaDetectada,
  onPecaNova,
  categoriaIdPadrao,
  destino = 'central',
}: CadastroRapidoProps) {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');
  const [modo, setModo] = useState<'idle' | 'encontrada' | 'nova'>('idle');

  // Peca encontrada
  const [peca, setPeca] = useState<any>(null);

  // Form para nova peca
  const [form, setForm] = useState<PecaRapida>({
    nome: '', codigo: '', codigoBarras: '',
    precoVenda: '', precoCusto: '', quantidade: '0',
    categoriaId: categoriaIdPadrao || categorias[0]?.id || '',
    marca: '',
  });

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleBuscar(codigoBarras: string) {
    if (!codigoBarras.trim()) return;
    setErro('');
    setBuscando(true);

    try {
      const res = await fetch(`/api/pecas/pesquisa?q=${encodeURIComponent(codigoBarras.trim())}`);
      const data = await res.json();
      const encontrada = Array.isArray(data) ? data[0] : null;

      if (encontrada) {
        setPeca(encontrada);
        setModo('encontrada');
        if (onPecaDetectada) {
          onPecaDetectada({
            id: encontrada.id,
            nome: encontrada.nome,
            codigo: encontrada.codigo,
            codigoBarras: encontrada.codigoBarras || '',
            precoVenda: String(encontrada.precoVenda || ''),
            precoCusto: String(encontrada.precoCusto || ''),
            quantidade: String(encontrada.quantidade || 0),
            categoriaId: encontrada.categoriaId || '',
            marca: encontrada.marca || '',
          });
        }
      } else {
        setForm({
          ...form,
          codigoBarras: codigoBarras.trim(),
          codigo: codigoBarras.trim(),
          categoriaId: categoriaIdPadrao || categorias[0]?.id || '',
        });
        setModo('nova');
      }
    } catch {
      setErro('Erro ao buscar peca');
    }
    setBuscando(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (modo === 'idle') {
        handleBuscar(codigo);
      } else if (modo === 'nova') {
        handleCadastrar();
      }
    }
  }

  async function handleCadastrar() {
    if (!form.nome.trim()) { setErro('Nome e obrigatorio'); return; }
    if (!form.codigoBarras.trim()) { setErro('Codigo de barras e obrigatorio'); return; }

    setErro('');
    try {
      const res = await fetch('/api/pecas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          precoVenda: parseFloat(form.precoVenda) || 0,
          precoCusto: parseFloat(form.precoCusto) || 0,
          quantidade: destino === 'central' ? parseInt(form.quantidade) || 0 : 0,
          quantidadeLoja: destino === 'loja' ? parseInt(form.quantidade) || 0 : 0,
          estoqueMinimo: 3,
          ativo: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao cadastrar');
      }

      const nova = await res.json();
      if (onPecaNova) onPecaNova(nova);

      // Reset
      setCodigo('');
      setModo('idle');
      setForm({ ...form, nome: '', codigo: '', codigoBarras: '', precoVenda: '', precoCusto: '', quantidade: '0', marca: '' });
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e: any) {
      setErro(e.message || 'Erro ao cadastrar');
    }
  }

  function handleVoltar() {
    setCodigo('');
    setModo('idle');
    setPeca(null);
    setErro('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-slate-800">Cadastro Rapido</h4>
      <p className="text-[11px] text-slate-500">Escaneie ou digite o codigo de barras para localizar ou cadastrar uma peca</p>

      {/* Input de codigo */}
      <div className="relative">
        <input
          ref={inputRef}
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Codigo de barras ou codigo..."
          className="input-field text-xs pl-10 pr-20 py-3 font-mono"
          disabled={modo !== 'idle'}
          autoFocus
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {modo === 'idle' && codigo && (
          <button
            onClick={() => handleBuscar(codigo)}
            disabled={buscando}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white bg-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {buscando ? '...' : 'Buscar'}
          </button>
        )}
        {buscando && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Resultado: Peca encontrada */}
      {modo === 'encontrada' && peca && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-sm font-bold text-slate-800">{peca.nome}</p>
              <p className="text-[10px] text-slate-500">{peca.codigo}{peca.marca ? ` · ${peca.marca}` : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-2">
              <p className="text-[9px] text-slate-400 uppercase">Estoque Central</p>
              <p className={`text-sm font-bold ${peca.quantidade > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {peca.quantidade} un.
              </p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-[9px] text-slate-400 uppercase">Loja</p>
              <p className={`text-sm font-bold ${peca.quantidadeLoja > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {peca.quantidadeLoja} un.
              </p>
            </div>
          </div>

          {peca.precoVenda > 0 && (
            <p className="text-xs text-slate-600">
              Preco: {Number(peca.precoVenda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}

          <button onClick={handleVoltar} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
            ← Escanear outro
          </button>
        </div>
      )}

      {/* Form de novo cadastro */}
      {modo === 'nova' && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-3">
          <div className="flex items-center gap-2">
            <span>🆕</span>
            <p className="text-xs font-bold text-amber-800">Peca nao encontrada — Cadastrar nova</p>
          </div>

          <div className="space-y-2">
            {/* Nome */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Nome do Produto *</label>
              <input
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleCadastrar()}
                placeholder="Nome da peca"
                className="input-field text-xs mt-1 bg-white"
                autoFocus
              />
            </div>

            {/* Grid: Preco Custo, Preco Venda, Quantidade */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Custo</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precoCusto}
                  onChange={e => setForm({ ...form, precoCusto: e.target.value })}
                  placeholder="R$ 0,00"
                  className="input-field text-xs mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Venda</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precoVenda}
                  onChange={e => setForm({ ...form, precoVenda: e.target.value })}
                  placeholder="R$ 0,00"
                  className="input-field text-xs mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Qtd</label>
                <input
                  type="number"
                  value={form.quantidade}
                  onChange={e => setForm({ ...form, quantidade: e.target.value })}
                  placeholder="0"
                  className="input-field text-xs mt-1 bg-white"
                />
              </div>
            </div>

            {/* Marca + Categoria */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Marca</label>
                <input
                  value={form.marca}
                  onChange={e => setForm({ ...form, marca: e.target.value })}
                  placeholder="Ex: Honda"
                  className="input-field text-xs mt-1 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Categoria</label>
                <select
                  value={form.categoriaId}
                  onChange={e => setForm({ ...form, categoriaId: e.target.value })}
                  className="input-field text-xs mt-1 bg-white"
                >
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {erro && <p className="text-[11px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCadastrar}
              className="btn-brand text-xs px-4 py-2 rounded-lg"
            >
              Cadastrar
            </button>
            <button onClick={handleVoltar} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Dica de atalho */}
      {modo === 'idle' && (
        <p className="text-[9px] text-slate-400 text-center">
          Pressione Enter para buscar · Escaneie com leitor USB/Bluetooth
        </p>
      )}
    </div>
  );
}
