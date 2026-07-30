'use client';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FormasPagamento({ preco }: { preco: number }) {
  const pix = preco * 0.95; // 5% desconto PIX
  const parcelas = [
    { vezes: 1, valor: preco },
    { vezes: 2, valor: preco / 2 },
    { vezes: 3, valor: preco / 3 },
    { vezes: 4, valor: preco / 4 },
    { vezes: 5, valor: preco / 5 },
    { vezes: 6, valor: preco / 6 },
  ];

  return (
    <div className="space-y-3">
      {/* PIX */}
      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <div>
            <p className="text-xs font-extrabold text-emerald-700">PIX com 5% OFF</p>
            <p className="text-[10px] text-emerald-600">Pagamento instantâneo</p>
          </div>
        </div>
        <span className="text-sm font-extrabold text-emerald-700">{fm(pix)}</span>
      </div>

      {/* Cartão */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs font-bold text-slate-700 mb-2">💳 Cartão de Crédito</p>
        <div className="space-y-1">
          {parcelas.slice(0, 6).map(p => (
            <div key={p.vezes} className="flex justify-between text-[11px]">
              <span className={p.vezes === 1 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                {p.vezes}x {p.vezes === 1 ? 'à vista' : `sem juros`}
              </span>
              <span className="font-semibold text-slate-700">{fm(p.valor)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Débito / Dinheiro */}
      <div className="flex gap-2">
        <div className="flex-1 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
          <span className="text-lg block">💳</span>
          <p className="text-[10px] font-bold text-slate-600">Débito</p>
          <p className="text-[10px] text-slate-400">{fm(preco)}</p>
        </div>
        <div className="flex-1 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
          <span className="text-lg block">💰</span>
          <p className="text-[10px] font-bold text-slate-600">Dinheiro</p>
          <p className="text-[10px] text-slate-400">{fm(preco)}</p>
        </div>
      </div>
    </div>
  );
}
