'use client';
// Tabela de Revisão Universal — usada por todos os formatos de entrada
import { ProdutoExtraido, StatsRevisao } from '@/lib/entrada-inteligente/types';

interface Props {
  produtos: ProdutoExtraido[];
  stats: StatsRevisao;
  onChange: (id: string, field: string, value: string) => void;
  onToggleSelecionar: (id: string) => void;
  onToggleTodos: () => void;
  onExcluir: (id: string) => void;
  onDuplicar: (id: string) => void;
  onSalvar: () => void;
  onCancelar: () => void;
  loading: boolean;
  pesquisa: string;
  onPesquisaChange: (v: string) => void;
}

const COLUNAS: { key: string; label: string; width: string }[] = [
  { key: 'status', label: 'Status', width: 'w-14' },
  { key: 'codigo', label: 'Código', width: 'w-20' },
  { key: 'codigoBarras', label: 'Barras', width: 'w-24' },
  { key: 'nome', label: 'Nome', width: 'min-w-[140px]' },
  { key: 'marca', label: 'Marca', width: 'w-16' },
  { key: 'categoria', label: 'Categoria', width: 'w-16' },
  { key: 'compatibilidade', label: 'Compat.', width: 'w-24' },
  { key: 'fornecedor', label: 'Forn.', width: 'w-16' },
  { key: 'quantidade', label: 'Qtd', width: 'w-12' },
  { key: 'precoCusto', label: 'Custo', width: 'w-16' },
  { key: 'precoVenda', label: 'Venda', width: 'w-16' },
];

export default function TabelaRevisao({
  produtos, stats, onChange, onToggleSelecionar, onToggleTodos,
  onExcluir, onDuplicar, onSalvar, onCancelar, loading,
  pesquisa, onPesquisaChange,
}: Props) {
  const filtrados = pesquisa
    ? produtos.filter(p =>
        p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        p.codigo.toLowerCase().includes(pesquisa.toLowerCase()) ||
        p.codigoBarras.toLowerCase().includes(pesquisa.toLowerCase()))
    : produtos;

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-50 text-slate-700', icon: '📦' },
          { label: 'Novos', value: stats.novos, color: 'bg-brand-50 text-brand-700', icon: '✨' },
          { label: 'Existentes', value: stats.existentes, color: 'bg-emerald-50 text-emerald-700', icon: '✅' },
          { label: 'Duplicados', value: stats.duplicados, color: 'bg-amber-50 text-amber-700', icon: '⚠️' },
          { label: 'Com erro', value: stats.comErro, color: 'bg-red-50 text-red-700', icon: '❌' },
          { label: 'Selecionados', value: stats.selecionados, color: 'bg-indigo-50 text-indigo-700', icon: '☑️' },
        ].map((s, i) => (
          <div key={i} className={`card flex flex-col items-center p-3 ${s.color} border-0 shadow-sm`}>
            <span className="text-lg mb-0.5">{s.icon}</span>
            <span className="text-[10px] uppercase font-bold opacity-70">{s.label}</span>
            <span className="text-xl font-extrabold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px]">
          <input
            value={pesquisa}
            onChange={e => onPesquisaChange(e.target.value)}
            placeholder="Pesquisar nos produtos..."
            className="input-field text-xs w-full"
          />
        </div>
        <button
          onClick={onToggleTodos}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          {stats.selecionados === stats.total && stats.total > 0
            ? 'Desmarcar todos'
            : 'Selecionar todos'}
        </button>
      </div>

      {/* Aviso */}
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
        Confira e edite os dados antes de salvar. Linhas com erro (codigo vazio etc.) serão ignoradas.
      </div>

      {/* Tabela editável */}
      <div className="card-table overflow-auto max-h-[55vh] border border-slate-200 rounded-xl">
        <table className="w-full text-[10px] whitespace-nowrap">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 sticky top-0 z-10">
              <th className="text-left py-2 px-1.5 w-8">
                <input
                  type="checkbox"
                  checked={stats.selecionados === stats.total && stats.total > 0}
                  onChange={onToggleTodos}
                  className="rounded border-slate-300"
                />
              </th>
              {COLUNAS.map(c => (
                <th key={c.key} className={`text-left py-2 px-1.5 font-bold text-slate-500 uppercase text-[9px] ${c.width}`}>
                  {c.label}
                </th>
              ))}
              <th className="text-center py-2 px-1.5 font-bold text-slate-500 uppercase text-[9px] w-16">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${
                  i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                } ${!p.selecionado ? 'opacity-50' : ''}`}
              >
                {/* Checkbox */}
                <td className="py-1 px-1.5">
                  <input
                    type="checkbox"
                    checked={p.selecionado}
                    onChange={() => onToggleSelecionar(p.id)}
                    className="rounded border-slate-300"
                  />
                </td>

                {/* Status */}
                <td className="py-1 px-1.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                    p.status === 'novo' ? 'bg-brand-100 text-brand-700' :
                    p.status === 'existente' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'duplicado' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {p.status}
                  </span>
                </td>

                {/* Código */}
                <td className="py-1 px-1.5">
                  <EditableCell
                    value={p.codigo}
                    onChange={v => onChange(p.id, 'codigo', v)}
                    className="font-mono"
                    placeholder="Código"
                  />
                </td>

                {/* Cód. Barras */}
                <td className="py-1 px-1.5">
                  <EditableCell
                    value={p.codigoBarras}
                    onChange={v => onChange(p.id, 'codigoBarras', v)}
                    className="font-mono"
                    placeholder="Barras"
                  />
                </td>

                {/* Nome */}
                <td className="py-1 px-1.5">
                  <EditableCell
                    value={p.nome}
                    onChange={v => onChange(p.id, 'nome', v)}
                    className="font-medium"
                    placeholder="Nome do produto"
                  />
                </td>

                {/* Marca */}
                <td className="py-1 px-1.5">
                  <EditableCell value={p.marca} onChange={v => onChange(p.id, 'marca', v)} placeholder="-" />
                </td>

                {/* Categoria */}
                <td className="py-1 px-1.5">
                  <EditableCell value={p.categoria} onChange={v => onChange(p.id, 'categoria', v)} placeholder="-" />
                </td>

                {/* Compatibilidade */}
                <td className="py-1 px-1.5">
                  <EditableCell value={p.compatibilidade} onChange={v => onChange(p.id, 'compatibilidade', v)} placeholder="-" />
                </td>

                {/* Fornecedor */}
                <td className="py-1 px-1.5">
                  <EditableCell value={p.fornecedor} onChange={v => onChange(p.id, 'fornecedor', v)} placeholder="-" />
                </td>

                {/* Quantidade */}
                <td className="py-1 px-1.5">
                  <input
                    type="number"
                    min="0"
                    value={p.quantidade}
                    onChange={e => onChange(p.id, 'quantidade', e.target.value)}
                    className="w-12 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-brand-400 outline-none text-center font-bold"
                  />
                </td>

                {/* Custo */}
                <td className="py-1 px-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={p.precoCusto}
                    onChange={e => onChange(p.id, 'precoCusto', e.target.value)}
                    className="w-16 sm:w-20 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-brand-400 outline-none text-right"
                    placeholder="0,00"
                  />
                </td>

                {/* Venda */}
                <td className="py-1 px-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={p.precoVenda}
                    onChange={e => onChange(p.id, 'precoVenda', e.target.value)}
                    className="w-16 sm:w-20 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-brand-400 outline-none text-right"
                    placeholder="0,00"
                  />
                </td>

                {/* Ações */}
                <td className="py-1 px-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicar(p.id)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      title="Duplicar"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onExcluir(p.id)}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                      title="Remover"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <div className="text-center py-12 text-xs text-slate-400">
            Nenhum produto encontrado
          </div>
        )}
      </div>

      {/* Rodapé com botões */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-400">
          {stats.total} produtos · {stats.selecionados} selecionados · {stats.totalUnidades} unidades
        </p>
        <div className="flex items-center gap-3">
          <button onClick={onCancelar} className="btn-secondary text-xs" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={onSalvar}
            disabled={loading || stats.selecionados === 0}
            className="btn-primary text-xs px-6"
          >
            {loading ? 'Salvando...' : 'SALVAR NO ESTOQUE'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: célula editável
function EditableCell({
  value, onChange, className = '', placeholder = '',
}: {
  value: string; onChange: (v: string) => void; className?: string; placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-brand-400 outline-none text-[10px] ${className}`}
      placeholder={placeholder}
    />
  );
}
