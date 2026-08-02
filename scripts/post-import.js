/**
 * POST import script — envia catálogo IRON para API local.
 *
 * Uso (no Windows, com o dev server rodando):
 *   node scripts/post-import.js
 *
 * O script lê catalogo-iron-final.json e faz POST para
 * http://localhost:3000/api/admin/importar-catalogo-iron
 *
 * Requer: Next.js dev server rodando (npm run dev)
 *          Node.js 18+ (fetch nativo)
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3000/api/admin/importar-catalogo-iron';
const BATCH_SIZE = 500; // envia 500 por vez para não estourar payload

async function main() {
  const jsonPath = path.join(__dirname, 'catalogo-iron-final.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON não encontrado: ${jsonPath}`);
    console.log('   Execute primeiro: python3 scripts/parse-catalogo-iron.py');
    process.exit(1);
  }

  const produtos = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📦 ${produtos.length} produtos carregados\n`);

  // Verifica se servidor está no ar
  try {
    const health = await fetch('http://localhost:3000');
    if (!health.ok) throw new Error(`Status ${health.status}`);
    console.log('✅ Servidor Next.js respondendo em http://localhost:3000\n');
  } catch {
    console.error('❌ Servidor Next.js não está rodando em http://localhost:3000');
    console.log('   Inicie com: npm run dev\n   Depois execute este script novamente.');
    process.exit(1);
  }

  // Envia em lotes
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
    const batch = produtos.slice(i, i + BATCH_SIZE);
    const progress = Math.round(((i + batch.length) / produtos.length) * 100);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtos: batch }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`  ❌ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${data.error}`);
        totalErrors += batch.length;
        continue;
      }

      totalImported += data.imported || 0;
      totalSkipped += data.skipped || 0;

      process.stdout.write(
        `\r  Progresso: ${progress}% | Importados: ${totalImported} | Pulados: ${totalSkipped}`,
      );
    } catch (err) {
      console.error(`\n  ❌ Erro de rede no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
      totalErrors += batch.length;
    }
  }

  console.log('\n');
  console.log('='.repeat(55));
  console.log('  IMPORTAÇÃO CONCLUÍDA');
  console.log('='.repeat(55));
  console.log(`  Total no JSON:   ${produtos.length}`);
  console.log(`  Importados:      ${totalImported}`);
  console.log(`  Já existiam:     ${totalSkipped}`);
  console.log(`  Erros:           ${totalErrors}`);
  console.log('='.repeat(55));
  console.log('\n✅ Pronto! Verifique no painel DONA → Estoque.');
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
