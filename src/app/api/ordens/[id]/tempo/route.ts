import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT /api/ordens/[id]/tempo — Iniciar/pausar/finalizar servico (controle de tempo)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO', 'MECANICO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { acao, tempoEstimado } = body;
    // acao: 'INICIAR', 'PAUSAR', 'FINALIZAR', 'ESTIMAR'

    const os = await prisma.ordemServico.findUnique({ where: { id } });
    if (!os) return NextResponse.json({ error: 'OS nao encontrada' }, { status: 404 });

    const data: any = {};

    switch (acao) {
      case 'INICIAR':
        data.inicioServico = new Date();
        break;
      case 'FINALIZAR':
        data.fimServico = new Date();
        break;
      case 'ESTIMAR':
        if (tempoEstimado !== undefined) data.tempoEstimado = tempoEstimado;
        break;
      default:
        return NextResponse.json({ error: 'Acao invalida. Use: INICIAR, FINALIZAR, ESTIMAR' }, { status: 400 });
    }

    const updated = await prisma.ordemServico.update({
      where: { id },
      data,
    });

    // Registrar historico
    const descMap: Record<string, string> = {
      INICIAR: `Servico iniciado por ${session.name}`,
      FINALIZAR: `Servico finalizado por ${session.name}`,
      ESTIMAR: `Tempo estimado alterado para ${tempoEstimado} minutos`,
    };

    await prisma.historicoOS.create({
      data: {
        ordemServicoId: id,
        tipo: acao === 'FINALIZAR' ? 'FINALIZACAO' : 'MUDANCA_STATUS',
        descricao: descMap[acao] || `Acao: ${acao}`,
        usuario: session.name,
        usuarioId: session.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao controlar tempo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
