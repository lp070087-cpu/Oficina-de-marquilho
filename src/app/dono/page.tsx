import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function DonoDashboard() {
  const [totalPecas, unidadesEstoque, estoqueBaixoRaw, osAbertas, osEmAndamento, osConcluidasMes, osAguardandoPagamento, notasEmitidas, mecanicosAtivos] =
    await Promise.all([
      prisma.peca.count({ where: { ativo: true } }),
      prisma.peca.aggregate({ _sum: { quantidade: true }, where: { ativo: true } }),
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::int as count FROM "Peca" WHERE ativo = true AND "estoqueMinimo" > 0 AND quantidade < "estoqueMinimo"`,
      prisma.ordemServico.count({ where: { status: 'ABERTA' } }),
      prisma.ordemServico.count({ where: { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO_PECAS'] } } }),
      prisma.ordemServico.count({ where: { status: { in: ['PRONTA', 'CONCLUIDA'] }, updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.ordemServico.count({ where: { statusPagamento: 'AGUARDANDO_PAGAMENTO' } }),
      prisma.notaFiscal.count(),
      prisma.user.count({ where: { role: 'MECANICO', active: true } }),
    ]);

  const faturamentoMes = await prisma.ordemServico.aggregate({
    _sum: { valorTotal: true },
    where: { status: { in: ['PRONTA', 'CONCLUIDA'] }, updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
  });

  const pecasBaixoEstoque = await prisma.peca.findMany({
    where: { ativo: true, estoqueMinimo: { gt: 0 }, quantidade: { lt: prisma.peca.fields.estoqueMinimo } },
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
  const faturamento = Number(faturamentoMes._sum.valorTotal) || 0;
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Nivel do estoque (porcentagem de pecas que estao ok vs baixas)
  const nivelOk = totalPecas > 0 ? Math.round(((totalPecas - estoqueBaixo) / totalPecas) * 100) : 100;
  const nivelCor = nivelOk > 60 ? '#1a56a4' : nivelOk > 30 ? '#e8991a' : '#ef4444';

  const statusLabel: Record<string, string> = {
    ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_PECAS: 'Aguard. pecas',
    PRONTA: 'Pronta', CONCLUIDA: 'Concluida', CANCELADA: 'Cancelada',
  };
  const statusColor: Record<string, string> = {
    ABERTA: 'bg-sky-50 text-sky-700 ring-sky-600/15', EM_ANDAMENTO: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    AGUARDANDO_PECAS: 'bg-orange-50 text-orange-700 ring-orange-600/15', PRONTA: 'bg-violet-50 text-violet-700 ring-violet-600/15',
    CONCLUIDA: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', CANCELADA: 'bg-red-50 text-red-700 ring-red-600/15',
  };
  const statusDot: Record<string, string> = {
    ABERTA: 'bg-sky-500', EM_ANDAMENTO: 'bg-amber-500',
    AGUARDANDO_PECAS: 'bg-orange-500', PRONTA: 'bg-violet-500',
    CONCLUIDA: 'bg-emerald-500', CANCELADA: 'bg-red-500',
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap ring-1 ring-inset ${statusColor[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
      {statusLabel[status]}
    </span>
  );

  // Indicadores secundários — mesmos números do painel anterior, reorganizados
  const indicadores = [
    { label: 'OS em andamento', valor: osEmAndamento, detalhe: `${osAbertas} abertas no momento`, destaque: osEmAndamento > 0 ? 'text-amber-600' : 'text-slate-900', href: '/dono/ordens' },
    { label: 'Aguard. pagamento', valor: osAguardandoPagamento, detalhe: 'OS aguardando cobranca', destaque: osAguardandoPagamento > 0 ? 'text-amber-600' : 'text-slate-900', href: '/dono/ordens' },
    { label: 'Pecas cadastradas', valor: totalPecas, detalhe: 'Itens ativos no estoque', destaque: 'text-slate-900', href: '/dono/estoque' },
    { label: 'Unidades em estoque', valor: totalUnidades, detalhe: 'Quantidade total de pecas', destaque: 'text-slate-900', href: '/dono/estoque' },
    { label: 'Notas emitidas', valor: notasEmitidas, detalhe: `${osConcluidasMes} OS concluidas no mes`, destaque: 'text-slate-900', href: '/dono/notas' },
    { label: 'Funcionarios ativos', valor: mecanicosAtivos, detalhe: 'Mecanicos com acesso', destaque: 'text-slate-900', href: '/dono/mecanicos' },
  ];

  // Placa preenchida com "-" ou "0" no cadastro é tratada como vazia na exibição
  const placa = (v: string | null) => (v && !/^[-0s]+$/.test(v) ? v : '');

  const atalhos = [
    { label: 'Ordens de servico', href: '/dono/ordens', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'NF Manual', href: '/dono/nf-manual', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Estoque', href: '/dono/estoque', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1440px] mx-auto">
      {/* Cabecalho da pagina */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="eyebrow">Visao geral</p>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight mt-1">Painel da oficina</h2>
        </div>
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
          {atalhos.map(a => (
            <Link key={a.href} href={a.href} className="inline-flex items-center justify-center gap-2 h-9 px-2 sm:px-3.5 whitespace-nowrap rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors">
              <svg className="hidden min-[400px]:block w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={a.d} /></svg>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Faturamento + indicadores */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,0.9fr)_2fr] gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#0F1A2E] text-white p-5 sm:p-6 flex flex-col justify-between min-h-[176px]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold-400 via-gold-500 to-transparent" />
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">Faturamento de servicos</p>
            <p className="text-[11px] text-slate-500 mt-0.5 first-letter:uppercase">{mesAtual}</p>
          </div>
          <div className="mt-5">
            <p className="text-3xl sm:text-[34px] font-semibold tracking-tight num leading-none">{formatMoney(faturamento)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-400">
              <span><strong className="text-white font-semibold num">{osConcluidasMes}</strong> OS concluidas no mes</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-600" />
              <span><strong className="text-gold-400 font-semibold num">{osAguardandoPagamento}</strong> aguardando pagamento</span>
            </div>
          </div>
        </div>

        <div className="card-table grid grid-cols-2 md:grid-cols-3">
          {indicadores.map((k, i) => (
            <Link key={k.label} href={k.href}
              className={`group p-4 sm:p-5 hover:bg-slate-50/70 transition-colors border-slate-100 ${i % 2 === 0 ? 'border-r' : 'border-r-0'} ${(i + 1) % 3 === 0 ? 'md:border-r-0' : 'md:border-r'} ${i < 4 ? 'border-b' : 'border-b-0'} ${i < 3 ? 'md:border-b' : 'md:border-b-0'}`}>
              <p className="text-[12px] text-slate-500 font-medium">{k.label}</p>
              <p className={`text-2xl font-semibold tracking-tight mt-1.5 num ${k.destaque}`}>{k.valor.toLocaleString('pt-BR')}</p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{k.detalhe}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Estoque: nivel geral e pecas baixas */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4">
        <div className="card p-5 sm:p-6 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-900">Nivel geral de estoque</h3>
              <p className="text-xs text-slate-500 mt-0.5">Porcentagem de pecas com estoque adequado</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-5 sm:gap-6">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#eef2f7" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={nivelCor} strokeWidth="3.2"
                  pathLength={100} strokeDasharray={`${nivelOk} ${100 - nivelOk}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl font-semibold text-slate-900 num leading-none">{nivelOk}%</span>
                <span className="text-[10px] text-slate-400 mt-1">adequado</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600"><span className="w-2 h-2 rounded-full bg-brand-600" />Estoque OK</span>
                  <span className="font-semibold text-slate-900 num">{(totalPecas - estoqueBaixo).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600"><span className="w-2 h-2 rounded-full bg-red-500" />Abaixo do minimo</span>
                  <span className="font-semibold text-slate-900 num">{estoqueBaixo.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-red-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${nivelOk}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-0 min-w-0 flex flex-col">
          <div className="px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-900">Pecas abaixo do estoque minimo</h3>
              <p className="text-xs text-slate-500 mt-0.5">As mais criticas primeiro</p>
            </div>
            <Link href="/dono/estoque" className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap">Abrir estoque</Link>
          </div>
          {pecasBaixoEstoque.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-6 pb-6">
              <p className="text-xs text-slate-400 text-center py-6">Todas as pecas estao com estoque adequado</p>
            </div>
          ) : (
            <ul className="px-5 sm:px-6 pb-4 divide-y divide-slate-100">
              {pecasBaixoEstoque.map((peca, i) => {
                const pct = peca.estoqueMinimo > 0 ? Math.min(100, Math.round((peca.quantidade / peca.estoqueMinimo) * 100)) : 0;
                return (
                  <li key={i} className="py-2.5 flex items-center gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{peca.nome}</p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">{peca.codigo}</p>
                    </div>
                    <div className="hidden min-[420px]:block w-24 sm:w-32 flex-shrink-0">
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${pct <= 25 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(pct, 4)}%` }} />
                      </div>
                    </div>
                    <span className="text-[12px] text-slate-500 flex-shrink-0 whitespace-nowrap num">
                      <strong className="text-red-600 font-semibold">{peca.quantidade}</strong> / {peca.estoqueMinimo} un.
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Ultimas OS */}
      <div className="card-table">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">Ultimas ordens de servico</h3>
            <p className="text-xs text-slate-500 mt-0.5">As {ultimasOS.length} mais recentes</p>
          </div>
          <Link href="/dono/ordens" className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap">Ver todas</Link>
        </div>

        {/* Celular: lista em cartoes */}
        <ul className="md:hidden divide-y divide-slate-100">
          {ultimasOS.map(os => (
            <li key={os.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-semibold text-brand-700 num">#{os.numero}</span>
                <StatusBadge status={os.status} />
              </div>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 truncate">{os.nomeCliente}</p>
                  <p className="text-[11px] text-slate-500 truncate">{os.modeloMoto}{placa(os.placaMoto) ? ` · ${placa(os.placaMoto)}` : ''}{os.mecanico?.name ? ` · ${os.mecanico.name}` : ''}</p>
                </div>
                <span className="text-[13px] font-semibold text-slate-900 whitespace-nowrap num">{formatMoney(Number(os.valorTotal))}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Tablet e computador: tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="text-left py-2.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">OS</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Moto / Placa</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mecanico</th>
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="text-right py-2.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ultimasOS.map(os => (
                <tr key={os.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-6 font-semibold text-brand-700 num whitespace-nowrap">#{os.numero}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium max-w-[220px] truncate">{os.nomeCliente}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-[220px] truncate">{os.modeloMoto}{placa(os.placaMoto) ? <span className="text-slate-400"> · {placa(os.placaMoto)}</span> : ''}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{os.mecanico?.name || '-'}</td>
                  <td className="py-3 px-4"><StatusBadge status={os.status} /></td>
                  <td className="py-3 px-6 text-right font-semibold text-slate-900 whitespace-nowrap num">{formatMoney(Number(os.valorTotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ultimasOS.length === 0 && <p className="text-xs text-slate-400 text-center py-8">Nenhuma ordem de servico registrada</p>}
      </div>

      {/* Servicos finalizados recentemente */}
      {servicosFinalizados.length > 0 && (
        <div className="card-table">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-900">Servicos finalizados recentemente</h3>
              <p className="text-xs text-slate-500 mt-0.5">{servicosFinalizados.length} OS concluidas/entregues</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {servicosFinalizados.map(os => (
              <li key={os.id} className="px-4 sm:px-6 py-3.5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[13px] font-semibold text-brand-700 num">#{os.numero}</span>
                    <span className="text-[13px] text-slate-800 font-medium truncate max-w-[200px]">{os.nomeCliente}</span>
                    <span className="text-xs text-slate-400 truncate max-w-[200px]">{os.modeloMoto}</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {os.tipoServico && <p className="text-[12px] text-slate-600">{os.tipoServico}</p>}
                    {os.itens.length > 0 && (
                      <p className="text-[11px] text-slate-400 truncate">Pecas: {os.itens.map(i => i.peca.nome).join(', ')}</p>
                    )}
                    {os.mecanico && <p className="text-[11px] text-slate-400">Mecanico: {os.mecanico.name}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[14px] font-semibold text-slate-900 num">{formatMoney(Number(os.valorTotal))}</p>
                  {os.notaFiscal && <p className="mt-1 inline-flex text-[10.5px] font-medium text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-600/15 rounded px-1.5 py-0.5">NF #{os.notaFiscal.numero}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
