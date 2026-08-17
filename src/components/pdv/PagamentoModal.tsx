'use client';

import { useState, useEffect } from 'react';

// Formas aceitas em NOVAS vendas. TRANSFERENCIA foi removida da interface por
// decisão da loja; registros antigos com 'TRANSFERENCIA' continuam legíveis.
type TipoPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO';

export interface Pagamento {
  tipo: string;
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

const TIPOS: { key: TipoPagamento; label: string; icon: string }[] = [
  { key: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
  { key: 'PIX', label: 'PIX', icon: '📱' },
  { key: 'CARTAO_DEBITO', label: 'Débito', icon: '💳' },
  { key: 'CARTAO_CREDITO', label: 'Crédito', icon: '💳' },
];

export default function PagamentoModal({ open, total, onClose, onConfirmar }: PagamentoModalProps) {
  const [tipoAtual, setTipoAtual] = useState<TipoPagamento>('DINHEIRO');
  const [valorStr, setValorStr] = useState('');
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [erro, setErro] = useState('');

  // Reset sempre que o modal abre
  useEffect(() => {
    if (open) {
      setTipoAtual('DINHEIRO');
      setValorStr('');
      setPagamentos([]);
      setErro('');
    }
  }, [open]);

  const totalVenda = Number.isFinite(total) ? Math.round(total * 100) / 100 : 0;
  const totalPago = pagamentos.reduce((s, p) => s + (Number(p.valor) || 0), 0);
  const totalPagoFmt = Math.round(totalPago * 100) / 100;
  const restante = Math.round((totalVenda - totalPagoFmt) * 100) / 100;
  const fechado = Math.abs(restante) < 0.005; // exatamente 0 dentro de centavos
  const saldoUnico = pagamentos.length === 1 && fechado;

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const labelDe = (t: string) => TIPOS.find(x => x.key === t)?.label || t;

  function handleAdicionar() {
    setErro('');

    // Valor inválido (vazio, zero ou negativo)
    const raw = valorStr.replace(',', '.').trim();
    const valor = Number(raw);
    if (!raw || !Number.isFinite(valor)) {
      setErro('Informe um valor válido.');
      return;
    }
    const centavos = Math.round(valor * 100);
    if (centavos <= 0) {
      setErro('O valor deve ser maior que zero.');
      return;
    }
    const v = centavos / 100;

    // Restante <= 0: nada a pagar
    if (restante <= 0) {
      setErro('A venda já está totalmente paga.');
      return;
    }

    // Não pode ultrapassar o restante
    if (v > restante + 0.005) {
      setErro(`Valor maior que o restante. Falta pagar ${fm(restante)}.`);
      return;
    }

    // Mesma forma já adicionada → soma (evita linhas duplicadas da mesma forma)
    setPagamentos(prev => {
      const idx = prev.findIndex(p => p.tipo === tipoAtual);
      if (idx >= 0) {
        const novo = [...prev];
        novo[idx] = { ...novo[idx], valor: Math.round((novo[idx].valor + v) * 100) / 100 };
        return novo;
      }
      return [...prev, { tipo: tipoAtual, valor: v, troco: 0 }];
    });
    setValorStr('');
  }

  function handleRemover(index: number) {
    setPagamentos(prev => prev.filter((_, i) => i !== index));
  }

  function handleConfirmar() {
    // Total inválido
    if (!Number.isFinite(totalVenda) || totalVenda <= 0) return;

    // Só libera quando TOTAL PAGO === TOTAL DA VENDA
    if (!fechado || pagamentos.length === 0) return;

    // O servidor (POST /api/vendas) recalcula o troco do DINHEIRO; aqui o troco
    // único é sempre 0 porque o cliente paga exatamente o valor (dividido ou não).
    onConfirmar(pagamentos, 0);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md my-4" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Pagamento</h2>
            <p className="text-xs text-slate-400">Total da venda: {fm(totalVenda)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="p-4 space-y-4">
          {/* Total da venda */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">Total da venda</p>
            <p className="text-2xl font-extrabold text-slate-800">{fm(totalVenda)}</p>
          </div>

          {/* Totais pago / restante */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Total pago</p>
              <p className="text-lg font-extrabold text-emerald-700">{fm(totalPagoFmt)}</p>
            </div>
            <div className={`p-3 rounded-xl border text-center ${fechado ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className={`text-[10px] font-bold uppercase ${fechado ? 'text-emerald-600' : 'text-amber-600'}`}>Restante</p>
              <p className={`text-lg font-extrabold ${fechado ? 'text-emerald-700' : 'text-amber-700'}`}>{fm(restante)}</p>
            </div>
          </div>

          {/* Formas de pagamento */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Forma de pagamento</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {TIPOS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTipoAtual(t.key); setErro(''); }}
                  className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                    tipoAtual === t.key ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Valor + Adicionar */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Valor ({labelDe(tipoAtual)})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={valorStr}
                onChange={e => setValorStr(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionar(); } }}
                placeholder={restante > 0 ? fm(restante) : 'R$ 0,00'}
                disabled={restante <= 0}
                className="input-field text-sm flex-1 disabled:opacity-50"
              />
              <button
                onClick={handleAdicionar}
                disabled={restante <= 0}
                className="btn-secondary text-xs px-4 disabled:opacity-40"
              >
                ADICIONAR
              </button>
            </div>
          </div>

          {erro && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium">
              ⛔ {erro}
            </div>
          )}

          {/* Lista de pagamentos adicionados */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Pagamentos adicionados</p>
              {pagamentos.length > 0 && (
                <span className="text-[10px] text-slate-400">{pagamentos.length} {pagamentos.length === 1 ? 'forma' : 'formas'}</span>
              )}
            </div>
            {pagamentos.length === 0 ? (
              <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg p-3 text-center">
                Nenhum pagamento adicionado ainda. Escolha a forma, informe o valor e clique em ADICIONAR.
              </p>
            ) : (
              <div className="space-y-1">
                {pagamentos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm">{TIPOS.find(t => t.key === p.tipo)?.icon || '💳'}</span>
                      <span className="font-semibold text-slate-700 truncate">{labelDe(p.tipo)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">{fm(Number(p.valor))}</span>
                      <button
                        onClick={() => handleRemover(i)}
                        className="text-[10px] text-slate-400 hover:text-red-600 flex items-center gap-0.5"
                        title="Remover pagamento"
                        aria-label={`Remover pagamento ${labelDe(p.tipo)}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mensagem de falta pagar */}
          {!fechado && restante > 0 && (
            <p className="text-[11px] text-amber-600 font-medium">
              Falta pagar {fm(restante)}.
            </p>
          )}
          {!fechado && restante <= 0 && (
            <p className="text-[11px] text-emerald-700 font-medium">
              Venda totalmente paga.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 p-4 border-t border-slate-100">
          {(!Number.isFinite(totalVenda) || totalVenda <= 0) && (
            <div className="w-full p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium">
              ⛔ Total R$ 0,00. Não é possível receber pagamento de uma venda sem valor. Corrija os itens.
            </div>
          )}
          <button onClick={onClose} className="btn-secondary text-xs flex-1">Cancelar</button>
          <button
            onClick={handleConfirmar}
            disabled={!Number.isFinite(totalVenda) || totalVenda <= 0 || !fechado || pagamentos.length === 0}
            className="btn-primary text-xs flex-1 disabled:opacity-50"
          >
            {!Number.isFinite(totalVenda) || totalVenda <= 0
              ? 'Valor inválido'
              : fechado && pagamentos.length > 0
                ? `Confirmar Pagamento · ${fm(totalVenda)}${saldoUnico ? ` (${labelDe(pagamentos[0].tipo)})` : ''}`
                : `Falta pagar ${fm(restante)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
