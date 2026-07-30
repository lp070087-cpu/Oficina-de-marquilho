import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/ordens/[id]/validar-finalizacao — Verificar se OS pode ser finalizada
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

  const { id } = await params;

  try {
    const os = await prisma.ordemServico.findUnique({
      where: { id },
      include: {
        fotos: true,
        checklist: true,
        assinatura: true,
      },
    });

    if (!os) return NextResponse.json({ error: 'OS nao encontrada' }, { status: 404 });

    const bloqueios: string[] = [];

    // Fotos obrigatórias: RECEPCAO, ANTES, DEPOIS
    const tiposObrigatorios = ['RECEPCAO', 'ANTES', 'DEPOIS'];
    const fotosPorTipo: Record<string, boolean> = {};
    os.fotos.forEach(f => { fotosPorTipo[f.tipo] = true; });

    tiposObrigatorios.forEach(tipo => {
      if (!fotosPorTipo[tipo]) {
        bloqueios.push(`Foto obrigatória faltando: ${tipo}`);
      }
    });

    // Checklist obrigatório
    const itensObrigatorios = os.checklist.filter(c => c.obrigatorio);
    const itensObrigatoriosPendentes = itensObrigatorios.filter(c => !c.concluido);
    if (itensObrigatoriosPendentes.length > 0) {
      bloqueios.push(`${itensObrigatoriosPendentes.length} item(ns) obrigatório(s) do checklist pendente(s): ${itensObrigatoriosPendentes.map(i => i.item).join(', ')}`);
    }

    // Assinatura
    if (!os.assinatura) {
      bloqueios.push('Assinatura do cliente é obrigatória para finalizar');
    }

    // Pagamento exigido — se a OS tem valor, exige pagamento
    const temValor = Number(os.valorTotal) > 0;
    if (temValor && os.statusPagamento !== 'PAGO') {
      bloqueios.push('Pagamento pendente — o valor total da OS é R$ ' + Number(os.valorTotal).toFixed(2));
    }

    return NextResponse.json({
      podeFinalizar: bloqueios.length === 0,
      bloqueios,
      totalBloqueios: bloqueios.length,
    });
  } catch (error) {
    console.error('Erro ao validar finalizacao:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
