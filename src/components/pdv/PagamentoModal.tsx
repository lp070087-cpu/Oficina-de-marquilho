'use client';

import { useState, useEffect } from 'react';

type TipoPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'TRANSFERENCIA';

interface Pagamento {
  tipo: TipoPagamento;
  valor: number;
  troco: number;
  bandeira?: string;
  parcelas?: number;
}

interface PagamentoModalProps {
  open: boolean;
  total: number;
  onClose: () => void;
  onConfirmar: (pagamentos: Pagamento[], trocoTotal: number) => void;
}

const TIPOS: { key: TipoPagamento; label: string; icon: string; precisaTroco: boolean }[] = [
  { key: 'DINHEIRO', label: 'Dinheiro', icon: '💵', precisaTroco: true },
  { key: 'PIX', label: 'PIX', icon: '📱', precisaTroco: false },
  { key: 'CARTAO_DEBITO', label: 'Débito', icon: '💳', precisaTroco: false },
  { key: 'CARTAO_CREDITO', label: 'Crédito', icon: '💳', precisaTroco: false },
  { key: 'TRANSFERENCIA', label: 'Transf.', icon: '🏦', precisaTroco: false },
];

export default function PagamentoModal({ open, total, onClose, onConfirmar }: PagamentoModalProps) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [tipoAtual, setTipoAtual] = useState<TipoPagamento>('DINHEIRO');
  const [valorAtual, setValorAtual] = useState('');

  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const restante = Math.max(0, total - totalPago);
  const trocoTotal = Math.max(0, totalPago - total);

  useEffect(() => {
    if (open) {
      setPagamentos([]);
      setTipoAtual('DINHEIRO');
      setValorAtual('');
    }
  }, [open]);

  function adicionarPagamento() {
    const valor = parseFloat(valorAtual) || 0;
    if (valor <= 0) return;

    const p: Pagamento = {
      tipo: tipoAtual,
      valor,
      troco: tipoAtual === 'DINHEIRO' ? Math.max(0, totalPago + valor - total) : 0,
    };

    setPagamentos([...pagamentos, p]);
    setValorAtual('');
  }

  function removerPagamento(index: number) {
    setPagamentos(pagamentos.filter((_, i) => i !== index));
  }

  function handleConfirmar() {
    if (totalPago < total && pagamentos.length === 0) {
      // Adiciona o valor restante automaticamente se nenhum pagamento foi adicionado
      adicionarPagamento();
      return;
    }
    if (totalPago < total) {
      // Tenta completar com o tipo atual
      const v = Math.round(restante * 100) / 100;
      setPagamentos([...pagamentos, { tipo: tipoAtual, valor: v, troco: tipoAtual === 'DINHEIRO' ? 0 : 0 }]);
      setTimeout(() => {
        const novos = [...pagamentos, { tipo: tipoAtual, valor: v, troco: tipoAtual === 'DINHEIRO' ? 0 : 0 }];
        onConfirmar(novos, Math.max(0, novos.reduce((s, p) => s + p.valor, 0) - total));
      }, 50);
      return;
    }
    onConfirmar(pagamentos, trocoTotal);
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md my-4" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Pagamento</h2>
            <p className="text-xs text-slate-400">Total: {fm(total)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="p-4 space-y-4">
          {/* Barra de progresso */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Pago: {fm(totalPago)}</span>
              <span className={`font-bold ${restante > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {restante > 0 ? `Restante: ${fm(restante)}` : 'Pago! ✅'}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${restante <= 0 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min(100, (totalPago / total) * 100)}%` }}
              />
            </div>
          </div>

          {/* Tipos de pagamento */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Forma de pagamento</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {TIPOS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTipoAtual(t.key)}
                  className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                    tipoAtual === t.key ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cartao: bandeira + parcelas */}

          {/* Valor */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              {tipoAtual === 'DINHEIRO' ? 'Valor recebido' : 'Valor'}
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorAtual}
                onChange={e => setValorAtual(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') adicionarPagamento(); }}
                className="input-field text-sm font-bold flex-1"
                placeholder="0,00"
                autoFocus
              />
              <button onClick={adicionarPagamento} disabled={!valorAtual || parseFloat(valorAtual) <= 0}
                className="btn-primary text-xs px-3 disabled:opacity-50">
                Adicionar
              </button>
            </div>
            {tipoAtual === 'DINHEIRO' && valorAtual && parseFloat(valorAtual) > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">
                Troco: {fm(Math.max(0, totalPago + parseFloat(valorAtual) - total))}
              </p>
            )}
          </div>

          {/* Atalhos para Dinheiro */}
          {tipoAtual === 'DINHEIRO' && (
            <div className="flex flex-wrap gap-1">
              {[2, 5, 10, 20, 50, 100, 200].map(v => {
                const totalComEsse = Math.ceil(total / v) * v;
                return (
                  <button key={v}
                    onClick={() => { setValorAtual(String(totalComEsse)); }}
                    className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600 font-medium transition-colors"
                  >
                    R$ {totalComEsse.toFixed(2)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Lista de pagamentos */}
          {pagamentos.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Pagamentos ({pagamentos.length})
              </label>
              <div className="space-y-1">
                {pagamentos.map((p, i) => {
                  const tipo = TIPOS.find(t => t.key === p.tipo);
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                      <div className="flex items-center gap-2">
                        <span>{tipo?.icon}</span>
                        <span className="font-medium text-slate-700">{tipo?.label}</span>
                        {p.bandeira && <span className="text-[10px] text-slate-400">({p.bandeira})</span>}
                        {p.parcelas && p.parcelas > 1 && <span className="text-[10px] text-slate-400">{p.parcelas}x</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{fm(p.valor)}</span>
                        {p.troco > 0 && <span className="text-[10px] text-amber-600">Troco: {fm(p.troco)}</span>}
                        <button onClick={() => removerPagamento(i)} className="text-slate-300 hover:text-red-500 ml-1">×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Troco */}
          {trocoTotal > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-xs text-amber-600 font-bold">Troco: {fm(trocoTotal)}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 p-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary text-xs flex-1">Cancelar</button>
          <button
            onClick={handleConfirmar}
            disabled={totalPago < total && pagamentos.length === 0 && !valorAtual}
            className="btn-primary text-xs flex-1 disabled:opacity-50"
          >
            {totalPago >= total ? `Confirmar · ${fm(totalPago)}` : restante > 0 ? `Falta ${fm(restante)}` : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
