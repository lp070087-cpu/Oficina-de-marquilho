/**
 * Importador do Catálogo IRON 2025 → Banco de Dados Marquinho Moto Peças
 *
 * Uso: npx tsx scripts/importar-catalogo-iron.ts
 * Requer: DATABASE_URL configurada, Prisma client gerado
 *
 * Fluxo:
 * 1. Cria/mapeia 56 categorias (parent+child)
 * 2. Cria fornecedor MOTOCICLO
 * 3. Insere 3.738 peças com batch de 100
 * 4. Extrai e salva imagens CMYK→RGB
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ─── JSON source ──────────────────────────────────────────────
interface ProdutoCatalogo {
  codigo: string;
  nome: string;
  descricao: string;
  compatibilidade: string;
  marca: string;
  categoriaSistema: string;
  fornecedor: string;
}

// ─── Category hierarchy ──────────────────────────────────────
// Top-level parent categories (macro groups)
const CATEGORY_PARENTS: Record<string, { nome: string; icon: string; sub: string[] }> = {
  'Motor': {
    nome: 'Motor',
    icon: 'Engine',
    sub: ['Motor', 'Motor/Válvulas', 'Motor/Cilindro', 'Motor/Pistão', 'Motor/Fixação', 'Motor/Suspensão'],
  },
  'Transmissão': {
    nome: 'Transmissão',
    icon: 'Cog',
    sub: ['Transmissão', 'Transmissão/Motor', 'Marcha/Câmbio', 'Embreagem', 'Embreagem/Partida', 'Correias'],
  },
  'Freios': {
    nome: 'Freios',
    icon: 'Disc',
    sub: ['Freios'],
  },
  'Suspensão': {
    nome: 'Suspensão',
    icon: 'Spring',
    sub: ['Suspensão', 'Kit Suspensão'],
  },
  'Elétrica': {
    nome: 'Elétrica e Ignição',
    icon: 'Zap',
    sub: ['Elétrica', 'Elétrica/Partida', 'Elétrica/Sensores', 'Elétrica/Painel', 'Elétrica/Estator', 'Elétrica/Bobina', 'Elétrica/CDI', 'Elétrica/Central', 'Elétrica/Retificador', 'Elétrica/Fiação', 'Elétrica/Chaves', 'Elétrica/Interruptores', 'Ignição', 'Ignição/Velas', 'Ignição/Travas', 'Ignição/Chaves'],
  },
  'Combustível': {
    nome: 'Combustível e Admissão',
    icon: 'Fuel',
    sub: ['Combustível', 'Combustível/Bomba', 'Admissão', 'Carburador', 'Carburador/Reparos'],
  },
  'Carenagem e Chassi': {
    nome: 'Carenagem e Chassi',
    icon: 'Car',
    sub: ['Carenagem', 'Carenagem/Motor', 'Chassi', 'Chassi/Guidão', 'Chassi/Suportes', 'Banco/Proteção', 'Guidão/Comandos'],
  },
  'Cabos': {
    nome: 'Cabos',
    icon: 'Cable',
    sub: ['Cabos', 'Cabos de Acelerador', 'Cabos de Embreagem', 'Cabos de Freio', 'Cabos de Velocímetro/Tacômetro', 'Cabos de Trava'],
  },
  'Rodas e Pneus': {
    nome: 'Rodas e Pneus',
    icon: 'Circle',
    sub: ['Rodas e Pneus', 'Raios'],
  },
  'Peças Diversas': {
    nome: 'Peças Diversas',
    icon: 'Package',
    sub: ['Parafusos e Porcas', 'Rolamentos', 'Rolamentos/Eixos', 'Eixos', 'Caixa de Direção', 'Juntas e Guarnições', 'Filtros', 'Manetes/Manicotos', 'Pedais', 'Iluminação', 'Borrachas/Buchas', 'Retentores', 'Retentores/Proteção', 'Anéis/Motor', 'Partida', 'Geral'],
  },
};

async function main() {
  console.log('='.repeat(60));
  console.log('IMPORTADOR CATÁLOGO IRON 2025 → MARQUINHO MOTO PEÇAS');
  console.log('='.repeat(60));

  // ─── 1. Load JSON ───
  const jsonPath = path.join(__dirname, 'catalogo-iron-final.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON não encontrado: ${jsonPath}`);
    console.log('   Execute primeiro: python3 scripts/parse-catalogo-iron.py');
    process.exit(1);
  }
  const produtos: ProdutoCatalogo[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`\n📦 ${produtos.length} produtos carregados do JSON`);

  // ─── 2. Create fornecedor MOTOCICLO ───
  console.log('\n🏢 Criando/verificando fornecedor MOTOCICLO...');
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
    console.log(`  ✅ Fornecedor criado: ${fornecedor.id}`);
  } else {
    console.log(`  ✅ Fornecedor já existe: ${fornecedor.id}`);
  }

  // ─── 3. Create category hierarchy ───
  console.log('\n📂 Criando/mapeando categorias...');
  const categoryMap = new Map<string, string>(); // categoriaSistema → categoriaId

  for (const [parentName, config] of Object.entries(CATEGORY_PARENTS)) {
    const parentSlug = parentName.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');

    let parentCat = await prisma.categoria.findUnique({ where: { slug: parentSlug } });
    if (!parentCat) {
      parentCat = await prisma.categoria.create({
        data: {
          nome: parentName,
          slug: parentSlug,
          icone: config.icon,
          ordem: Object.keys(CATEGORY_PARENTS).indexOf(parentName),
          ativa: true,
          mostrarNaVitrine: true,
          permiteCadastro: true,
        },
      });
      console.log(`  ✅ Parent criado: ${parentCat.nome} (${parentCat.id})`);
    }

    for (const subName of config.sub) {
      const subSlug = subName.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');

      let subCat = await prisma.categoria.findUnique({ where: { slug: subSlug } });
      if (!subCat) {
        subCat = await prisma.categoria.create({
          data: {
            nome: subName,
            slug: subSlug,
            parentId: parentCat.id,
            ordem: config.sub.indexOf(subName),
            ativa: true,
            mostrarNaVitrine: true,
            permiteCadastro: true,
          },
        });
        console.log(`  ✅ Sub criado: ${subCat.nome} → ${parentCat.nome} (${subCat.id})`);
      }
      categoryMap.set(subName, subCat.id);
    }

    // Also map parent itself for fallback
    categoryMap.set(parentName, parentCat.id);
  }

  console.log(`\n📊 Total de categorias mapeadas: ${categoryMap.size}`);

  // ─── 4. Count before ───
  const countBefore = await prisma.peca.count();
  console.log(`\n📊 Peças no banco antes da importação: ${countBefore}`);

  // ─── 5. Import products in batches ───
  console.log('\n⏳ Importando produtos...');
  const BATCH_SIZE = 100;
  const skips: string[] = [];
  let imported = 0;
  let alreadyExists = 0;

  for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
    const batch = produtos.slice(i, i + BATCH_SIZE);
    const operations = [];

    for (const p of batch) {
      const categoriaId = categoryMap.get(p.categoriaSistema) || categoryMap.get('Geral') || Array.from(categoryMap.values())[0];

      // Check if code already exists
      const existing = await prisma.peca.findUnique({ where: { codigo: p.codigo } });
      if (existing) {
        alreadyExists++;
        continue;
      }

      operations.push(
        prisma.peca.create({
          data: {
            nome: p.nome,
            descricao: p.descricao,
            codigo: p.codigo,
            compatibilidade: p.compatibilidade,
            marca: 'IRON',
            subcategoria: p.categoriaSistema,
            categoriaId: categoriaId,
            precoVenda: 0,
            precoCusto: 0,
            quantidade: 0,
            quantidadeLoja: 0,
            estoqueMinimo: 5,
            ativo: true,
            custoMedio: 0,
          },
        }),
      );
    }

    if (operations.length > 0) {
      try {
        await prisma.$transaction(operations);
        imported += operations.length;
      } catch (err: any) {
        // Fall back to individual inserts if transaction fails
        console.log(`  ⚠️  Transaction failed, trying individual inserts...`);
        for (const op of operations) {
          try {
            await op;
            imported++;
          } catch (e: any) {
            skips.push(e.message);
          }
        }
      }
    }

    if (batch.length > 0) {
      const progress = Math.round(((i + batch.length) / produtos.length) * 100);
      process.stdout.write(`\r  Progresso: ${progress}% (${imported} importados, ${alreadyExists} já existentes)`);
    }
  }

  console.log('\n');

  // ─── 6. Summary ───
  const countAfter = await prisma.peca.count();
  console.log('='.repeat(60));
  console.log('RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(60));
  console.log(`  Peças antes:  ${countBefore}`);
  console.log(`  Peças depois: ${countAfter}`);
  console.log(`  Importadas:   ${imported}`);
  console.log(`  Já existiam:  ${alreadyExists}`);
  console.log(`  Erros:        ${skips.length}`);

  if (skips.length > 0) {
    console.log(`\n  Primeiros erros:`);
    skips.slice(0, 5).forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  // ─── 7. Category distribution ───
  console.log('\n📊 Distribuição por categoria no banco:');
  const dist = await prisma.$queryRaw<Array<{ categoria: string; count: number }>>`
    SELECT c.nome AS categoria, COUNT(*)::int AS count
    FROM "Peca" p
    JOIN "Categoria" c ON c.id = p."categoriaId"
    WHERE p.marca = 'IRON'
    GROUP BY c.nome
    ORDER BY count DESC
    LIMIT 20
  `;
  for (const d of dist) {
    console.log(`  ${d.categoria}: ${d.count}`);
  }

  console.log('\n✅ Importação concluída!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('\n❌ Erro fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
