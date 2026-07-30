'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ClienteDashboardPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState<any>(null);
  const [dash, setDash] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = sessionStorage.getItem('marquinho-cliente');
    if (!c) { router.push('/cliente/login'); return; }
    const cd = JSON.parse(c);
    setCliente(cd);

    fetch('/api/cliente/dashboard', { headers: { Authorization: `Bearer ${cd.token}` } })
      .then(r => r.json()).then(setDash).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Bem-vindo, {cliente?.nome?.split(' ')[0] || 'Cliente'}!</h1>
        <p className="text-xs text-slate-400 mt-1">Resumo da sua conta</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Meus Pedidos', valor: dash?.totalPedidos || 0, sub: dash?.pedidosEmAndamento > 0 ? `${dash.pedidosEmAndamento} em andamento` : 'Nenhum', color: 'text-brand-600', bg: 'bg-brand-50 border-brand-200', href: '/cliente/pedidos' },
          { label: 'Favoritos', valor: dash?.totalFavoritos || 0, sub: 'Produtos salvos', color: 'text-red-500', bg: 'bg-red-50 border-red-200', href: '/cliente/favoritos' },
          { label: 'Garantias Ativas', valor: dash?.totalGarantiasAtivas || 0, sub: 'Produtos em garantia', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', href: '/cliente/garantias' },
          { label: 'Cupons', valor: dash?.cuponsDisponiveis || 0, sub: 'Disponíveis', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', href: '/cliente/cupons' },
          { label: 'Notificações', valor: dash?.notificacoesNaoLidas || 0, sub: 'Não lidas', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', href: '/cliente/notificacoes' },
        ].map(card => (
          <button key={card.label} onClick={() => router.push(card.href)}
            className={`${card.bg} rounded-xl border p-4 text-left hover:shadow-md transition-shadow cursor-pointer`}>
            <p className="text-[11px] text-slate-500 font-medium mb-1">{card.label}</p>
            <p className={`text-2xl font-extrabold ${card.color}`}>{card.valor}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
          </button>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700">Últimos Pedidos</h2>
          <button onClick={() => router.push('/cliente/pedidos')} className="text-xs text-brand-600 font-bold hover:underline">Ver todos →</button>
        </div>
        {!dash?.ultimosPedidos || dash.ultimosPedidos.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-400">Nenhum pedido ainda. Que tal fazer sua primeira compra?</p>
            <a href="/vitrine" className="text-brand-600 text-xs font-bold mt-2 inline-block">Ir para Vitrine →</a>
          </div>
        ) : (
          <div className="space-y-2">
            {dash.ultimosPedidos.map((p: any) => (
              <div key={p.id} onClick={() => router.push(`/cliente/pedidos`)}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between cursor-pointer hover:border-brand-300 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {p.itens?.[0]?.peca?.imagemUrl && (
                    <img src={p.itens[0].peca.imagemUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">Pedido #{p.numero}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.itens?.length || 0} {p.itens?.length === 1 ? 'item' : 'itens'} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700">{fm(Number(p.total))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '🛒 Continuar Comprando', href: '/vitrine' },
          { label: '❤️ Meus Favoritos', href: '/cliente/favoritos' },
          { label: '👤 Editar Perfil', href: '/cliente/perfil' },
          { label: '🔐 Segurança', href: '/cliente/seguranca' },
        ].map(link => (
          <a key={link.href} href={link.href}
            className="bg-white rounded-xl border border-slate-200 p-4 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-colors text-center">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
