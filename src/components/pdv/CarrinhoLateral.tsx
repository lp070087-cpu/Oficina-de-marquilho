'use client';

// ============================================================================
// CARRINHO LATERAL — usado em /balcao/estoque
// Painel à direita que não cobre as ações da tabela. NÃO cria sistema de
// pagamento: o botão "Finalizar" navega para o PDV, que consome o mesmo
// sessionStorage('pdv_preload') usado pelo fluxo de venda existente.
// ============================================================================

export interface CarrinhoLateralItem {
  pecaId: string;
  nome: string;
  codigo: string;
  imagemUrl?: string | null;
  precoVenda: number;
  quantidade: number;
}

interface CarrinhoLateralProps {
  itens: CarrinhoLateralItem[];
  onClose: () => void;
  onQuantidade: (pecaId: string, delta: number) => void;
  onRemover: (pecaId: string) => void;
  onFinalizar: () => void;
}

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CarrinhoLateral({ itens, onClose, onQuantidade, onRemover, onFinalizar }: CarrinhoLateralProps) {
  const total = itens.reduce((s, i) => s + (Number(i.precoVenda) || 0) * (i.quantidade || 0), 0);
  const totalItens = itens.reduce((s, i) => s + (i.quantidade || 0), 0);

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col md:static md:z-auto md:w-80 md:shadow-md md:rounded-xl md:border md:border-slate-200 md:flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Carrinho</h3>
          <p className="text-xs text-slate-400">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
          title="Fechar carrinho"
          aria-label="Fechar carrinho"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Itens */}
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        {itens.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-10">Carrinho vazio.<br />Use &quot;+ Carrinho&quot; na listagem.</p>
        ) : (
          itens.map(item => {
            const preco = Number(item.precoVenda) || 0;
            const subtotal = preco * (item.quantidade || 0);
            return (
              <div key={item.pecaId} className="py-3 border-b border-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.nome}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.codigo}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onQuantidade(item.pecaId, -1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 text-xs bg-slate-100 rounded-lg"
                      title="Diminuir quantidade"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-slate-700">{item.quantidade}</span>
                    <button
                      onClick={() => onQuantidade(item.pecaId, +1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 text-xs bg-slate-100 rounded-lg"
                      title="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">{fm(preco)} un.</p>
                    <p className="text-xs font-bold text-slate-800">{fm(subtotal)}</p>
                  </div>
                </div>
                <div className="mt-1.5">
                  <button
                    onClick={() => onRemover(item.pecaId)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-600"
                    title="Remover do carrinho"
                    aria-label={`Remover ${item.nome} do carrinho`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Remover
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Total + Finalizar */}
      <div className="px-4 py-3 border-t border-slate-100">
        <div className="flex justify-between text-sm font-bold text-slate-800 mb-3">
          <span>TOTAL</span>
          <span>{fm(total)}</span>
        </div>
        <button
          onClick={onFinalizar}
          disabled={itens.length === 0}
          className="btn-primary w-full py-2.5 text-xs font-bold disabled:opacity-40"
        >
          FINALIZAR VENDA
        </button>
        <p className="text-[10px] text-slate-400 mt-2 text-center">Continua no PDV — a baixa do estoque acontece só na confirmação.</p>
      </div>
    </aside>
  );
}
