import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: 3 importações por IP a cada 60s (operações pesadas)
  const rl = checkRateLimit(req, { key: 'importar', maxRequests: 3, windowMs: 60_000 });
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Muitas importações. Aguarde antes de tentar novamente.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  const session = await getSession();
  if (!session || session.role !== 'DONO') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }
  try {
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
