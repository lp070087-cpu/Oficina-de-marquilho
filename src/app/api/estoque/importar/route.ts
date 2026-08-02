// POST /api/estoque/importar — Entrada Inteligente (VERSÃO 2026 — LOTES)
// Processa produtos em lotes com progresso, log persistente e idempotência
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const TAMANHO_LOTE = 250;

export async function POST(req: NextRequest) {
  try {
    // ─── Autenticação ───
    const session = await getSession();
    if (!session || !['DONO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const {
      produtos,
      strategy = 'skip',
      arquivo,
      formato,
      lote = 0,         // qual lote está sendo enviado (0-based)
      totalLotes,       // quantos lotes no total
      logId,            // ID do log para atualizar (criado no primeiro lote)
    } = body;

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      return NextResponse.json({ error: 'Array "produtos" é obrigatório' }, { status: 400 });
    }

    // ─── Categorias ───
    const cats = await prisma.categoria.findMany({
      where: { ativa: true },
      select: { id: true, nome: true, slug: true, parentId: true },
    });

    const categoriaMap = new Map<string, string>();
    for (const c of cats) {
      categoriaMap.set(c.nome.toLowerCase(), c.id);
      categoriaMap.set(c.slug, c.id);
    }

    const fallbackCatId = cats.find(c => !c.parentId)?.id || cats[0]?.id || '';

    // ─── Busca duplicatas (2 queries, NÃO N queries) ───
    const codigos = produtos.map((p: any) => p.codigo?.trim()).filter(Boolean) as string[];
    const codigosBarras = produtos.map((p: any) => p.codigoBarras?.trim()).filter(Boolean) as string[];

    const [existentesCod, existentesBarras] = await Promise.all([
      codigos.length > 0
        ? prisma.peca.findMany({
            where: { codigo: { in: codigos } },
            select: { id: true, codigo: true, codigoBarras: true, nome: true, quantidade: true, quantidadeLoja: true },
          })
        : Promise.resolve([]),
      codigosBarras.length > 0
        ? prisma.peca.findMany({
            where: { codigoBarras: { in: codigosBarras } },
            select: { id: true, codigo: true, codigoBarras: true, nome: true, quantidade: true, quantidadeLoja: true },
          })
        : Promise.resolve([]),
    ]);

    const mapCodigo = new Map(existentesCod.map(p => [p.codigo, p] as const));
    const mapBarras = new Map(existentesBarras.map(p => [p.codigoBarras!, p] as const));

    // ─── Processa produtos ───
    let criados = 0;
    let atualizados = 0;
    let ignorados = 0;
    let duplicados = 0;
    const errosLinha: string[] = [];

    for (let i = 0; i < produtos.length; i++) {
      const p = produtos[i];
      const codigo = p.codigo?.trim();
      const codigoBarras = p.codigoBarras?.trim();
      const nome = p.nome?.trim();

      if (!nome && !codigo) {
        errosLinha.push(`Linha ${i + 1}: sem nome ou código`);
        continue;
      }

      // Verifica duplicidade (código primeiro, depois código de barras)
      let existente = codigo ? mapCodigo.get(codigo) : undefined;
      if (!existente && codigoBarras) existente = mapBarras.get(codigoBarras);

      // Resolve categoria
      let categoriaId = p.categoriaId;
      if (!categoriaId && p.categoria) {
        categoriaId = categoriaMap.get(p.categoria.toLowerCase());
      }
      if (!categoriaId) categoriaId = fallbackCatId;

      try {
        if (existente) {
          if (strategy === 'skip') {
            duplicados++;
            continue;
          }
          if (strategy === 'update') {
            const qtdAdd = parseInt(p.quantidade) || 0;
            const qtdLojaAdd = parseInt(p.quantidadeLoja) || 0;
            await prisma.peca.update({
              where: { id: existente.id },
              data: {
                quantidade: existente.quantidade + qtdAdd,
                quantidadeLoja: (existente.quantidadeLoja || 0) + qtdLojaAdd,
                ...(p.precoCusto ? { precoCusto: new Prisma.Decimal(p.precoCusto) } : {}),
                ...(p.precoVenda ? { precoVenda: new Prisma.Decimal(p.precoVenda) } : {}),
                // Atualiza metadados se vierem preenchidos
                ...(p.marca ? { marca: p.marca } : {}),
                ...(p.compatibilidade ? { compatibilidade: p.compatibilidade } : {}),
                ...(p.descricao ? { descricao: p.descricao } : {}),
              },
            });
            atualizados++;
            continue;
          }
          // strategy === 'create': gera código único novo para evitar violação @unique
          if (strategy === 'create') {
            let suffix = 2;
            let novoCodigo = `${codigo}-${suffix}`;
            while (mapCodigo.has(novoCodigo)) {
              suffix++;
              novoCodigo = `${codigo}-${suffix}`;
            }
            await prisma.peca.create({
              data: {
                nome: nome || codigo || 'Sem nome',
                codigo: novoCodigo,
                codigoBarras: codigoBarras ? `${codigoBarras}-${suffix}` : null,
                descricao: p.descricao || null,
                marca: p.marca || null,
                compatibilidade: p.compatibilidade || null,
                subcategoria: p.subcategoria || p.categoria || null,
                categoriaId,
                localizacao: p.localizacao || null,
                precoVenda: new Prisma.Decimal(p.precoVenda || 0),
                precoCusto: new Prisma.Decimal(p.precoCusto || 0),
                custoMedio: new Prisma.Decimal(p.precoCusto || 0),
                quantidade: parseInt(p.quantidade) || 0,
                quantidadeLoja: parseInt(p.quantidadeLoja) || 0,
                estoqueMinimo: parseInt(p.estoqueMinimo) || 5,
                ativo: true,
              },
            });
            // Registra no mapa para evitar duplicação dentro do mesmo lote
            mapCodigo.set(novoCodigo, { id: '', codigo: novoCodigo } as any);
            criados++;
            continue;
          }
        }

        // Cria nova peça (sem duplicata — primeiro lote ou produto único)
        const codigoFinal = codigo || `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        // Verificação extra de idempotência: se o código já foi criado neste lote
        if (mapCodigo.has(codigoFinal)) {
          // Já foi criado neste mesmo batch — atualiza em vez de duplicar
          const pecaExistente = mapCodigo.get(codigoFinal)!;
          const qtdAdd = parseInt(p.quantidade) || 0;
          if (pecaExistente.id) {
            await prisma.peca.update({
              where: { id: pecaExistente.id },
              data: { quantidade: { increment: qtdAdd } },
            });
            atualizados++;
          } else {
            duplicados++;
          }
          continue;
        }

        await prisma.peca.create({
          data: {
            nome: nome || codigo || 'Sem nome',
            codigo: codigoFinal,
            codigoBarras: codigoBarras || null,
            descricao: p.descricao || null,
            marca: p.marca || null,
            compatibilidade: p.compatibilidade || null,
            subcategoria: p.subcategoria || p.categoria || null,
            categoriaId,
            localizacao: p.localizacao || null,
            precoVenda: new Prisma.Decimal(p.precoVenda || 0),
            precoCusto: new Prisma.Decimal(p.precoCusto || 0),
            custoMedio: new Prisma.Decimal(p.precoCusto || 0),
            quantidade: parseInt(p.quantidade) || 0,
            quantidadeLoja: parseInt(p.quantidadeLoja) || 0,
            estoqueMinimo: parseInt(p.estoqueMinimo) || 5,
            ativo: true,
          },
        });
        mapCodigo.set(codigoFinal, { id: '', codigo: codigoFinal } as any);
        criados++;
      } catch (err: any) {
        errosLinha.push(`Linha ${i + 1} (${codigo || nome}): ${err.message}`);
      }
    }

    // ─── Log de importação ───
    const ehPrimeiroLote = lote === 0;
    const ehUltimoLote = totalLotes ? lote + 1 >= totalLotes : true;

    if (ehPrimeiroLote) {
      // Cria o registro de log
      const novoLog = await prisma.logImportacao.create({
        data: {
          usuarioId: session.id,
          tipo: (formato || 'manual').toUpperCase(),
          arquivo: arquivo || null,
          formato: formato || null,
          strategy,
          totalEncontrado: totalLotes ? produtos.length * totalLotes : produtos.length,
          totalSelecionado: produtos.length,
          totalCriado: criados,
          totalAtualizado: atualizados,
          totalIgnorado: ignorados,
          totalDuplicado: duplicados,
          totalErro: errosLinha.length,
          status: ehUltimoLote ? (errosLinha.length > 0 ? 'PARCIAL' : 'CONCLUIDO') : 'PROCESSANDO',
          lotes: totalLotes || 1,
          lotesSucesso: 1,
          lotesFalha: 0,
          inicio: new Date(),
          conclusao: ehUltimoLote ? new Date() : null,
          duracao: 0,
          errosDetalhe: errosLinha.length > 0 ? JSON.stringify(errosLinha.slice(0, 20)) : null,
        },
      });

      return NextResponse.json({
        success: true,
        criados,
        atualizados,
        duplicados,
        ignorados,
        erros: errosLinha.length,
        errosDetalhe: errosLinha.slice(0, 20),
        totalProcessado: criados + atualizados,
        logId: novoLog.id,
        lote,
        continuar: !ehUltimoLote,
      });
    }

    // Lotes subsequentes: atualiza o log existente
    if (logId) {
      const logExistente = await prisma.logImportacao.findUnique({ where: { id: logId } });
      if (logExistente) {
        const statusFinal = ehUltimoLote
          ? (errosLinha.length > 0 || logExistente.totalErro > 0 ? 'PARCIAL' : 'CONCLUIDO')
          : 'PROCESSANDO';

        await prisma.logImportacao.update({
          where: { id: logId },
          data: {
            totalCriado: logExistente.totalCriado + criados,
            totalAtualizado: logExistente.totalAtualizado + atualizados,
            totalIgnorado: logExistente.totalIgnorado + ignorados,
            totalDuplicado: logExistente.totalDuplicado + duplicados,
            totalErro: logExistente.totalErro + errosLinha.length,
            status: statusFinal,
            lotesSucesso: logExistente.lotesSucesso + 1,
            lotesFalha: errosLinha.length > 0 ? logExistente.lotesFalha + 1 : logExistente.lotesFalha,
            conclusao: ehUltimoLote ? new Date() : null,
            duracao: ehUltimoLote ? Date.now() - new Date(logExistente.inicio).getTime() : null,
            errosDetalhe: errosLinha.length > 0
              ? JSON.stringify(errosLinha.slice(0, 20))
              : logExistente.errosDetalhe,
          },
        });

        return NextResponse.json({
          success: true,
          criados,
          atualizados,
          duplicados,
          ignorados,
          erros: errosLinha.length,
          errosDetalhe: errosLinha.slice(0, 20),
          totalProcessado: criados + atualizados,
          logId,
          lote,
          continuar: !ehUltimoLote,
          // Acumulados
          acumulado: {
            criados: logExistente.totalCriado + criados,
            atualizados: logExistente.totalAtualizado + atualizados,
            duplicados: logExistente.totalDuplicado + duplicados,
            ignorados: logExistente.totalIgnorado + ignorados,
            erros: logExistente.totalErro + errosLinha.length,
          },
        });
      }
    }

    // Fallback: sem logId (não deveria acontecer em lotes > 0)
    return NextResponse.json({
      success: true,
      criados,
      atualizados,
      duplicados,
      ignorados,
      erros: errosLinha.length,
      errosDetalhe: errosLinha.slice(0, 20),
      totalProcessado: criados + atualizados,
      continuar: false,
    });
  } catch (error: any) {
    console.error('[importar] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
