'use client';

/**
 * Frete e Prazo — a loja opera SOMENTE com retirada na loja.
 * AJUSTE 2: remover qualquer menção a "Entrega em breve", simulação de
 * entrega, prazo de Correios ou frete inventado. Este bloco mostra apenas
 * a retirada, que é a realidade do negócio.
 */
export default function FretePrazo({ pecaId }: { pecaId: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
      <h4 className="text-xs font-bold text-slate-700 mb-2">📦 Retirada</h4>
      <div className="bg-white rounded-lg p-3 border border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-slate-600">Retirada na Loja</span>
          <span className="text-[11px] font-extrabold text-emerald-600">Grátis</span>
        </div>
        <p className="text-[10px] text-slate-400">Retire em até 2h após confirmação do pedido</p>
      </div>
    </div>
  );
}
