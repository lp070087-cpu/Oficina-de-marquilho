import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Include compartilhado: OS completa p/ impressão + Venda completa p/ impressão
const includeNota = {
  ordemServico: {
    select: {
      numero: true, nomeCliente: true, telefoneCliente: true, valorTotal: true,
      modeloMoto: true, placaMoto: true, anoMoto: true, valorMaoDeObra: true,
      desconto: true, formaPagamento: true, tipoServico: true, status: true,
      inicioServico: true, fimServico: true,
      mecanico: { select: { name: true } },
      itens: { select: { peca: { select: { codigo: true, nome: true } }, quantidade: true, precoUnitario: true } },
      servicos: true,
    },
  },
  venda: {
    include: {
      itens: { include: { peca: { select: { nome: true, codigo: true } } } },
      pagamentos: true,
    },
  },
} as const;

function numeroOS(n: number) {
  return `OS-${String(n).padStart(4, '0')}`;
}
function numeroVenda(n: number) {
  return `V-${String(n).padStart(4, '0')}`;
}

// POST: emitir nota para uma OS OU para uma Venda (PDV)
// Se `numero` não for informado, gera automaticamente (OS-xxxx / V-xxxx)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { ordemServicoId, vendaId, numero, chaveAcesso, dataServico } = body;

    if (!ordemServicoId && !vendaId) {
      return NextResponse.json({ error: 'Informe a OS ou a Venda' }, { status: 400 });
    }

    let dataServicoFinal: Date;
    let numeroFinal = numero || '';

    if (ordemServicoId) {
      const existente = await prisma.notaFiscal.findUnique({ where: { ordemServicoId } });
      if (existente) return NextResponse.json({ error: 'Essa OS ja possui nota fiscal' }, { status: 400 });

      const os = await prisma.ordemServico.findUnique({ where: { id: ordemServicoId }, select: { numero: true, createdAt: true } });
      if (!os) return NextResponse.json({ error: 'OS nao encontrada' }, { status: 404 });

      // Prioridade: dataServico informada → createdAt da OS → agora
      dataServicoFinal = dataServico ? new Date(dataServico) : os.createdAt ? new Date(os.createdAt) : new Date();
      if (!numeroFinal) numeroFinal = numeroOS(os.numero);
    } else {
      const existente = await prisma.notaFiscal.findUnique({ where: { vendaId } });
      if (existente) return NextResponse.json({ error: 'Essa venda ja possui nota fiscal' }, { status: 400 });

      const venda = await prisma.venda.findUnique({ where: { id: vendaId }, select: { numero: true, createdAt: true } });
      if (!venda) return NextResponse.json({ error: 'Venda nao encontrada' }, { status: 404 });

      dataServicoFinal = dataServico ? new Date(dataServico) : venda.createdAt ? new Date(venda.createdAt) : new Date();
      if (!numeroFinal) numeroFinal = numeroVenda(venda.numero);
    }

    const nf = await prisma.notaFiscal.create({
      data: {
        ordemServicoId: ordemServicoId || null,
        vendaId: vendaId || null,
        numero: numeroFinal,
        chaveAcesso: chaveAcesso || null,
        dataServico: dataServicoFinal,
      },
      include: includeNota as any,
    });
    return NextResponse.json(nf, { status: 201 });
  } catch (e: any) {
    console.error('Erro ao emitir nota:', e);
    return NextResponse.json({ error: 'Erro ao emitir nota' }, { status: 500 });
  }
}

// GET: Central de Notas (OS + Vendas/PDV)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  try {
    const notas = await prisma.notaFiscal.findMany({
      include: includeNota as any,
      orderBy: { emitidaEm: 'desc' },
      take: 200,
    });
    return NextResponse.json(notas);
  } catch (e: any) {
    console.error('Erro ao listar notas:', e);
    return NextResponse.json({ error: 'Erro ao listar notas' }, { status: 500 });
  }
}

// PUT: ajustar a Data do Serviço de uma nota já emitida (sem alterar emitidaEm)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['DONO', 'BALCAO'].includes(session.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.dataServico) {
      return NextResponse.json({ error: 'dataServico e obrigatorio' }, { status: 400 });
    }
    let nf;
    if (body.ordemServicoId) {
      nf = await prisma.notaFiscal.update({
        where: { ordemServicoId: body.ordemServicoId },
        data: { dataServico: new Date(body.dataServico) },
        include: includeNota as any,
      });
    } else if (body.vendaId) {
      nf = await prisma.notaFiscal.update({
        where: { vendaId: body.vendaId },
        data: { dataServico: new Date(body.dataServico) },
        include: includeNota as any,
      });
    } else {
      return NextResponse.json({ error: 'Informe a OS ou a Venda' }, { status: 400 });
    }
    return NextResponse.json(nf);
  } catch (e: any) {
    console.error('Erro ao atualizar data do servico:', e);
    return NextResponse.json({ error: 'Erro ao atualizar data do servico' }, { status: 500 });
  }
}
