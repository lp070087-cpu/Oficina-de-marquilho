import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  const { linhas, categoriaDefaultId } = await req.json();

  if (!linhas || !Array.isArray(linhas) || linhas.length === 0) {
    return NextResponse.json({ error: 'Nenhum dado para importar' }, { status: 400 });
  }
  if (!categoriaDefaultId) {
    return NextResponse.json({ error: 'categoriaDefaultId é obrigatório' }, { status: 400 });
  }

  let criados = 0;
  let atualizados = 0;
  const erros: string[] = [];

  // Buscar todos os códigos existentes em uma única query
  const codigos = linhas.map((l: any) => l.codigo?.trim()).filter(Boolean);
  const existentes = await prisma.peca.findMany({ where: { codigo: { in: codigos } }, select: { codigo: true } });
  const codigosExistentes = new Set(existentes.map(e => e.codigo));

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    const codigo = l.codigo?.trim();
    const nome = l.nome?.trim();
    if (!codigo || !nome) { erros.push(`Linha ${i + 2}: codigo ou nome vazio`); continue; }

    const data: any = {
      nome,
      codigo,
      precoVenda: parseFloat(l.precoVenda) || 0,
      precoCusto: parseFloat(l.precoCusto) || 0,
      quantidade: parseInt(l.quantidade) || 0,
      estoqueMinimo: parseInt(l.estoqueMinimo) || 5,
      categoriaId: l.categoriaId || categoriaDefaultId,
      vitrine: true,
    };

    try {
      if (codigosExistentes.has(codigo)) {
        await prisma.peca.update({ where: { codigo }, data });
        atualizados++;
      } else {
        await prisma.peca.create({ data: { ...data, descricao: l.descricao || null } });
        criados++;
      }
    } catch (e: any) {
      console.error(`[importar] Erro na linha ${i + 2} (${codigo}):`, e);
      erros.push(`Linha ${i + 2} (${codigo}): erro ao processar`);
    }
  }

  return NextResponse.json({ criados, atualizados, erros: erros.slice(0, 10), totalProcessado: criados + atualizados });
}
