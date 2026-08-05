import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/dashboard/oficina — KPIs da Oficina (FASE 15-F.1 expandido)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const agora = new Date();
    const fimHoje = new Date(hoje);
    fimHoje.setHours(23, 59, 59, 999);

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // Contagem por status (FASE 15-F.1: todos os status do novo fluxo)
    const [
      abertas, emAndamento, aguardandoPecas, aguardandoMecanico,
      emServico, teste, lavagem, prontas, entregues, canceladas,
      aguardandoPagamento, totalMes
    ] = await Promise.all([
      prisma.ordemServico.count({ where: { status: 'ABERTA' } }),
      prisma.ordemServico.count({ where: { status: 'EM_ANDAMENTO' } }),
      prisma.ordemServico.count({ where: { status: 'AGUARDANDO_PECAS' } }),
      prisma.ordemServico.count({ where: { status: 'AGUARDANDO_MECANICO' } }),
      prisma.ordemServico.count({ where: { status: 'EM_ANDAMENTO', statusPagamento: null } }),
      prisma.ordemServico.count({ where: { status: 'ABERTA', dataAgendamento: { not: null } } }),
      prisma.ordemServico.count({ where: { status: 'PRONTA', statusPagamento: 'AGUARDANDO_PAGAMENTO' } }),
      prisma.ordemServico.count({ where: { status: 'PRONTA' } }),
      prisma.ordemServico.count({ where: { statusPagamento: { not: null }, status: { notIn: ['CANCELADA', 'ABERTA'] } } }),
      prisma.ordemServico.count({ where: { status: 'CANCELADA' } }),
      prisma.ordemServico.count({ where: { statusPagamento: 'AGUARDANDO_PAGAMENTO' } }),
      prisma.ordemServico.count({ where: { createdAt: { gte: inicioMes } } }),
    ]);

    // OS atrasadas (previsaoEntrega vencida e ainda não ENTREGUE)
    const atrasadas = await prisma.ordemServico.findMany({
      where: {
        previsaoEntrega: { lt: agora },
        status: { notIn: ['CONCLUIDA', 'CANCELADA'] },
      },
      include: {
        mecanico: { select: { name: true } },
      },
      orderBy: { previsaoEntrega: 'asc' },
    });

    // Moto parada há (OS não entregues mais antigas)
    const motosParadas = await prisma.ordemServico.findMany({
      where: {
        status: { notIn: ['CONCLUIDA', 'CANCELADA'] },
      },
      select: { id: true, numero: true, nomeCliente: true, modeloMoto: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const motosParadasDetalhe = motosParadas.map(m => {
      const dias = Math.floor((agora.getTime() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const horas = Math.floor((agora.getTime() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60));
      return { ...m, dias, horas };
    });

    // Faturamento do mes
    const pagasMes = await prisma.ordemServico.findMany({
      where: { statusPagamento: 'PAGO', dataPagamento: { gte: inicioMes } },
      select: { valorPago: true, valorTotal: true },
    });
    const faturamentoMes = pagasMes.reduce((sum, os) => sum + Number(os.valorPago || os.valorTotal || 0), 0);
    const ticketMedio = pagasMes.length > 0 ? faturamentoMes / pagasMes.length : 0;
    const finalizadasHoje = await prisma.ordemServico.count({
      where: { status: 'CONCLUIDA', updatedAt: { gte: hoje, lte: fimHoje } },
    });

    // Top mecanicos (OS entregues no mes) — otimizado com groupBy + query única
    const mecanicos = await prisma.user.findMany({
      where: { role: 'MECANICO', active: true },
      select: { id: true, name: true },
    });
    const mecanicoIds = mecanicos.map(m => m.id);

    // Contagem agregada por mecânico (1 query)
    const countsGrouped = await prisma.ordemServico.groupBy({
      by: ['mecanicoId'],
      where: {
        mecanicoId: { in: mecanicoIds },
        status: 'CONCLUIDA',
        updatedAt: { gte: inicioMes },
      },
      _count: true,
    });
    const countMap = new Map(countsGrouped.map(g => [g.mecanicoId, g._count]));

    // OS com timing para cálculo de tempo médio (1 query para todos os mecânicos)
    const osComTempoAll = await prisma.ordemServico.findMany({
      where: {
        mecanicoId: { in: mecanicoIds },
        status: 'CONCLUIDA',
        updatedAt: { gte: inicioMes },
        inicioServico: { not: null },
        fimServico: { not: null },
      },
      select: { mecanicoId: true, inicioServico: true, fimServico: true },
    });

    // Agrupar OS com timing por mecânico em memória
    const osPorMecanicoMap = new Map<string, { inicioServico: Date | null; fimServico: Date | null }[]>();
    for (const os of osComTempoAll) {
      if (!os.mecanicoId) continue;
      if (!osPorMecanicoMap.has(os.mecanicoId)) {
        osPorMecanicoMap.set(os.mecanicoId, []);
      }
      osPorMecanicoMap.get(os.mecanicoId)!.push(os);
    }

    const osPorMecanico = mecanicos.map(m => {
      const count = countMap.get(m.id) || 0;
      const osDoMecanico = osPorMecanicoMap.get(m.id) || [];

      let tempoMedioMecanico = 0;
      if (osDoMecanico.length > 0) {
        const totalMin = osDoMecanico.reduce((s, o) => {
          const ini = o.inicioServico ? new Date(o.inicioServico).getTime() : 0;
          const fim = o.fimServico ? new Date(o.fimServico).getTime() : 0;
          return s + (fim - ini) / 60000;
        }, 0);
        tempoMedioMecanico = Math.round(totalMin / osDoMecanico.length);
      }

      return { nome: m.name, count, tempoMedioMinutos: tempoMedioMecanico };
    });
    osPorMecanico.sort((a, b) => b.count - a.count);

    // Tempo medio geral (entregues nos ultimos 30 dias)
    const entregues30d = await prisma.ordemServico.findMany({
      where: {
        status: 'CONCLUIDA',
        updatedAt: { gte: new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000) },
        inicioServico: { not: null }, fimServico: { not: null },
      },
      select: { inicioServico: true, fimServico: true },
    });
    let tempoMedioMinutos = 0;
    if (entregues30d.length > 0) {
      const totalMin = entregues30d.reduce((s, o) => {
        const ini = o.inicioServico ? new Date(o.inicioServico).getTime() : 0;
        const fim = o.fimServico ? new Date(o.fimServico).getTime() : 0;
        return s + (fim - ini) / 60000;
      }, 0);
      tempoMedioMinutos = Math.round(totalMin / entregues30d.length);
    }

    // Servico mais vendido (no mes)
    const servicosMes = await prisma.servicoOrdem.findMany({
      where: { ordemServico: { createdAt: { gte: inicioMes } } },
      select: { nome: true },
    });
    const servicoCounts: Record<string, number> = {};
    servicosMes.forEach(s => { servicoCounts[s.nome] = (servicoCounts[s.nome] || 0) + 1; });
    const servicoMaisVendido = Object.entries(servicoCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Agendadas hoje
    const agendadasHoje = await prisma.ordemServico.findMany({
      where: { dataAgendamento: { gte: hoje, lte: fimHoje }, status: { notIn: ['CONCLUIDA', 'CANCELADA'] } },
      include: { mecanico: { select: { name: true } } },
      orderBy: { horaAgendamento: 'asc' },
      take: 20,
    });

    // Revisoes pendentes
    const revisoesPendentes = await prisma.revisaoAgendada.findMany({
      where: { notificada: false },
      include: { ordemServico: { select: { nomeCliente: true, telefoneCliente: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      // Status flow counts
      abertas, emAndamento, aguardandoPecas, aguardandoMecanico,
      emServico, teste, lavagem, prontas, entregues, canceladas,
      aguardandoPagamento, totalMes,

      // Financeiro
      faturamentoMes,
      ticketMedio,
      finalizadasHoje: entregues, // FASE 15-F.1: "finalizadas" = entregues

      // Tempo
      tempoMedioMinutos,
      mecanicos: osPorMecanico.slice(0, 10),

      // FASE 15-F.1 novos
      atrasadas: atrasadas.map(a => ({
        id: a.id, numero: a.numero, nomeCliente: a.nomeCliente, modeloMoto: a.modeloMoto,
        status: a.status, previsaoEntrega: a.previsaoEntrega,
        mecanico: a.mecanico?.name || null,
      })),
      motosParadas: motosParadasDetalhe.slice(0, 15),
      servicoMaisVendido,
      agendadasHoje,
      revisoesPendentes,
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard oficina:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
