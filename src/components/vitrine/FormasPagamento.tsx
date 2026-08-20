'use client';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Formas de Pagamento (Vitrine pública).
 * AJUSTE 3+4: PIX usa o MESMO valor do produto (sem desconto inventado).
 * Sem tabela de parcelas e sem juros inventados — apenas as 4 formas oficiais.
 */
const FORMAS = [
  { key: 'PIX', icone: '⚡', titulo: 'PIX', desc: 'Pagamento instantâneo' },
  { key: 'CARTAO_CREDITO', icone: '💳', titulo: 'Cartão de Crédito', desc: 'Na retirada' },
  { key: 'CARTAO_DEBITO', icone: '💳', titulo: 'Cartão de Débito', desc: 'Na retirada' },
  { key: 'DINHEIRO', icone: '💰', titulo: 'Dinheiro', desc: 'Na retirada' },
];

export default function FormasPagamento({ preco }: { preco: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {FORMAS.map(f => (
        <div key={f.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-xl">{f.icone}</span>
          <div>
            <p className="text-xs font-bold text-slate-700">{f.titulo}</p>
            <p className="text-[10px] text-slate-400">{f.desc}</p>
          </div>
          <span className="ml-auto text-xs font-extrabold text-slate-800">{fm(preco)}</span>
        </div>
      ))}
    </div>
  );
}
