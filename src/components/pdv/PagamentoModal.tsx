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
  const [tipoAtual, setTipoAtual] = useState<TipoPagamento>('DINHEIRO');

  useEffect(() => {
    if (open) {
      setTipoAtual('DINHEIRO');
    }
  }, [open]);

  function handleConfirmar() {
    // FASE 15-N: bloqueia venda de R$ 0,00 — não pode finalizar sem valor
    if (!Number.isFinite(total) || total <= 0) {
      return;
    }

    // Pagamento integral simples: constrói automaticamente o pagamento com o
    // método selecionado + o valor total da venda. Não exige "valor recebido",
    // nem botão "Adicionar", nem atalhos de valores.
    // - Dinheiro: envia valor = total (troco 0); o caixa trata troco se necessário.
    // - Demais formas: valor = total, sem troco.
    const pagamentoUnico: Pagamento = {
      tipo: tipoAtual,
      valor: Math.round(total * 100) / 100,
      troco: 0,
    };
    onConfirmar([pagamentoUnico], 0);
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
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">Total da venda</p>
            <p className="text-2xl font-extrabold text-slate-800">{fm(total)}</p>
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
            <p className="text-[10px] text-slate-400 mt-2">
              O pagamento será registrado pelo total da venda ({fm(total)}).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 p-4 border-t border-slate-100">
          {(!Number.isFinite(total) || total <= 0) && (
            <div className="w-full p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium">
              ⛔ Total R$ 0,00. Não é possível receber pagamento de uma venda sem valor. Corrija os itens.
            </div>
          )}
          <button onClick={onClose} className="btn-secondary text-xs flex-1">Cancelar</button>
          <button
            onClick={handleConfirmar}
            disabled={!Number.isFinite(total) || total <= 0}
            className="btn-primary text-xs flex-1 disabled:opacity-50"
          >
            {!Number.isFinite(total) || total <= 0 ? 'Valor inválido' : `Confirmar Pagamento · ${fm(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
