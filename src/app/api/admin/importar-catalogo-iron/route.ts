import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * POST /api/admin/importar-catalogo-iron
 * Importa produtos do Catálogo IRON 2025 em lote.
 *
 * Body: { produtos: Array<{codigo, nome, descricao, compatibilidade, categoriaSistema}> }
 *
 * A rota:
 *  1. Cria/encontra fornecedor MOTOCICLO
 *  2. Cria/mapeia ~56 categorias com slug derivado do nome
 *  3. Carrega TODOS os códigos IRON existentes de uma vez (batch lookup)
 *  4. Insere os novos com createMany em lotes de 100
 *  5. Retorna contagem final
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { produtos } = body;

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      return NextResponse.json(
        { error: 'Campo "produtos" (array não-vazio) é obrigatório' },
        { status: 400 },
      );
    }

    // ─── 1. Fornecedor ──────────────────────────────────────────
    let fornecedor = await prisma.fornecedor.findFirst({ where: { nome: 'MOTOCICLO' } });
    if (!fornecedor) {
      fornecedor = await prisma.fornecedor.create({
        data: {
          nome: 'MOTOCICLO',
          nomeFantasia: 'MOTOCICLO Distribuidora',
          cnpj: '--',
          telefone: '(79) 99999-9999',
          formaPagamento: 'BOLETO',
        },
      });
    }

    // ─── 2. Categorias ──────────────────────────────────────────
    const categoriasNomes = [
      'Motor', 'Motor/Válvulas', 'Motor/Cilindro', 'Motor/Pistão', 'Motor/Suspensão', 'Motor/Fixação',
      'Cabos', 'Cabos de Acelerador', 'Cabos de Embreagem', 'Cabos de Freio', 'Cabos de Velocímetro/Tacômetro', 'Cabos de Trava',
      'Transmissão', 'Transmissão/Motor', 'Marcha/Câmbio', 'Embreagem', 'Embreagem/Partida', 'Correias',
      'Freios', 'Suspensão', 'Kit Suspensão',
      'Elétrica', 'Elétrica/Partida', 'Elétrica/Sensores', 'Elétrica/Painel', 'Elétrica/Estator', 'Elétrica/Bobina', 'Elétrica/CDI', 'Elétrica/Central', 'Elétrica/Retificador', 'Elétrica/Fiação', 'Elétrica/Chaves', 'Elétrica/Interruptores',
      'Ignição', 'Ignição/Velas', 'Ignição/Travas',
      'Combustível', 'Combustível/Bomba', 'Admissão', 'Carburador', 'Carburador/Reparos',
      'Carenagem', 'Carenagem/Motor', 'Chassi', 'Chassi/Guidão', 'Chassi/Suportes', 'Banco/Proteção', 'Guidão/Comandos',
      'Rodas e Pneus', 'Raios', 'Parafusos e Porcas', 'Rolamentos', 'Eixos', 'Caixa de Direção',
      'Juntas e Guarnições', 'Filtros', 'Manetes/Manicotos', 'Pedais', 'Iluminação', 'Borrachas/Buchas', 'Retentores', 'Retentores/Proteção', 'Anéis/Motor', 'Partida', 'Geral',
    ];

    const slugify = (s: string) =>
      s.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');

    const nomesToId = new Map<string, string>();

    // Busca todas que já existem de uma vez
    const slugs = categoriasNomes.map(slugify);
    const existentes = await prisma.categoria.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true, nome: true },
    });

    const slugMap = new Map(existentes.map((c) => [c.slug, c.id]));
    // Como slug é único, mapeamos também nome → id
    for (const c of existentes) {
      nomesToId.set(c.nome, c.id);
    }

    // Cria as que ainda não existem
    const toCreate: { nome: string; slug: string; ativa: boolean; mostrarNaVitrine: boolean; permiteCadastro: boolean }[] = [];
    for (const nome of categoriasNomes) {
      if (!nomesToId.has(nome)) {
        const slug = slugify(nome);
        toCreate.push({ nome, slug, ativa: true, mostrarNaVitrine: true, permiteCadastro: true });
      }
    }

    if (toCreate.length > 0) {
      // createMany não retorna os IDs, então fazemos em sequência ou usamos create
      for (const c of toCreate) {
        const cat = await prisma.categoria.create({ data: c });
        nomesToId.set(c.nome, cat.id);
      }
    }

    // Garantir fallback "Geral"
    if (!nomesToId.has('Geral')) {
      const geral = await prisma.categoria.upsert({
        where: { slug: 'geral' },
        create: { nome: 'Geral', slug: 'geral', ativa: true, mostrarNaVitrine: true, permiteCadastro: true },
        update: {},
      });
      nomesToId.set('Geral', geral.id);
    }

    // ─── 3. Batch lookup de códigos existentes ──────────────────
    const todosCodigos = produtos.map((p: any) => p.codigo);
    const existentesCodigos = await prisma.peca.findMany({
      where: { codigo: { in: todosCodigos } },
      select: { codigo: true },
    });
    const codigosExistentes = new Set(existentesCodigos.map((p) => p.codigo));

    // ─── 4. Importar em lotes ───────────────────────────────────
    const BATCH = 100;
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Filtra apenas novos
    const novos = produtos.filter((p: any) => !codigosExistentes.has(p.codigo));
    skipped = produtos.length - novos.length;

    for (let i = 0; i < novos.length; i += BATCH) {
      const batch = novos.slice(i, i + BATCH);
      const items = batch.map((p: any) => ({
        nome: p.nome,
        descricao: p.descricao,
        codigo: p.codigo,
        compatibilidade: p.compatibilidade,
        marca: 'IRON',
        subcategoria: p.categoriaSistema,
        categoriaId: nomesToId.get(p.categoriaSistema) || nomesToId.get('Geral')!,
        precoVenda: new Prisma.Decimal(0),
        precoCusto: new Prisma.Decimal(0),
        custoMedio: new Prisma.Decimal(0),
        quantidade: 0,
        quantidadeLoja: 0,
        estoqueMinimo: 5,
        ativo: true,
      }));

      try {
        await prisma.peca.createMany({ data: items });
        imported += items.length;
      } catch (err: any) {
        // Se falhar o lote, tenta um a um
        for (const item of items) {
          try {
            await prisma.peca.create({ data: item });
            imported++;
          } catch (e: any) {
            errors.push(`${item.codigo}: ${e.message}`);
          }
        }
      }
    }

    const totalNoBanco = await prisma.peca.count({ where: { marca: 'IRON' } });

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      totalProdutosArquivo: produtos.length,
      totalIRONnoBanco: totalNoBanco,
      fornecedorId: fornecedor.id,
      errors: errors.slice(0, 20),
    });
  } catch (error: any) {
    console.error('[importar-catalogo-iron]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
