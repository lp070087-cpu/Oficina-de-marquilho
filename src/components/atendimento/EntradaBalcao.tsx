'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EntradaBalcao({ tipo }: { tipo?: string | null }) {
  const pathname = usePathname();
  if (pathname !== '/balcao' || !['SERVICOS', 'VENDA_LOJA'].includes(tipo || '')) return null;
  const caixa = tipo === 'SERVICOS';
  return <div className="mx-6 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-orange-200 bg-white p-5"><div><h2 className="text-xl font-bold text-slate-800">{caixa ? 'Recebimento no caixa' : 'Novo atendimento'}</h2><p className="mt-1 text-sm text-slate-500">{caixa ? 'Consulte o código, confira o pedido e confirme o pagamento.' : 'Monte o pedido no catálogo e entregue o código ao cliente.'}</p></div><Link href={caixa ? '/balcao/recebimento' : '/balcao/atendimento'} className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700">{caixa ? 'Receber pedido' : 'Iniciar atendimento'} →</Link></div>;
}
