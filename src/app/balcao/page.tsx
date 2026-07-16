import prisma from '@/lib/prisma';

export default async function BalcaoDashboard() {
  const [totalPecas, osAbertas, osEmAndamento, osConcluidas] = await Promise.all([
    prisma.peca.count({ where: { ativo: true } }),
    prisma.ordemServico.count({ where: { status: 'ABERTA' } }),
    prisma.ordemServico.count({ where: { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO_PECAS'] } } }),
    prisma.ordemServico.count({ where: { status: { in: ['PRONTA', 'CONCLUIDA'] }, updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
  ]);

  const ordens = await prisma.ordemServico.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { mecanico: { select: { name: true } } },
  });

  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const statusColor: Record<string, string> = { ABERTA: 'bg-sky-50 text-sky-700', EM_ANDAMENTO: 'bg-amber-50 text-amber-700', AGUARDANDO_PECAS: 'bg-orange-50 text-orange-700', PRONTA: 'bg-violet-50 text-violet-700', CONCLUIDA: 'bg-emerald-50 text-emerald-700', CANCELADA: 'bg-red-50 text-red-700' };
  const statusDot: Record<string, string> = { ABERTA: 'bg-sky-500', EM_ANDAMENTO: 'bg-amber-500', AGUARDANDO_PECAS: 'bg-orange-500', PRONTA: 'bg-violet-500', CONCLUIDA: 'bg-emerald-500', CANCELADA: 'bg-red-500' };
  const statusLabel: Record<string, string> = { ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_PECAS: 'Aguard. pecas', PRONTA: 'Pronta', CONCLUIDA: 'Concluida', CANCELADA: 'Cancelada' };

  return (
    <div className="p-6 space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Pecas no estoque</p>
          <p className="text-2xl font-bold text-slate-800">{totalPecas}</p>
        </div>
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">OS abertas</p>
          <p className="text-2xl font-bold text-sky-600">{osAbertas}</p>
        </div>
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Em andamento</p>
          <p className="text-2xl font-bold text-amber-600">{osEmAndamento}</p>
        </div>
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Concluidas no mes</p>
          <p className="text-2xl font-bold text-emerald-600">{osConcluidas}</p>
        </div>
      </div>

      {/* Botoes de acao */}
      <div className="flex items-center gap-3">
        <a href="/balcao/ordens" className="btn-primary inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Nova OS
        </a>
        <a href="/balcao/estoque" className="btn-secondary inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Nova Peca
        </a>
      </div>

      {/* Tabela de OS */}
      <div className="card-table">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Ordens de Servico recentes</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-3 px-6 font-medium text-slate-500">OS</th>
                <th className="text-left py-3 px-6 font-medium text-slate-500">Cliente</th>
                <th className="text-left py-3 px-6 font-medium text-slate-500">Moto</th>
                <th className="text-left py-3 px-6 font-medium text-slate-500">Mecanico</th>
                <th className="text-center py-3 px-6 font-medium text-slate-500">Status</th>
                <th className="text-right py-3 px-6 font-medium text-slate-500">Valor</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map((os, i) => (
                <tr key={os.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${i%2===0?'bg-white':'bg-slate-50/20'}`} onClick={() => window.location.href = '/balcao/ordens'}>
                  <td className="py-3 px-6 font-semibold text-brand-600">#{os.numero}</td>
                  <td className="py-3 px-6 text-slate-700 font-medium">{os.nomeCliente}</td>
                  <td className="py-3 px-6 text-slate-500">{os.modeloMoto}{os.placaMoto ? ` - ${os.placaMoto}` : ''}</td>
                  <td className="py-3 px-6 text-slate-500">{os.mecanico?.name || '-'}</td>
                  <td className="py-3 px-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColor[os.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[os.status]}`} />{statusLabel[os.status]}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right font-semibold text-slate-700">{formatMoney(Number(os.valorTotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
