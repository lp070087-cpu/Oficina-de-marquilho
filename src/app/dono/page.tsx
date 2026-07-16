import prisma from '@/lib/prisma';

export default async function DonoDashboard() {
  const [totalPecas, unidadesEstoque, estoqueBaixoRaw, osAbertas, osEmAndamento, osConcluidasMes, notasEmitidas, mecanicosAtivos] =
    await Promise.all([
      prisma.peca.count({ where: { ativo: true } }),
      prisma.peca.aggregate({ _sum: { quantidade: true }, where: { ativo: true } }),
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::int as count FROM "Peca" WHERE ativo = true AND quantidade <= "estoqueMinimo"`,
      prisma.ordemServico.count({ where: { status: 'ABERTA' } }),
      prisma.ordemServico.count({ where: { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO_PECAS'] } } }),
      prisma.ordemServico.count({ where: { status: { in: ['PRONTA', 'CONCLUIDA'] }, updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.notaFiscal.count(),
      prisma.user.count({ where: { role: 'MECANICO', active: true } }),
    ]);

  const faturamentoMes = await prisma.ordemServico.aggregate({
    _sum: { valorTotal: true },
    where: { status: { in: ['PRONTA', 'CONCLUIDA'] }, updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
  });

  const pecasBaixoEstoque = await prisma.peca.findMany({
    where: { ativo: true, quantidade: { lte: prisma.peca.fields.estoqueMinimo } },
    orderBy: { quantidade: 'asc' },
    take: 5,
    select: { nome: true, quantidade: true, estoqueMinimo: true, codigo: true },
  });

  const ultimasOS = await prisma.ordemServico.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { mecanico: { select: { name: true } }, notaFiscal: { select: { numero: true } } },
  });

  // Serviços finalizados recentemente
  const servicosFinalizados = await prisma.ordemServico.findMany({
    where: { status: { in: ['PRONTA', 'CONCLUIDA'] } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: { mecanico: { select: { name: true } }, itens: { include: { peca: { select: { nome: true } } } }, notaFiscal: { select: { numero: true } } },
  });

  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const estoqueBaixo = Number(estoqueBaixoRaw[0]?.count ?? 0);
  const totalUnidades = Number(unidadesEstoque._sum.quantidade) || 0;

  // Nivel do estoque (porcentagem de pecas que estao ok vs baixas)
  const nivelOk = totalPecas > 0 ? Math.round(((totalPecas - estoqueBaixo) / totalPecas) * 100) : 100;
  const nivelBaixo = totalPecas > 0 ? 100 - nivelOk : 0;

  const statusLabel: Record<string, string> = {
    ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_PECAS: 'Aguard. pecas',
    PRONTA: 'Pronta', CONCLUIDA: 'Concluida', CANCELADA: 'Cancelada',
  };
  const statusColor: Record<string, string> = {
    ABERTA: 'bg-sky-50 text-sky-700', EM_ANDAMENTO: 'bg-amber-50 text-amber-700',
    AGUARDANDO_PECAS: 'bg-orange-50 text-orange-700', PRONTA: 'bg-violet-50 text-violet-700',
    CONCLUIDA: 'bg-emerald-50 text-emerald-700', CANCELADA: 'bg-red-50 text-red-700',
  };
  const statusDot: Record<string, string> = {
    ABERTA: 'bg-sky-500', EM_ANDAMENTO: 'bg-amber-500',
    AGUARDANDO_PECAS: 'bg-orange-500', PRONTA: 'bg-violet-500',
    CONCLUIDA: 'bg-emerald-500', CANCELADA: 'bg-red-500',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cards estatisticos */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Pecas cadastradas</p>
          <p className="text-2xl font-bold text-slate-800">{totalPecas}</p>
          <p className="text-[11px] text-slate-400 mt-1">Itens ativos no estoque</p>
        </div>
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Unidades em estoque</p>
          <p className="text-2xl font-bold text-slate-800">{totalUnidades.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Quantidade total de pecas</p>
        </div>
        <div className="card-stat border-l-brand-600">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">OS em andamento</p>
          <p className="text-2xl font-bold text-amber-600">{osEmAndamento}</p>
          <p className="text-[11px] text-slate-400 mt-1">{osAbertas} abertas no momento</p>
        </div>
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Notas emitidas</p>
          <p className="text-2xl font-bold text-slate-800">{notasEmitidas}</p>
          <p className="text-[11px] text-slate-400 mt-1">{osConcluidasMes} OS concluidas no mes</p>
        </div>
        <div className="card-stat">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">Mecanicos ativos</p>
          <p className="text-2xl font-bold text-slate-800">{mecanicosAtivos}</p>
          <p className="text-[11px] text-slate-400 mt-1">Faturamento: {formatMoney(Number(faturamentoMes._sum.valorTotal) || 0)}</p>
        </div>
      </div>

      {/* Grafico e pecas baixas */}
      <div className="grid grid-cols-2 gap-4">
        {/* Nivel geral de estoque */}
        <div className="card flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke={nivelOk > 60 ? '#2563eb' : nivelOk > 30 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${nivelOk} ${100 - nivelOk}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-800">{nivelOk}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Nivel geral de estoque</h3>
            <p className="text-xs text-slate-500 mb-3">Porcentagem de pecas com estoque adequado</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600 flex-shrink-0" />
                <span className="text-slate-600">Estoque OK</span>
                <span className="text-slate-800 font-semibold ml-auto">{totalPecas - estoqueBaixo} pecas</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-slate-600">Abaixo do minimo</span>
                <span className="text-slate-800 font-semibold ml-auto">{estoqueBaixo} pecas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pecas abaixo do estoque minimo */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Pecas abaixo do estoque minimo</h3>
          {pecasBaixoEstoque.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Todas as pecas estao com estoque adequado</p>
          ) : (
            <div className="space-y-3">
              {pecasBaixoEstoque.map((peca, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[13px] font-medium text-slate-700">{peca.nome}</p>
                    <p className="text-[11px] text-slate-400">Cod: {peca.codigo} &middot; Min: {peca.estoqueMinimo}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700">
                    {peca.quantidade} un.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ultimas OS */}
      <div className="card-table">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Ultimas Ordens de Servico</h3>
          <a href="/dono/ordens" className="text-xs text-brand-600 hover:text-brand-700 font-medium">Ver todas</a>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-3 px-6 font-medium text-slate-500">OS</th>
                <th className="text-left py-3 px-6 font-medium text-slate-500">Cliente</th>
                <th className="text-left py-3 px-6 font-medium text-slate-500">Moto / Placa</th>
                <th className="text-left py-3 px-6 font-medium text-slate-500">Mecanico</th>
                <th className="text-center py-3 px-6 font-medium text-slate-500">Status</th>
                <th className="text-right py-3 px-6 font-medium text-slate-500">Valor</th>
              </tr>
            </thead>
            <tbody>
              {ultimasOS.map((os, i) => (
                <tr key={os.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                  <td className="py-3 px-6 font-semibold text-brand-600">#{os.numero}</td>
                  <td className="py-3 px-6 text-slate-700 font-medium">{os.nomeCliente}</td>
                  <td className="py-3 px-6 text-slate-500">{os.modeloMoto}{os.placaMoto ? ` - ${os.placaMoto}` : ''}</td>
                  <td className="py-3 px-6 text-slate-500">{os.mecanico?.name || '-'}</td>
                  <td className="py-3 px-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColor[os.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[os.status]}`} />
                      {statusLabel[os.status]}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right font-semibold text-slate-700">{formatMoney(Number(os.valorTotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Servicos finalizados recentemente */}
      {servicosFinalizados.length > 0 && (
        <div className="card-table">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Servicos finalizados recentemente</h3>
            <span className="text-xs text-slate-400">{servicosFinalizados.length} OS concluidas/entregues</span>
          </div>
          <div className="px-6 py-3 space-y-3">
            {servicosFinalizados.map(os => (
              <div key={os.id} className="flex items-start justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-brand-600">#{os.numero}</span>
                    <span className="text-xs text-slate-700 font-medium">{os.nomeCliente}</span>
                    <span className="text-xs text-slate-400">- {os.modeloMoto}</span>
                  </div>
                  {os.tipoServico && <p className="text-[11px] text-slate-500 mb-1">Servico: {os.tipoServico}</p>}
                  {os.itens.length > 0 && (
                    <p className="text-[11px] text-slate-400 truncate">
                      Pecas: {os.itens.map(i => i.peca.nome).join(', ')}
                    </p>
                  )}
                  {os.mecanico && <p className="text-[10px] text-slate-400 mt-0.5">Mecanico: {os.mecanico.name}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-bold text-slate-800">{formatMoney(Number(os.valorTotal))}</p>
                  {os.notaFiscal && <p className="text-[10px] text-emerald-600 font-medium">NF: #{os.notaFiscal.numero}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
