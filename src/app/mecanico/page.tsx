import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export default async function MecanicoDashboard() {
  const session = await getSession();

  const minhasOS = await prisma.ordemServico.findMany({
    where: { mecanicoId: session!.id },
    orderBy: { createdAt: 'desc' },
    include: {
      itens: { include: { peca: { select: { nome: true, codigo: true } } } },
      balcao: { select: { name: true } },
    },
  });

  const emAndamento = minhasOS.filter(os => ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECAS'].includes(os.status)).length;
  const concluidas = minhasOS.filter(os => ['CONCLUIDA', 'ENTREGUE'].includes(os.status)).length;
  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const statusColor: Record<string, string> = {
    ABERTA: 'bg-sky-50 text-sky-700', EM_ANDAMENTO: 'bg-amber-50 text-amber-700',
    AGUARDANDO_PECAS: 'bg-orange-50 text-orange-700', CONCLUIDA: 'bg-emerald-50 text-emerald-700',
    ENTREGUE: 'bg-slate-100 text-slate-600', CANCELADA: 'bg-red-50 text-red-700',
  };
  const statusDot: Record<string, string> = {
    ABERTA: 'bg-sky-500', EM_ANDAMENTO: 'bg-amber-500', AGUARDANDO_PECAS: 'bg-orange-500',
    CONCLUIDA: 'bg-emerald-500', ENTREGUE: 'bg-slate-400', CANCELADA: 'bg-red-500',
  };
  const statusLabel: Record<string, string> = {
    ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_PECAS: 'Aguard. pecas',
    CONCLUIDA: 'Concluida', ENTREGUE: 'Entregue', CANCELADA: 'Cancelada',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabecalho */}
      <div>
        <h1 className="text-lg font-bold text-slate-900">Minhas Ordens de Servico</h1>
        <p className="text-sm text-slate-500 mt-0.5">Bem-vindo, {session?.name}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Total de OS</p>
          <p className="text-2xl font-bold text-slate-800">{minhasOS.length}</p>
        </div>
        <div className="card-stat border-l-amber-500">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Em andamento</p>
          <p className="text-2xl font-bold text-amber-600">{emAndamento}</p>
        </div>
        <div className="card-stat border-l-emerald-500">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Concluidas</p>
          <p className="text-2xl font-bold text-emerald-600">{concluidas}</p>
        </div>
      </div>

      {/* Lista de OS */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Minhas ordens</h2>
        {minhasOS.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">Nenhuma OS atribuida a voce.</p>
        ) : (
          <div className="space-y-3">
            {minhasOS.map((os) => (
              <div key={os.id} className="border border-slate-200 rounded-xl px-5 py-4 hover:border-brand-200 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-brand-600">OS #{os.numero}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm text-slate-700 font-medium">{os.nomeCliente}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColor[os.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[os.status]}`} />
                    {statusLabel[os.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{os.modeloMoto}{os.placaMoto ? ` - ${os.placaMoto}` : ''}{os.anoMoto ? ` - ${os.anoMoto}` : ''}</p>
                {os.itens.length > 0 && (
                  <p className="text-xs text-slate-400 mb-2 truncate">
                    Pecas: {os.itens.map(i => `${i.peca.nome} (x${i.quantidade})`).join(', ')}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Balcao: {os.balcao?.name || '-'}</span>
                  <span className="text-sm font-bold text-slate-800">{formatMoney(Number(os.valorTotal))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
