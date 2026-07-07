import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...\n');

  const passwordHash = await bcrypt.hash('marquinho123', 10);

  await prisma.user.upsert({ where: { email: 'lp070087@gmail.com' }, update: {}, create: { name: 'Dono', email: 'lp070087@gmail.com', password: passwordHash, role: 'DONO' } });
  console.log('Dono: lp070087@gmail.com / marquinho123');

  for (const b of [{ name: 'Balcao 1', email: 'balcao1@marquinho.com.br' }, { name: 'Balcao 2', email: 'balcao2@marquinho.com.br' }, { name: 'Balcao 3', email: 'balcao3@marquinho.com.br' }]) {
    await prisma.user.upsert({ where: { email: b.email }, update: {}, create: { name: b.name, email: b.email, password: passwordHash, role: 'BALCAO' } });
  }
  console.log('3 Balcoes criados.');

  const mp = await bcrypt.hash('mecanico123', 10);
  await prisma.user.upsert({ where: { email: 'mecanico@marquinho.com.br' }, update: {}, create: { name: 'Mecanico Exemplo', email: 'mecanico@marquinho.com.br', password: mp, role: 'MECANICO' } });
  console.log('Mecanico: mecanico@marquinho.com.br / mecanico123');

  const es = await bcrypt.hash('estoque123', 10);
  await prisma.user.upsert({ where: { email: 'estoque@marquinho.com.br' }, update: {}, create: { name: 'Estoque', email: 'estoque@marquinho.com.br', password: es, role: 'ESTOQUE' } });
  console.log('Estoque: estoque@marquinho.com.br / estoque123');

  // Categorias
  const categorias = [
    { nome: 'Motor', slug: 'motor' },
    { nome: 'Freios', slug: 'freios' },
    { nome: 'Eletrica', slug: 'eletrica' },
    { nome: 'Suspensao', slug: 'suspensao' },
    { nome: 'Transmissao', slug: 'transmissao' },
    { nome: 'Carroceria', slug: 'carroceria' },
    { nome: 'Rodas e Pneus', slug: 'rodas-e-pneus' },
    { nome: 'Oleos e Fluidos', slug: 'oleos-e-fluidos' },
    { nome: 'Escapamento', slug: 'escapamento' },
    { nome: 'Acessorios', slug: 'acessorios' },
    { nome: 'Filtros', slug: 'filtros' },
    { nome: 'Cabos e Comandos', slug: 'cabos-e-comandos' },
  ];
  for (const c of categorias) await prisma.categoria.upsert({ where: { slug: c.slug }, update: {}, create: c });
  console.log(`${categorias.length} categorias criadas.`);

  const cats = await prisma.categoria.findMany();
  const cm: Record<string, string> = {};
  cats.forEach(c => { cm[c.slug] = c.id; });

  // Peças - ~245 itens com compatibilidade realista
  type P = { n: string; sku: string; sub: string; pv: number; pc: number; q: number; min: number; marca: string; comp: string; cat: string };
  const pecas: P[] = [
    // ===== MOTOR (35 peças) =====
    { n: 'Pistao 52mm CG 160', sku: 'MT-001', sub: 'Pistao', pv: 85.00, pc: 52.00, q: 8, min: 3, marca: 'ProTork', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Pistao 53.5mm Bros 160', sku: 'MT-002', sub: 'Pistao', pv: 95.00, pc: 60.00, q: 5, min: 2, marca: 'ProTork', comp: 'Bros 160', cat: 'motor' },
    { n: 'Pistao 56.5mm Fazer 250', sku: 'MT-003', sub: 'Pistao', pv: 110.00, pc: 72.00, q: 3, min: 1, marca: 'Mahle', comp: 'Fazer 250', cat: 'motor' },
    { n: 'Pistao 58mm XRE 300', sku: 'MT-004', sub: 'Pistao', pv: 135.00, pc: 88.00, q: 2, min: 1, marca: 'Mahle', comp: 'XRE 300, CB 300F', cat: 'motor' },
    { n: 'Pistao 50mm PCX 150', sku: 'MT-005', sub: 'Pistao', pv: 72.00, pc: 42.00, q: 6, min: 2, marca: 'ProTork', comp: 'PCX 150', cat: 'motor' },
    { n: 'Anel Segmento 52mm CG', sku: 'MT-006', sub: 'Anel de segmento', pv: 25.00, pc: 14.00, q: 15, min: 5, marca: 'Riken', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Anel Segmento 53.5mm Bros', sku: 'MT-007', sub: 'Anel de segmento', pv: 28.00, pc: 16.00, q: 12, min: 4, marca: 'Riken', comp: 'Bros 160', cat: 'motor' },
    { n: 'Anel Segmento 56.5mm Fazer', sku: 'MT-008', sub: 'Anel de segmento', pv: 32.00, pc: 19.00, q: 8, min: 3, marca: 'Riken', comp: 'Fazer 250', cat: 'motor' },
    { n: 'Anel Segmento 58mm 300cc', sku: 'MT-009', sub: 'Anel de segmento', pv: 38.00, pc: 22.00, q: 6, min: 2, marca: 'Riken', comp: 'XRE 300, CB 300F', cat: 'motor' },
    { n: 'Junta Cabecote CG 160', sku: 'MT-010', sub: 'Junta do cabecote', pv: 18.00, pc: 9.50, q: 0, min: 3, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Junta Cabecote Bros 160', sku: 'MT-011', sub: 'Junta do cabecote', pv: 22.00, pc: 12.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Bros 160', cat: 'motor' },
    { n: 'Junta Cabecote Fazer', sku: 'MT-012', sub: 'Junta do cabecote', pv: 25.00, pc: 14.00, q: 5, min: 2, marca: 'Vedamotors', comp: 'Fazer 250, Factor 150', cat: 'motor' },
    { n: 'Junta Cabecote XRE 300', sku: 'MT-013', sub: 'Junta do cabecote', pv: 30.00, pc: 18.00, q: 4, min: 2, marca: 'Vedamotors', comp: 'XRE 300, CB 300F', cat: 'motor' },
    { n: 'Corrente Comando CG 160', sku: 'MT-014', sub: 'Corrente de comando', pv: 45.00, pc: 28.00, q: 12, min: 3, marca: 'KMC', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Corrente Comando Bros 160', sku: 'MT-015', sub: 'Corrente de comando', pv: 52.00, pc: 32.00, q: 10, min: 3, marca: 'KMC', comp: 'Bros 160', cat: 'motor' },
    { n: 'Valvula Admissao CG 160', sku: 'MT-016', sub: 'Valvula', pv: 32.00, pc: 18.00, q: 10, min: 4, marca: 'TRW', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Valvula Escape CG 160', sku: 'MT-017', sub: 'Valvula', pv: 35.00, pc: 20.00, q: 10, min: 4, marca: 'TRW', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Valvula Admissao Bros 160', sku: 'MT-018', sub: 'Valvula', pv: 38.00, pc: 22.00, q: 8, min: 3, marca: 'TRW', comp: 'Bros 160', cat: 'motor' },
    { n: 'Bomba dAgua CG 160', sku: 'MT-019', sub: 'Bomba dAgua', pv: 120.00, pc: 75.00, q: 3, min: 1, marca: 'Honda Genuino', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Bomba dAgua Bros 160', sku: 'MT-020', sub: 'Bomba dAgua', pv: 135.00, pc: 85.00, q: 2, min: 1, marca: 'Honda Genuino', comp: 'Bros 160', cat: 'motor' },
    { n: 'Retentor Valvula CG 160', sku: 'MT-021', sub: 'Retentor', pv: 8.00, pc: 3.50, q: 30, min: 10, marca: 'Sabó', comp: 'CG 160, Titan 160, Bros 160', cat: 'motor' },
    { n: 'Retentor Valvula 300cc', sku: 'MT-022', sub: 'Retentor', pv: 10.00, pc: 5.00, q: 25, min: 8, marca: 'Sabó', comp: 'XRE 300, CB 300F', cat: 'motor' },
    { n: 'Bronzina STD CG 160', sku: 'MT-023', sub: 'Bronzina', pv: 22.00, pc: 12.00, q: 8, min: 3, marca: 'MAHLE', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Bronzina 0.25 CG 160', sku: 'MT-024', sub: 'Bronzina', pv: 25.00, pc: 14.00, q: 6, min: 2, marca: 'MAHLE', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Bronzina STD Bros 160', sku: 'MT-025', sub: 'Bronzina', pv: 28.00, pc: 16.00, q: 5, min: 2, marca: 'MAHLE', comp: 'Bros 160', cat: 'motor' },
    { n: 'Cabecote Completo CG 160', sku: 'MT-026', sub: 'Cabecote', pv: 350.00, pc: 220.00, q: 2, min: 1, marca: 'Honda Genuino', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Cabecote Completo Bros 160', sku: 'MT-027', sub: 'Cabecote', pv: 420.00, pc: 280.00, q: 1, min: 1, marca: 'Honda Genuino', comp: 'Bros 160', cat: 'motor' },
    { n: 'Carburador Bros 160', sku: 'MT-028', sub: 'Carburador', pv: 180.00, pc: 120.00, q: 3, min: 1, marca: 'Keihin', comp: 'Bros 160', cat: 'motor' },
    { n: 'Carburador CG 160', sku: 'MT-029', sub: 'Carburador', pv: 160.00, pc: 105.00, q: 4, min: 1, marca: 'Keihin', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Bico Injetor CG 160', sku: 'MT-030', sub: 'Bico injetor', pv: 210.00, pc: 140.00, q: 2, min: 1, marca: 'Bosch', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Bico Injetor Bros 160', sku: 'MT-031', sub: 'Bico injetor', pv: 230.00, pc: 155.00, q: 2, min: 1, marca: 'Bosch', comp: 'Bros 160', cat: 'motor' },
    { n: 'Cilindro CG 160 Completo', sku: 'MT-032', sub: 'Cilindro', pv: 195.00, pc: 130.00, q: 4, min: 1, marca: 'ProTork', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Cilindro Bros 160 Completo', sku: 'MT-033', sub: 'Cilindro', pv: 230.00, pc: 155.00, q: 3, min: 1, marca: 'ProTork', comp: 'Bros 160', cat: 'motor' },
    { n: 'Guia Corrente Comando CG', sku: 'MT-034', sub: 'Guia de corrente', pv: 28.00, pc: 15.00, q: 10, min: 3, marca: 'WGermany', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Tensionador Comando Bros', sku: 'MT-035', sub: 'Tensionador', pv: 35.00, pc: 20.00, q: 7, min: 3, marca: 'WGermany', comp: 'Bros 160', cat: 'motor' },

    // ===== FREIOS (30 peças) =====
    { n: 'Pastilha Freio Diant. CG 160', sku: 'FR-001', sub: 'Pastilhas', pv: 45.90, pc: 28.50, q: 20, min: 5, marca: 'Potenza', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Pastilha Freio Tras. CG 160', sku: 'FR-002', sub: 'Pastilhas', pv: 42.00, pc: 25.00, q: 18, min: 4, marca: 'Potenza', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Pastilha Freio Diant. Bros 160', sku: 'FR-003', sub: 'Pastilhas', pv: 48.00, pc: 30.00, q: 15, min: 4, marca: 'Potenza', comp: 'Bros 160', cat: 'freios' },
    { n: 'Pastilha Freio Diant. XRE 300', sku: 'FR-004', sub: 'Pastilhas', pv: 55.00, pc: 35.00, q: 8, min: 3, marca: 'Cobreq', comp: 'XRE 300, CB 300F', cat: 'freios' },
    { n: 'Pastilha Freio Diant. Fazer', sku: 'FR-005', sub: 'Pastilhas', pv: 52.00, pc: 33.00, q: 6, min: 2, marca: 'Cobreq', comp: 'Fazer 250', cat: 'freios' },
    { n: 'Pastilha Freio Diant. PCX 150', sku: 'FR-006', sub: 'Pastilhas', pv: 38.00, pc: 22.00, q: 12, min: 4, marca: 'Potenza', comp: 'PCX 150, NMax 160', cat: 'freios' },
    { n: 'Pastilha Freio Diant. Factor', sku: 'FR-007', sub: 'Pastilhas', pv: 46.00, pc: 28.00, q: 14, min: 4, marca: 'Cobreq', comp: 'Factor 150, Fazer 250', cat: 'freios' },
    { n: 'Disco Freio Diant. CG 160', sku: 'FR-008', sub: 'Discos', pv: 130.00, pc: 85.00, q: 4, min: 2, marca: 'Duratec', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Disco Freio Diant. Bros 160', sku: 'FR-009', sub: 'Discos', pv: 145.00, pc: 95.00, q: 3, min: 2, marca: 'Duratec', comp: 'Bros 160', cat: 'freios' },
    { n: 'Disco Freio Diant. XRE 300', sku: 'FR-010', sub: 'Discos', pv: 180.00, pc: 120.00, q: 2, min: 1, marca: 'Duratec', comp: 'XRE 300, CB 300F', cat: 'freios' },
    { n: 'Disco Freio Diant. Fazer 250', sku: 'FR-011', sub: 'Discos', pv: 160.00, pc: 105.00, q: 2, min: 1, marca: 'Duratec', comp: 'Fazer 250', cat: 'freios' },
    { n: 'Disco Freio Diant. NMax 160', sku: 'FR-012', sub: 'Discos', pv: 155.00, pc: 100.00, q: 3, min: 1, marca: 'Duratec', comp: 'NMax 160, PCX 150', cat: 'freios' },
    { n: 'Cabo Freio Diant. CG 160', sku: 'FR-013', sub: 'Cabos de freio', pv: 28.00, pc: 16.00, q: 12, min: 4, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Cabo Freio Tras. CG 160', sku: 'FR-014', sub: 'Cabos de freio', pv: 25.00, pc: 14.00, q: 10, min: 3, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Cabo Freio Diant. Bros 160', sku: 'FR-015', sub: 'Cabos de freio', pv: 30.00, pc: 17.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Bros 160', cat: 'freios' },
    { n: 'Cilindro Mestre Freio CG 160', sku: 'FR-016', sub: 'Cilindros', pv: 85.00, pc: 52.00, q: 4, min: 2, marca: 'Nissin', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Cilindro Mestre Freio Bros', sku: 'FR-017', sub: 'Cilindros', pv: 95.00, pc: 60.00, q: 3, min: 1, marca: 'Nissin', comp: 'Bros 160', cat: 'freios' },
    { n: 'Cilindro Mestre XRE 300', sku: 'FR-018', sub: 'Cilindros', pv: 120.00, pc: 78.00, q: 2, min: 1, marca: 'Nissin', comp: 'XRE 300, CB 300F', cat: 'freios' },
    { n: 'Pinca Freio Diant. CG 160', sku: 'FR-019', sub: 'Pincas', pv: 150.00, pc: 95.00, q: 2, min: 1, marca: 'Nissin', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Pinca Freio Diant. Bros 160', sku: 'FR-020', sub: 'Pincas', pv: 165.00, pc: 105.00, q: 2, min: 1, marca: 'Nissin', comp: 'Bros 160', cat: 'freios' },
    { n: 'Fluido de Freio DOT4 250ml', sku: 'FR-021', sub: 'Fluido de freio', pv: 22.00, pc: 12.50, q: 18, min: 6, marca: 'Varga', comp: 'Universal', cat: 'freios' },
    { n: 'Fluido de Freio DOT4 500ml', sku: 'FR-022', sub: 'Fluido de freio', pv: 35.00, pc: 20.00, q: 14, min: 5, marca: 'Varga', comp: 'Universal', cat: 'freios' },
    { n: 'Fluido de Freio DOT5.1 250ml', sku: 'FR-023', sub: 'Fluido de freio', pv: 28.00, pc: 16.00, q: 10, min: 4, marca: 'Motul', comp: 'Universal', cat: 'freios' },
    { n: 'Lona Freio Tras. CG 160', sku: 'FR-024', sub: 'Lonas', pv: 32.00, pc: 18.00, q: 15, min: 5, marca: 'Fras-le', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Lona Freio Tras. PCX 150', sku: 'FR-025', sub: 'Lonas', pv: 28.00, pc: 15.00, q: 12, min: 4, marca: 'Fras-le', comp: 'PCX 150', cat: 'freios' },
    { n: 'Tubo Freio CG 160 Diant.', sku: 'FR-026', sub: 'Tubos', pv: 42.00, pc: 25.00, q: 6, min: 2, marca: 'Duratec', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Sensor ABS XRE 300 Diant.', sku: 'FR-027', sub: 'Sensores', pv: 280.00, pc: 190.00, q: 1, min: 1, marca: 'Honda Genuino', comp: 'XRE 300', cat: 'freios' },
    { n: 'Pedal Freio CG 160', sku: 'FR-028', sub: 'Pedais', pv: 55.00, pc: 32.00, q: 4, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'freios' },
    { n: 'Manete Freio Universal', sku: 'FR-029', sub: 'Manetes', pv: 22.00, pc: 11.00, q: 16, min: 5, marca: 'Metal Leve', comp: 'Universal', cat: 'freios' },
    { n: 'Reservatorio Fluido Freio', sku: 'FR-030', sub: 'Reservatorios', pv: 35.00, pc: 20.00, q: 6, min: 2, marca: 'Nissin', comp: 'Universal', cat: 'freios' },

    // ===== ELÉTRICA (30 peças) =====
    { n: 'Bateria YB5L-B CG 160', sku: 'EL-001', sub: 'Baterias', pv: 160.00, pc: 105.00, q: 4, min: 2, marca: 'Moura', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Bateria YT7B-BS Bros 160', sku: 'EL-002', sub: 'Baterias', pv: 185.00, pc: 120.00, q: 3, min: 1, marca: 'Moura', comp: 'Bros 160', cat: 'eletrica' },
    { n: 'Bateria YT9B-BS XRE 300', sku: 'EL-003', sub: 'Baterias', pv: 220.00, pc: 148.00, q: 2, min: 1, marca: 'Moura', comp: 'XRE 300, CB 300F', cat: 'eletrica' },
    { n: 'Bateria YTX5L-BS NMax', sku: 'EL-004', sub: 'Baterias', pv: 145.00, pc: 92.00, q: 5, min: 2, marca: 'Heliar', comp: 'NMax 160, PCX 150', cat: 'eletrica' },
    { n: 'Vela NGK D8EA CG 160', sku: 'EL-005', sub: 'Velas', pv: 22.00, pc: 12.00, q: 40, min: 8, marca: 'NGK', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Vela NGK DPR8EA-9 Bros', sku: 'EL-006', sub: 'Velas', pv: 25.00, pc: 14.00, q: 35, min: 8, marca: 'NGK', comp: 'Bros 160', cat: 'eletrica' },
    { n: 'Vela NGK CR8E 300cc', sku: 'EL-007', sub: 'Velas', pv: 28.00, pc: 16.00, q: 20, min: 5, marca: 'NGK', comp: 'XRE 300, CB 300F, Fazer 250', cat: 'eletrica' },
    { n: 'Vela Iridium NGK Universal', sku: 'EL-008', sub: 'Velas', pv: 45.00, pc: 30.00, q: 15, min: 5, marca: 'NGK', comp: 'Universal', cat: 'eletrica' },
    { n: 'Cachimbo Vela CG 160', sku: 'EL-009', sub: 'Cachimbos', pv: 15.00, pc: 7.00, q: 25, min: 8, marca: 'NGK', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Cachimbo Vela Bros 160', sku: 'EL-010', sub: 'Cachimbos', pv: 18.00, pc: 9.00, q: 20, min: 6, marca: 'NGK', comp: 'Bros 160', cat: 'eletrica' },
    { n: 'Estator CG 160 Completo', sku: 'EL-011', sub: 'Estator', pv: 95.00, pc: 60.00, q: 3, min: 1, marca: 'WGermany', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Estator Bros 160 Completo', sku: 'EL-012', sub: 'Estator', pv: 110.00, pc: 72.00, q: 3, min: 1, marca: 'WGermany', comp: 'Bros 160', cat: 'eletrica' },
    { n: 'Estator Titan 160 Injetado', sku: 'EL-013', sub: 'Estator', pv: 135.00, pc: 88.00, q: 0, min: 1, marca: 'WGermany', comp: 'Titan 160', cat: 'eletrica' },
    { n: 'Modulo Ignição CG 160', sku: 'EL-014', sub: 'Modulos', pv: 180.00, pc: 120.00, q: 2, min: 1, marca: 'Mitsubishi', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Modulo Ignição Bros 160', sku: 'EL-015', sub: 'Modulos', pv: 210.00, pc: 140.00, q: 2, min: 1, marca: 'Mitsubishi', comp: 'Bros 160', cat: 'eletrica' },
    { n: 'ECU Titan 160 Injection', sku: 'EL-016', sub: 'ECU', pv: 580.00, pc: 390.00, q: 1, min: 1, marca: 'Honda Genuino', comp: 'Titan 160, CG 160', cat: 'eletrica' },
    { n: 'Bobina Ignição CG 160', sku: 'EL-017', sub: 'Bobinas', pv: 45.00, pc: 28.00, q: 8, min: 3, marca: 'WGermany', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Bobina Ignição Bros 160', sku: 'EL-018', sub: 'Bobinas', pv: 52.00, pc: 32.00, q: 6, min: 2, marca: 'WGermany', comp: 'Bros 160', cat: 'eletrica' },
    { n: 'Regulador Retificador CG 160', sku: 'EL-019', sub: 'Reguladores', pv: 78.00, pc: 48.00, q: 5, min: 2, marca: 'WGermany', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Regulador Retificador Bros', sku: 'EL-020', sub: 'Reguladores', pv: 85.00, pc: 55.00, q: 4, min: 2, marca: 'WGermany', comp: 'Bros 160', cat: 'eletrica' },
    { n: 'Lampada Farol H4 12V', sku: 'EL-021', sub: 'Lampadas', pv: 18.00, pc: 9.00, q: 25, min: 8, marca: 'Philips', comp: 'CG 160, Titan 160, Bros 160', cat: 'eletrica' },
    { n: 'Lampada Farol HS1 12V', sku: 'EL-022', sub: 'Lampadas', pv: 15.00, pc: 7.50, q: 30, min: 10, marca: 'Osram', comp: 'PCX 150, NMax 160', cat: 'eletrica' },
    { n: 'Lampada LED H4 25W', sku: 'EL-023', sub: 'Lampadas', pv: 55.00, pc: 35.00, q: 10, min: 3, marca: 'Philips', comp: 'Universal', cat: 'eletrica' },
    { n: 'Lampada Seta Ambar 12V', sku: 'EL-024', sub: 'Lampadas', pv: 6.00, pc: 2.50, q: 40, min: 15, marca: 'Philips', comp: 'Universal', cat: 'eletrica' },
    { n: 'Lampada Lanterna 12V 5W', sku: 'EL-025', sub: 'Lampadas', pv: 5.00, pc: 2.00, q: 45, min: 15, marca: 'Philips', comp: 'Universal', cat: 'eletrica' },
    { n: 'Chave Setas Completa CG', sku: 'EL-026', sub: 'Interruptores', pv: 65.00, pc: 38.00, q: 4, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Interruptor Partida Universal', sku: 'EL-027', sub: 'Interruptores', pv: 48.00, pc: 28.00, q: 5, min: 2, marca: 'Cofap', comp: 'Universal', cat: 'eletrica' },
    { n: 'Chave Ignição CG 160', sku: 'EL-028', sub: 'Interruptores', pv: 95.00, pc: 60.00, q: 3, min: 1, marca: 'Honda Genuino', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Chicote Eletrico CG 160', sku: 'EL-029', sub: 'Chicotes', pv: 120.00, pc: 75.00, q: 2, min: 1, marca: 'Cobreq', comp: 'CG 160, Titan 160', cat: 'eletrica' },
    { n: 'Motor Partida CG 160', sku: 'EL-030', sub: 'Motor de partida', pv: 195.00, pc: 128.00, q: 2, min: 1, marca: 'Bosch', comp: 'CG 160, Titan 160, Bros 160', cat: 'eletrica' },

    // ===== SUSPENSÃO (20 peças) =====
    { n: 'Amortecedor Tras. CG 160', sku: 'SP-001', sub: 'Amortecedores', pv: 95.00, pc: 60.00, q: 6, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'suspensao' },
    { n: 'Amortecedor Tras. Bros 160', sku: 'SP-002', sub: 'Amortecedores', pv: 120.00, pc: 78.00, q: 4, min: 2, marca: 'Cofap', comp: 'Bros 160', cat: 'suspensao' },
    { n: 'Amortecedor Tras. XRE 300', sku: 'SP-003', sub: 'Amortecedores', pv: 180.00, pc: 120.00, q: 0, min: 1, marca: 'Showa', comp: 'XRE 300', cat: 'suspensao' },
    { n: 'Amortecedor Tras. Fazer 250', sku: 'SP-004', sub: 'Amortecedores', pv: 155.00, pc: 100.00, q: 2, min: 1, marca: 'Showa', comp: 'Fazer 250', cat: 'suspensao' },
    { n: 'Bucha Amortecedor CG 160', sku: 'SP-005', sub: 'Buchas', pv: 12.00, pc: 5.50, q: 20, min: 8, marca: 'Sabó', comp: 'CG 160, Titan 160', cat: 'suspensao' },
    { n: 'Bucha Amortecedor Bros 160', sku: 'SP-006', sub: 'Buchas', pv: 15.00, pc: 7.00, q: 18, min: 6, marca: 'Sabó', comp: 'Bros 160', cat: 'suspensao' },
    { n: 'Retentor Susp. Diant. CG', sku: 'SP-007', sub: 'Retentores', pv: 15.00, pc: 7.00, q: 14, min: 5, marca: 'Sabó', comp: 'CG 160, Titan 160', cat: 'suspensao' },
    { n: 'Retentor Susp. Diant. Bros', sku: 'SP-008', sub: 'Retentores', pv: 18.00, pc: 9.00, q: 12, min: 4, marca: 'Sabó', comp: 'Bros 160', cat: 'suspensao' },
    { n: 'Retentor Susp. Diant. XRE', sku: 'SP-009', sub: 'Retentores', pv: 25.00, pc: 14.00, q: 6, min: 2, marca: 'Sabó', comp: 'XRE 300, CB 300F', cat: 'suspensao' },
    { n: 'Mola Traseira CG 160', sku: 'SP-010', sub: 'Molas', pv: 55.00, pc: 32.00, q: 4, min: 1, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'suspensao' },
    { n: 'Mola Traseira Bros 160', sku: 'SP-011', sub: 'Molas', pv: 65.00, pc: 40.00, q: 3, min: 1, marca: 'Cofap', comp: 'Bros 160', cat: 'suspensao' },
    { n: 'Oleo Suspensao 10W 1L', sku: 'SP-012', sub: 'Oleo suspensao', pv: 35.00, pc: 20.00, q: 10, min: 4, marca: 'Motul', comp: 'Universal', cat: 'suspensao' },
    { n: 'Oleo Suspensao 15W 1L', sku: 'SP-013', sub: 'Oleo suspensao', pv: 38.00, pc: 22.00, q: 8, min: 3, marca: 'Motul', comp: 'Universal', cat: 'suspensao' },
    { n: 'Biela Susp. Diant. CG 160', sku: 'SP-014', sub: 'Bielas', pv: 85.00, pc: 52.00, q: 3, min: 1, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'suspensao' },
    { n: 'Biela Susp. Diant. Bros 160', sku: 'SP-015', sub: 'Bielas', pv: 95.00, pc: 60.00, q: 2, min: 1, marca: 'Cofap', comp: 'Bros 160', cat: 'suspensao' },
    { n: 'Balanca Tras. CG 160 Compl.', sku: 'SP-016', sub: 'Balancas', pv: 220.00, pc: 145.00, q: 1, min: 1, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'suspensao' },
    { n: 'Rolamento Caixa Direcao CG', sku: 'SP-017', sub: 'Rolamentos', pv: 35.00, pc: 20.00, q: 8, min: 3, marca: 'SKF', comp: 'CG 160, Titan 160', cat: 'suspensao' },
    { n: 'Rolamento Caixa Direcao Bros', sku: 'SP-018', sub: 'Rolamentos', pv: 42.00, pc: 25.00, q: 6, min: 2, marca: 'SKF', comp: 'Bros 160', cat: 'suspensao' },
    { n: 'Garfo Susp. Diant. CG Esq.', sku: 'SP-019', sub: 'Garfos', pv: 280.00, pc: 185.00, q: 1, min: 1, marca: 'Showa', comp: 'CG 160, Titan 160', cat: 'suspensao' },
    { n: 'Garfo Susp. Diant. CG Dir.', sku: 'SP-020', sub: 'Garfos', pv: 280.00, pc: 185.00, q: 1, min: 1, marca: 'Showa', comp: 'CG 160, Titan 160', cat: 'suspensao' },

    // ===== TRANSMISSÃO (25 peças) =====
    { n: 'Kit Relacao CG 160 Completo', sku: 'TM-001', sub: 'Kit de relacao', pv: 180.00, pc: 110.00, q: 5, min: 2, marca: 'KMC', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Kit Relacao Bros 160 Compl.', sku: 'TM-002', sub: 'Kit de relacao', pv: 195.00, pc: 125.00, q: 4, min: 2, marca: 'KMC', comp: 'Bros 160', cat: 'transmissao' },
    { n: 'Kit Relacao XRE 300 Compl.', sku: 'TM-003', sub: 'Kit de relacao', pv: 250.00, pc: 165.00, q: 0, min: 1, marca: 'DID', comp: 'XRE 300, CB 300F', cat: 'transmissao' },
    { n: 'Kit Relacao Fazer 250 Compl.', sku: 'TM-004', sub: 'Kit de relacao', pv: 230.00, pc: 152.00, q: 2, min: 1, marca: 'DID', comp: 'Fazer 250', cat: 'transmissao' },
    { n: 'Corrente 428 120L', sku: 'TM-005', sub: 'Correntes', pv: 65.00, pc: 38.00, q: 10, min: 3, marca: 'KMC', comp: 'CG 160, Titan 160, Bros 160', cat: 'transmissao' },
    { n: 'Corrente 520 106L', sku: 'TM-006', sub: 'Correntes', pv: 95.00, pc: 60.00, q: 6, min: 2, marca: 'DID', comp: 'XRE 300, CB 300F, Fazer 250', cat: 'transmissao' },
    { n: 'Corrente 428HD 126L', sku: 'TM-007', sub: 'Correntes', pv: 78.00, pc: 48.00, q: 8, min: 3, marca: 'KMC', comp: 'Universal', cat: 'transmissao' },
    { n: 'Pinhão 15 Dentes CG 160', sku: 'TM-008', sub: 'Pinhoes', pv: 28.00, pc: 15.00, q: 8, min: 3, marca: 'Vaz', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Pinhão 14 Dentes Bros 160', sku: 'TM-009', sub: 'Pinhoes', pv: 32.00, pc: 18.00, q: 6, min: 2, marca: 'Vaz', comp: 'Bros 160', cat: 'transmissao' },
    { n: 'Pinhão 15 Dentes Fazer 250', sku: 'TM-010', sub: 'Pinhoes', pv: 35.00, pc: 20.00, q: 4, min: 2, marca: 'Vaz', comp: 'Fazer 250', cat: 'transmissao' },
    { n: 'Coroa 39 Dentes CG 160', sku: 'TM-011', sub: 'Coroas', pv: 65.00, pc: 40.00, q: 6, min: 2, marca: 'Vaz', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Coroa 41 Dentes Bros 160', sku: 'TM-012', sub: 'Coroas', pv: 72.00, pc: 45.00, q: 5, min: 2, marca: 'Vaz', comp: 'Bros 160', cat: 'transmissao' },
    { n: 'Coroa 43 Dentes Fazer 250', sku: 'TM-013', sub: 'Coroas', pv: 85.00, pc: 55.00, q: 3, min: 1, marca: 'Vaz', comp: 'Fazer 250', cat: 'transmissao' },
    { n: 'Cabo Embreagem CG 160', sku: 'TM-014', sub: 'Cabos embreagem', pv: 32.00, pc: 18.90, q: 15, min: 3, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Cabo Embreagem Bros 160', sku: 'TM-015', sub: 'Cabos embreagem', pv: 35.00, pc: 20.00, q: 12, min: 4, marca: 'Vedamotors', comp: 'Bros 160', cat: 'transmissao' },
    { n: 'Cabo Embreagem XRE 300', sku: 'TM-016', sub: 'Cabos embreagem', pv: 38.00, pc: 22.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'XRE 300, CB 300F', cat: 'transmissao' },
    { n: 'Disco Embreagem CG 160 Jogo', sku: 'TM-017', sub: 'Discos embreagem', pv: 85.00, pc: 52.00, q: 4, min: 2, marca: 'EBC', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Disco Embreagem Bros 160 Jogo', sku: 'TM-018', sub: 'Discos embreagem', pv: 95.00, pc: 60.00, q: 3, min: 1, marca: 'EBC', comp: 'Bros 160', cat: 'transmissao' },
    { n: 'Mola Embreagem CG 160', sku: 'TM-019', sub: 'Molas embreagem', pv: 18.00, pc: 10.00, q: 10, min: 4, marca: 'ProTork', comp: 'CG 160, Titan 160, Bros 160', cat: 'transmissao' },
    { n: 'Manete Embreagem Universal', sku: 'TM-020', sub: 'Manetes', pv: 22.00, pc: 11.00, q: 14, min: 5, marca: 'Metal Leve', comp: 'Universal', cat: 'transmissao' },
    { n: 'Pedal Cambio CG 160', sku: 'TM-021', sub: 'Pedais', pv: 48.00, pc: 28.00, q: 5, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Protetor Corrente CG 160', sku: 'TM-022', sub: 'Protetores', pv: 25.00, pc: 14.00, q: 7, min: 3, marca: 'MotoPlastic', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Guia Corrente CG 160', sku: 'TM-023', sub: 'Guias', pv: 18.00, pc: 10.00, q: 12, min: 4, marca: 'Cofap', comp: 'CG 160, Titan 160, Bros 160', cat: 'transmissao' },
    { n: 'Retentor Pedal Cambio CG', sku: 'TM-024', sub: 'Retentores', pv: 8.00, pc: 3.00, q: 20, min: 8, marca: 'Sabó', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Cubo Roda Tras. CG 160', sku: 'TM-025', sub: 'Cubos', pv: 160.00, pc: 105.00, q: 2, min: 1, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'transmissao' },

    // ===== CARROCERIA (20 peças) =====
    { n: 'Paralamas Diant. CG 160', sku: 'CR-001', sub: 'Paralamas', pv: 85.00, pc: 52.00, q: 4, min: 2, marca: 'MotoPlastic', comp: 'CG 160, Titan 160', cat: 'carroceria' },
    { n: 'Paralamas Diant. Bros 160', sku: 'CR-002', sub: 'Paralamas', pv: 95.00, pc: 60.00, q: 3, min: 1, marca: 'MotoPlastic', comp: 'Bros 160', cat: 'carroceria' },
    { n: 'Tanque Titan 160 Preto', sku: 'CR-003', sub: 'Tanques', pv: 320.00, pc: 210.00, q: 1, min: 1, marca: 'Honda Genuino', comp: 'Titan 160, CG 160', cat: 'carroceria' },
    { n: 'Tanque Bros 160 Vermelho', sku: 'CR-004', sub: 'Tanques', pv: 380.00, pc: 255.00, q: 1, min: 1, marca: 'Honda Genuino', comp: 'Bros 160', cat: 'carroceria' },
    { n: 'Carene Lateral Esq. Titan', sku: 'CR-005', sub: 'Carenes', pv: 65.00, pc: 38.00, q: 2, min: 1, marca: 'MotoPlastic', comp: 'Titan 160, CG 160', cat: 'carroceria' },
    { n: 'Carene Lateral Dir. Titan', sku: 'CR-006', sub: 'Carenes', pv: 65.00, pc: 38.00, q: 2, min: 1, marca: 'MotoPlastic', comp: 'Titan 160, CG 160', cat: 'carroceria' },
    { n: 'Suporte Placa Universal', sku: 'CR-007', sub: 'Suportes', pv: 22.00, pc: 11.00, q: 8, min: 3, marca: 'MotoPlastic', comp: 'Universal', cat: 'carroceria' },
    { n: 'Rabeta Traseira Titan 160', sku: 'CR-008', sub: 'Rabeta', pv: 75.00, pc: 48.00, q: 3, min: 1, marca: 'MotoPlastic', comp: 'Titan 160, CG 160', cat: 'carroceria' },
    { n: 'Carenagem Farol Bros Preta', sku: 'CR-009', sub: 'Carenagens', pv: 55.00, pc: 35.00, q: 3, min: 1, marca: 'MotoPlastic', comp: 'Bros 160', cat: 'carroceria' },
    { n: 'Viseira Bolha Titan 160 Fume', sku: 'CR-010', sub: 'Viseiras', pv: 48.00, pc: 30.00, q: 5, min: 2, marca: 'MotoPlastic', comp: 'Titan 160, CG 160', cat: 'carroceria' },
    { n: 'Suporte Farol CG 160 Compl.', sku: 'CR-011', sub: 'Suportes farol', pv: 38.00, pc: 22.00, q: 6, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'carroceria' },
    { n: 'Suporte Guidão Fazer 250', sku: 'CR-012', sub: 'Suportes', pv: 120.00, pc: 78.00, q: 2, min: 1, marca: 'ProTork', comp: 'Fazer 250', cat: 'carroceria' },
    { n: 'Grade Protecao Radiador XRE', sku: 'CR-013', sub: 'Grades', pv: 65.00, pc: 40.00, q: 3, min: 1, marca: 'MotoPlastic', comp: 'XRE 300', cat: 'carroceria' },
    { n: 'Par Alforges Laterais Universal', sku: 'CR-014', sub: 'Alforges', pv: 180.00, pc: 120.00, q: 2, min: 1, marca: 'ProTork', comp: 'Universal', cat: 'carroceria' },
    { n: 'Bau Traseiro 45L Universal', sku: 'CR-015', sub: 'Baus', pv: 280.00, pc: 185.00, q: 2, min: 1, marca: 'Givi', comp: 'Universal', cat: 'carroceria' },
    { n: 'Protecao Motor Bros Inferior', sku: 'CR-016', sub: 'Protetores', pv: 145.00, pc: 95.00, q: 2, min: 1, marca: 'ProTork', comp: 'Bros 160', cat: 'carroceria' },
    { n: 'Defletor Ar Bros Transparente', sku: 'CR-017', sub: 'Defletores', pv: 55.00, pc: 35.00, q: 3, min: 1, marca: 'MotoPlastic', comp: 'Bros 160', cat: 'carroceria' },
    { n: 'Farol Completo CG 160', sku: 'AC-026', sub: 'Farois', pv: 145.00, pc: 95.00, q: 2, min: 1, marca: 'Arteb', comp: 'CG 160, Titan 160', cat: 'acessorios' },
    { n: 'Farol Completo Bros 160', sku: 'AC-027', sub: 'Farois', pv: 175.00, pc: 115.00, q: 2, min: 1, marca: 'Arteb', comp: 'Bros 160', cat: 'acessorios' },
    { n: 'Farol Completo Fazer 250', sku: 'AC-028', sub: 'Farois', pv: 195.00, pc: 128.00, q: 1, min: 1, marca: 'Arteb', comp: 'Fazer 250', cat: 'acessorios' },

    // ===== RODAS E PNEUS (25 peças) =====
    { n: 'Pneu 90/90-18 Tras. CG 160', sku: 'RP-001', sub: 'Pneus', pv: 220.00, pc: 155.00, q: 8, min: 3, marca: 'Pirelli', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Pneu 80/100-17 Diant. CG 160', sku: 'RP-002', sub: 'Pneus', pv: 185.00, pc: 125.00, q: 6, min: 2, marca: 'Pirelli', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Pneu 100/90-18 Tras. Bros', sku: 'RP-003', sub: 'Pneus', pv: 245.00, pc: 170.00, q: 5, min: 2, marca: 'Pirelli', comp: 'Bros 160', cat: 'rodas-e-pneus' },
    { n: 'Pneu 90/90-21 Diant. Bros', sku: 'RP-004', sub: 'Pneus', pv: 210.00, pc: 145.00, q: 4, min: 2, marca: 'Pirelli', comp: 'Bros 160', cat: 'rodas-e-pneus' },
    { n: 'Pneu 110/90-17 Tras. XRE', sku: 'RP-005', sub: 'Pneus', pv: 280.00, pc: 195.00, q: 0, min: 2, marca: 'Metzeler', comp: 'XRE 300', cat: 'rodas-e-pneus' },
    { n: 'Pneu 90/90-21 Diant. XRE', sku: 'RP-006', sub: 'Pneus', pv: 230.00, pc: 158.00, q: 3, min: 1, marca: 'Metzeler', comp: 'XRE 300', cat: 'rodas-e-pneus' },
    { n: 'Pneu 130/70-17 Tras. CB 300F', sku: 'RP-007', sub: 'Pneus', pv: 320.00, pc: 220.00, q: 2, min: 1, marca: 'Pirelli', comp: 'CB 300F, Fazer 250', cat: 'rodas-e-pneus' },
    { n: 'Pneu 110/70-17 Diant. CB 300F', sku: 'RP-008', sub: 'Pneus', pv: 275.00, pc: 190.00, q: 2, min: 1, marca: 'Pirelli', comp: 'CB 300F, Fazer 250', cat: 'rodas-e-pneus' },
    { n: 'Camara Ar 18" Universal', sku: 'RP-009', sub: 'Camaras', pv: 28.00, pc: 15.00, q: 12, min: 4, marca: 'Michelin', comp: 'Universal', cat: 'rodas-e-pneus' },
    { n: 'Camara Ar 17" Universal', sku: 'RP-010', sub: 'Camaras', pv: 25.00, pc: 13.00, q: 15, min: 5, marca: 'Michelin', comp: 'Universal', cat: 'rodas-e-pneus' },
    { n: 'Camara Ar 21" Bros/XRE', sku: 'RP-011', sub: 'Camaras', pv: 30.00, pc: 17.00, q: 10, min: 4, marca: 'Michelin', comp: 'Bros 160, XRE 300', cat: 'rodas-e-pneus' },
    { n: 'Aro 17" Diant. CG 160', sku: 'RP-012', sub: 'Aros', pv: 240.00, pc: 170.00, q: 3, min: 1, marca: 'DID', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Aro 18" Tras. CG 160', sku: 'RP-013', sub: 'Aros', pv: 260.00, pc: 185.00, q: 2, min: 1, marca: 'DID', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Aro 21" Diant. Bros 160', sku: 'RP-014', sub: 'Aros', pv: 280.00, pc: 195.00, q: 2, min: 1, marca: 'DID', comp: 'Bros 160', cat: 'rodas-e-pneus' },
    { n: 'Cubo Roda Diant. CG 160', sku: 'RP-015', sub: 'Cubos', pv: 180.00, pc: 120.00, q: 2, min: 1, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Raio Roda Tras. CG 160 Kit', sku: 'RP-016', sub: 'Raios', pv: 45.00, pc: 28.00, q: 8, min: 3, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Raio Roda Tras. Bros 160 Kit', sku: 'RP-017', sub: 'Raios', pv: 52.00, pc: 32.00, q: 6, min: 2, marca: 'Cofap', comp: 'Bros 160', cat: 'rodas-e-pneus' },
    { n: 'Rolamento Roda Diant. Kit CG', sku: 'RP-018', sub: 'Rolamentos', pv: 35.00, pc: 20.00, q: 10, min: 4, marca: 'SKF', comp: 'CG 160, Titan 160, Bros 160', cat: 'rodas-e-pneus' },
    { n: 'Rolamento Roda Tras. Kit CG', sku: 'RP-019', sub: 'Rolamentos', pv: 42.00, pc: 25.00, q: 8, min: 3, marca: 'SKF', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Eixo Diant. CG 160 Completo', sku: 'RP-020', sub: 'Eixos', pv: 65.00, pc: 38.00, q: 4, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Bico Camara Reto Universal', sku: 'RP-021', sub: 'Bicos', pv: 5.00, pc: 2.00, q: 30, min: 10, marca: 'Magoo', comp: 'Universal', cat: 'rodas-e-pneus' },
    { n: 'Protetor Camara 18" Univ.', sku: 'RP-022', sub: 'Protetores', pv: 12.00, pc: 6.00, q: 20, min: 8, marca: 'Magoo', comp: 'Universal', cat: 'rodas-e-pneus' },
    { n: 'Pneu 110/80-18 Tras. Misto', sku: 'RP-023', sub: 'Pneus', pv: 260.00, pc: 180.00, q: 4, min: 2, marca: 'Pirelli', comp: 'CG 160, Titan 160, Bros 160', cat: 'rodas-e-pneus' },
    { n: 'Calota Cubo Roda CG Preta', sku: 'RP-024', sub: 'Calotas', pv: 18.00, pc: 9.00, q: 10, min: 4, marca: 'MotoPlastic', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Pneu 90/90-18 Tras. Levorin', sku: 'RP-025', sub: 'Pneus', pv: 175.00, pc: 115.00, q: 10, min: 4, marca: 'Levorin', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },

    // ===== ÓLEOS E FLUIDOS (20 peças) =====
    { n: 'Oleo 20W50 1L Mineral', sku: 'OL-001', sub: 'Oleo motor', pv: 28.00, pc: 17.50, q: 30, min: 10, marca: 'Ipiranga', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Oleo 20W50 1L Semissintetico', sku: 'OL-002', sub: 'Oleo motor', pv: 35.00, pc: 22.00, q: 25, min: 8, marca: 'Ipiranga', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Oleo 10W40 1L Sintetico Motul', sku: 'OL-003', sub: 'Oleo motor', pv: 42.00, pc: 28.00, q: 20, min: 6, marca: 'Motul', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Oleo 10W30 1L Honda Genuino', sku: 'OL-004', sub: 'Oleo motor', pv: 35.00, pc: 22.00, q: 18, min: 6, marca: 'Honda', comp: 'CG 160, Titan 160, Bros 160, PCX 150', cat: 'oleos-e-fluidos' },
    { n: 'Oleo 5W30 1L Honda Sintetico', sku: 'OL-005', sub: 'Oleo motor', pv: 48.00, pc: 32.00, q: 12, min: 4, marca: 'Honda', comp: 'XRE 300, CB 300F', cat: 'oleos-e-fluidos' },
    { n: 'Oleo 10W40 1L Yamalube', sku: 'OL-006', sub: 'Oleo motor', pv: 45.00, pc: 30.00, q: 14, min: 5, marca: 'Yamaha', comp: 'Fazer 250, Factor 150, NMax 160', cat: 'oleos-e-fluidos' },
    { n: 'Oleo 20W50 1L Mobil', sku: 'OL-007', sub: 'Oleo motor', pv: 38.00, pc: 25.00, q: 22, min: 8, marca: 'Mobil', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Oleo Transmissao 80W90 1L', sku: 'OL-008', sub: 'Oleo transmissao', pv: 25.00, pc: 14.00, q: 14, min: 5, marca: 'Ipiranga', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Oleo Suspensao 10W 500ml', sku: 'OL-009', sub: 'Oleo suspensao', pv: 28.00, pc: 16.00, q: 10, min: 4, marca: 'Motul', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Liquido Arrefecimento 1L Pronto', sku: 'OL-010', sub: 'Arrefecimento', pv: 18.00, pc: 10.00, q: 16, min: 5, marca: 'Paraflu', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Liquido Arrefecimento Concentr.', sku: 'OL-011', sub: 'Arrefecimento', pv: 22.00, pc: 13.00, q: 12, min: 4, marca: 'Paraflu', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Spray Lubrificante Corrente', sku: 'OL-012', sub: 'Lubrificantes', pv: 32.00, pc: 19.00, q: 10, min: 4, marca: 'Motul', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Graxa Branca Multiuso 500g', sku: 'OL-013', sub: 'Lubrificantes', pv: 25.00, pc: 14.00, q: 15, min: 5, marca: 'Ipiranga', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Graxa Litio 500g', sku: 'OL-014', sub: 'Lubrificantes', pv: 22.00, pc: 12.00, q: 12, min: 4, marca: 'Ipiranga', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Limpa Carburador Spray 300ml', sku: 'OL-015', sub: 'Limpeza', pv: 18.00, pc: 10.00, q: 14, min: 5, marca: 'Wurth', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Lava Contatos Spray 300ml', sku: 'OL-016', sub: 'Limpeza', pv: 22.00, pc: 13.00, q: 12, min: 4, marca: 'Wurth', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Desengripante Spray 300ml', sku: 'OL-017', sub: 'Penetrantes', pv: 15.00, pc: 8.00, q: 18, min: 6, marca: 'Wurth', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'WD-40 Spray Multiuso 300ml', sku: 'OL-018', sub: 'Penetrantes', pv: 38.00, pc: 25.00, q: 15, min: 5, marca: 'WD-40', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Aditivo Radiador 250ml', sku: 'OL-019', sub: 'Aditivos', pv: 15.00, pc: 8.00, q: 10, min: 4, marca: 'Turtle Wax', comp: 'Universal', cat: 'oleos-e-fluidos' },
    { n: 'Oleo Freio DOT4 250ml', sku: 'OL-020', sub: 'Fluido freio', pv: 28.00, pc: 16.00, q: 16, min: 5, marca: 'Varga', comp: 'Universal', cat: 'oleos-e-fluidos' },

    // ===== ESCAPAMENTO (15 peças) =====
    { n: 'Escapamento CG 160 Completo', sku: 'ES-001', sub: 'Escapamento completo', pv: 220.00, pc: 145.00, q: 3, min: 1, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'escapamento' },
    { n: 'Escapamento Titan 160 Completo', sku: 'ES-002', sub: 'Escapamento completo', pv: 240.00, pc: 158.00, q: 2, min: 1, marca: 'Cofap', comp: 'Titan 160, CG 160', cat: 'escapamento' },
    { n: 'Escapamento Bros 160 Completo', sku: 'ES-003', sub: 'Escapamento completo', pv: 260.00, pc: 175.00, q: 0, min: 1, marca: 'Cofap', comp: 'Bros 160', cat: 'escapamento' },
    { n: 'Silenciador Titan 160', sku: 'ES-004', sub: 'Silenciadores', pv: 95.00, pc: 60.00, q: 4, min: 1, marca: 'Cofap', comp: 'Titan 160, CG 160', cat: 'escapamento' },
    { n: 'Silenciador Bros 160', sku: 'ES-005', sub: 'Silenciadores', pv: 110.00, pc: 72.00, q: 3, min: 1, marca: 'Cofap', comp: 'Bros 160', cat: 'escapamento' },
    { n: 'Silenciador Esportivo CG', sku: 'ES-006', sub: 'Silenciadores', pv: 135.00, pc: 88.00, q: 2, min: 1, marca: 'ProTork', comp: 'CG 160, Titan 160', cat: 'escapamento' },
    { n: 'Abracadeira Escapamento CG', sku: 'ES-007', sub: 'Abracadeiras', pv: 8.00, pc: 3.00, q: 20, min: 8, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'escapamento' },
    { n: 'Abracadeira Escapamento Bros', sku: 'ES-008', sub: 'Abracadeiras', pv: 10.00, pc: 4.00, q: 18, min: 6, marca: 'Cofap', comp: 'Bros 160', cat: 'escapamento' },
    { n: 'Junta Coletor Escapamento CG', sku: 'ES-009', sub: 'Juntas', pv: 12.00, pc: 5.50, q: 15, min: 5, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'escapamento' },
    { n: 'Junta Coletor Escapamento Bros', sku: 'ES-010', sub: 'Juntas', pv: 15.00, pc: 7.00, q: 12, min: 4, marca: 'Vedamotors', comp: 'Bros 160', cat: 'escapamento' },
    { n: 'Protetor Escape CG Cromado', sku: 'ES-011', sub: 'Protetores', pv: 45.00, pc: 28.00, q: 5, min: 2, marca: 'ProTork', comp: 'CG 160, Titan 160', cat: 'escapamento' },
    { n: 'Coletor Escape CG 160', sku: 'ES-012', sub: 'Coletores', pv: 85.00, pc: 55.00, q: 3, min: 1, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'escapamento' },
    { n: 'Coletor Escape Bros 160', sku: 'ES-013', sub: 'Coletores', pv: 95.00, pc: 62.00, q: 2, min: 1, marca: 'Cofap', comp: 'Bros 160', cat: 'escapamento' },
    { n: 'Ponteira Escape Universal Crom.', sku: 'ES-014', sub: 'Ponteiras', pv: 38.00, pc: 22.00, q: 6, min: 2, marca: 'ProTork', comp: 'Universal', cat: 'escapamento' },
    { n: 'Parafuso Coletor Escape CG', sku: 'ES-015', sub: 'Parafusos', pv: 5.00, pc: 2.00, q: 25, min: 10, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'escapamento' },

    // ===== ACESSÓRIOS (25 peças) =====
    { n: 'Retrovisor Esquerdo Universal', sku: 'AC-001', sub: 'Retrovisores', pv: 35.00, pc: 19.90, q: 12, min: 3, marca: 'ProTork', comp: 'Universal', cat: 'acessorios' },
    { n: 'Retrovisor Direito Universal', sku: 'AC-002', sub: 'Retrovisores', pv: 35.00, pc: 19.90, q: 12, min: 3, marca: 'ProTork', comp: 'Universal', cat: 'acessorios' },
    { n: 'Manopla Esquerda CG 160', sku: 'AC-003', sub: 'Manoplas', pv: 15.00, pc: 7.50, q: 18, min: 5, marca: 'ProTork', comp: 'CG 160, Titan 160, Bros 160', cat: 'acessorios' },
    { n: 'Manopla Direita CG 160', sku: 'AC-004', sub: 'Manoplas', pv: 18.00, pc: 9.00, q: 18, min: 5, marca: 'ProTork', comp: 'CG 160, Titan 160, Bros 160', cat: 'acessorios' },
    { n: 'Par Setas Universal Cristal', sku: 'AC-005', sub: 'Setas', pv: 38.00, pc: 22.00, q: 10, min: 4, marca: 'Arteb', comp: 'Universal', cat: 'acessorios' },
    { n: 'Seta Universal Laranja', sku: 'AC-006', sub: 'Setas', pv: 28.00, pc: 16.00, q: 12, min: 4, marca: 'Arteb', comp: 'Universal', cat: 'acessorios' },
    { n: 'Capa Banco CG 160 Preto', sku: 'AC-007', sub: 'Bancos', pv: 45.00, pc: 25.00, q: 6, min: 2, marca: 'ProTork', comp: 'CG 160, Titan 160', cat: 'acessorios' },
    { n: 'Banco Completo CG 160 Original', sku: 'AC-008', sub: 'Bancos', pv: 180.00, pc: 120.00, q: 2, min: 1, marca: 'Honda Genuino', comp: 'CG 160, Titan 160', cat: 'acessorios' },
    { n: 'Capa Banco Bros 160 Preto', sku: 'AC-009', sub: 'Bancos', pv: 52.00, pc: 30.00, q: 4, min: 2, marca: 'ProTork', comp: 'Bros 160', cat: 'acessorios' },
    { n: 'Guidão CG 160 Original', sku: 'AC-010', sub: 'Guidoes', pv: 55.00, pc: 32.00, q: 5, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'acessorios' },
    { n: 'Guidão Bros 160 Original', sku: 'AC-011', sub: 'Guidoes', pv: 65.00, pc: 40.00, q: 3, min: 1, marca: 'Cofap', comp: 'Bros 160', cat: 'acessorios' },
    { n: 'Pedaleira Diant. CG 160 Kit', sku: 'AC-012', sub: 'Pedaleiras', pv: 42.00, pc: 25.00, q: 6, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'acessorios' },
    { n: 'Pedaleira Tras. CG 160 Kit', sku: 'AC-013', sub: 'Pedaleiras', pv: 38.00, pc: 22.00, q: 5, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'acessorios' },
    { n: 'Cavalete Central CG 160', sku: 'AC-014', sub: 'Cavaletes', pv: 65.00, pc: 38.00, q: 4, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'acessorios' },
    { n: 'Cavalete Lateral Bros 160', sku: 'AC-015', sub: 'Cavaletes', pv: 48.00, pc: 28.00, q: 3, min: 1, marca: 'Cofap', comp: 'Bros 160', cat: 'acessorios' },
    { n: 'Alarme Universal para Moto', sku: 'AC-016', sub: 'Alarmes', pv: 85.00, pc: 52.00, q: 4, min: 2, marca: 'Positron', comp: 'Universal', cat: 'acessorios' },
    { n: 'Trava Disco com Alarme', sku: 'AC-017', sub: 'Seguranca', pv: 75.00, pc: 48.00, q: 5, min: 2, marca: 'Positron', comp: 'Universal', cat: 'acessorios' },
    { n: 'Cabo Acelerador CG 160', sku: 'AC-018', sub: 'Cabos acelerador', pv: 28.00, pc: 16.00, q: 14, min: 4, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'acessorios' },
    { n: 'Cabo Acelerador Bros 160', sku: 'AC-019', sub: 'Cabos acelerador', pv: 32.00, pc: 18.00, q: 12, min: 4, marca: 'Vedamotors', comp: 'Bros 160', cat: 'acessorios' },
    { n: 'Mata Cachorro Universal Preto', sku: 'AC-020', sub: 'Protetores', pv: 35.00, pc: 20.00, q: 8, min: 3, marca: 'ProTork', comp: 'Universal', cat: 'acessorios' },
    { n: 'Bolha para Capacete Escura', sku: 'AC-021', sub: 'Capacetes', pv: 25.00, pc: 14.00, q: 8, min: 3, marca: 'ProTork', comp: 'Universal', cat: 'acessorios' },
    { n: 'Suporte Celular Universal', sku: 'AC-022', sub: 'Suportes', pv: 45.00, pc: 28.00, q: 6, min: 2, marca: 'ProTork', comp: 'Universal', cat: 'acessorios' },
    { n: 'Buzina Universal 12V', sku: 'AC-023', sub: 'Buzinas', pv: 22.00, pc: 12.00, q: 10, min: 4, marca: 'Arteb', comp: 'Universal', cat: 'acessorios' },
    { n: 'Lanterna Traseira Titan 160', sku: 'AC-024', sub: 'Lanternas', pv: 65.00, pc: 40.00, q: 4, min: 2, marca: 'Arteb', comp: 'Titan 160, CG 160', cat: 'acessorios' },
    { n: 'Lanterna Traseira Bros 160', sku: 'AC-025', sub: 'Lanternas', pv: 72.00, pc: 45.00, q: 3, min: 1, marca: 'Arteb', comp: 'Bros 160', cat: 'acessorios' },

    // ===== FILTROS (12 peças) =====
    { n: 'Filtro de Oleo CG 160', sku: 'FL-001', sub: 'Filtro de oleo', pv: 18.00, pc: 10.00, q: 25, min: 5, marca: 'Honda Genuino', comp: 'CG 160, Titan 160', cat: 'filtros' },
    { n: 'Filtro de Oleo Bros 160', sku: 'FL-002', sub: 'Filtro de oleo', pv: 20.00, pc: 12.00, q: 20, min: 5, marca: 'Honda Genuino', comp: 'Bros 160', cat: 'filtros' },
    { n: 'Filtro de Oleo XRE 300', sku: 'FL-003', sub: 'Filtro de oleo', pv: 25.00, pc: 15.00, q: 12, min: 4, marca: 'Honda Genuino', comp: 'XRE 300, CB 300F', cat: 'filtros' },
    { n: 'Filtro de Oleo Fazer 250', sku: 'FL-004', sub: 'Filtro de oleo', pv: 22.00, pc: 13.00, q: 14, min: 4, marca: 'Yamaha', comp: 'Fazer 250, Factor 150', cat: 'filtros' },
    { n: 'Filtro de Ar CG 160', sku: 'FL-005', sub: 'Filtro de ar', pv: 32.00, pc: 18.00, q: 15, min: 4, marca: 'Honda Genuino', comp: 'CG 160, Titan 160', cat: 'filtros' },
    { n: 'Filtro de Ar Bros 160', sku: 'FL-006', sub: 'Filtro de ar', pv: 35.00, pc: 20.00, q: 12, min: 3, marca: 'Honda Genuino', comp: 'Bros 160', cat: 'filtros' },
    { n: 'Filtro de Ar XRE 300', sku: 'FL-007', sub: 'Filtro de ar', pv: 42.00, pc: 25.00, q: 8, min: 3, marca: 'Honda Genuino', comp: 'XRE 300, CB 300F', cat: 'filtros' },
    { n: 'Filtro de Ar NMax 160', sku: 'FL-008', sub: 'Filtro de ar', pv: 28.00, pc: 16.00, q: 6, min: 2, marca: 'Yamaha', comp: 'NMax 160', cat: 'filtros' },
    { n: 'Filtro de Combustivel Universal', sku: 'FL-009', sub: 'Filtro combustivel', pv: 12.00, pc: 6.00, q: 20, min: 8, marca: 'Vedamotors', comp: 'Universal', cat: 'filtros' },
    { n: 'Filtro de Combustivel CG 160', sku: 'FL-010', sub: 'Filtro combustivel', pv: 15.00, pc: 8.00, q: 18, min: 6, marca: 'Honda Genuino', comp: 'CG 160, Titan 160', cat: 'filtros' },
    { n: 'Elemento Filtro de Ar Esportivo', sku: 'FL-011', sub: 'Filtro de ar', pv: 55.00, pc: 32.00, q: 5, min: 2, marca: 'ProTork', comp: 'Universal esportivo', cat: 'filtros' },
    { n: 'Filtro de Transmissao PCX 150', sku: 'FL-012', sub: 'Filtro CVT', pv: 35.00, pc: 20.00, q: 4, min: 2, marca: 'Honda Genuino', comp: 'PCX 150', cat: 'filtros' },

    // ===== CABOS E COMANDOS (12 peças) =====
    { n: 'Cabo de Acelerador CG 160', sku: 'CB-001', sub: 'Cabos acelerador', pv: 28.00, pc: 16.00, q: 14, min: 4, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Acelerador Bros 160', sku: 'CB-002', sub: 'Cabos acelerador', pv: 32.00, pc: 18.00, q: 12, min: 4, marca: 'Vedamotors', comp: 'Bros 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Acelerador Fazer 250', sku: 'CB-003', sub: 'Cabos acelerador', pv: 35.00, pc: 20.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Fazer 250', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Embreagem CG 160', sku: 'CB-004', sub: 'Cabos embreagem', pv: 32.00, pc: 18.90, q: 15, min: 3, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Embreagem Bros 160', sku: 'CB-005', sub: 'Cabos embreagem', pv: 35.00, pc: 20.00, q: 12, min: 4, marca: 'Vedamotors', comp: 'Bros 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Freio Dianteiro CG 160', sku: 'CB-006', sub: 'Cabos freio', pv: 28.00, pc: 16.00, q: 12, min: 4, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Freio Traseiro CG 160', sku: 'CB-007', sub: 'Cabos freio', pv: 25.00, pc: 14.00, q: 10, min: 3, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Freio Dianteiro Bros 160', sku: 'CB-008', sub: 'Cabos freio', pv: 30.00, pc: 17.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Bros 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Velocimetro CG 160', sku: 'CB-009', sub: 'Cabos velocimetro', pv: 25.00, pc: 14.00, q: 10, min: 3, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Velocimetro Bros 160', sku: 'CB-010', sub: 'Cabos velocimetro', pv: 28.00, pc: 16.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Bros 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo de Afogador CG 160', sku: 'CB-011', sub: 'Cabos afogador', pv: 18.00, pc: 10.00, q: 10, min: 4, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'cabos-e-comandos' },
    { n: 'Manopla Esquerda CG 160', sku: 'CB-012', sub: 'Manoplas', pv: 15.00, pc: 7.50, q: 18, min: 5, marca: 'ProTork', comp: 'CG 160, Titan 160, Bros 160', cat: 'cabos-e-comandos' },

    // ===== PRODUTOS REAIS DA LOJA (print GSlim) =====
    // PNEUS
    { n: 'Pneu Dianteiro 2.75x18 c/ Camara', sku: 'PN-001', sub: 'Pneus', pv: 185.00, pc: 120.00, q: 6, min: 2, marca: 'Levorin', comp: 'Universal 2.75x18', cat: 'rodas-e-pneus' },
    { n: 'Pneu Traseiro 90/90-18 c/ Camara', sku: 'PN-002', sub: 'Pneus', pv: 220.00, pc: 155.00, q: 8, min: 3, marca: 'Levorin', comp: 'CG 160, Titan 160', cat: 'rodas-e-pneus' },
    { n: 'Pneu Dianteiro 80/100-18 c/ Camara', sku: 'PN-003', sub: 'Pneus', pv: 195.00, pc: 130.00, q: 5, min: 2, marca: 'Levorin', comp: 'Universal 80/100-18', cat: 'rodas-e-pneus' },
    { n: 'Pneu Dianteiro 60/100-17 c/ Camara', sku: 'PN-004', sub: 'Pneus', pv: 165.00, pc: 105.00, q: 4, min: 2, marca: 'Levorin', comp: 'Universal 60/100-17', cat: 'rodas-e-pneus' },
    { n: 'Pneu Traseiro Levorin 275', sku: 'PN-005', sub: 'Pneus', pv: 175.00, pc: 115.00, q: 6, min: 2, marca: 'Levorin', comp: 'Universal 275', cat: 'rodas-e-pneus' },
    { n: 'Pneu Dianteiro Viper 250', sku: 'PN-006', sub: 'Pneus', pv: 230.00, pc: 158.00, q: 3, min: 1, marca: 'Viper', comp: 'Fazer 250, Lander 250', cat: 'rodas-e-pneus' },
    { n: 'Pneu Traseiro Viper c/ Camara', sku: 'PN-007', sub: 'Pneus', pv: 250.00, pc: 170.00, q: 3, min: 1, marca: 'Viper', comp: 'Universal', cat: 'rodas-e-pneus' },

    // CAMARAS DE AR
    { n: 'Camara de Ar Aro 18', sku: 'CM-001', sub: 'Camaras', pv: 28.00, pc: 15.00, q: 12, min: 4, marca: 'Michelin', comp: 'Universal aro 18', cat: 'rodas-e-pneus' },
    { n: 'Camara de Ar Aro 17', sku: 'CM-002', sub: 'Camaras', pv: 25.00, pc: 13.00, q: 14, min: 5, marca: 'Michelin', comp: 'Universal aro 17', cat: 'rodas-e-pneus' },
    { n: 'Camara de Ar Biz', sku: 'CM-003', sub: 'Camaras', pv: 22.00, pc: 12.00, q: 10, min: 4, marca: 'Magoo', comp: 'Biz 100/125', cat: 'rodas-e-pneus' },
    { n: 'Camara de Ar Pop', sku: 'CM-004', sub: 'Camaras', pv: 20.00, pc: 10.00, q: 8, min: 3, marca: 'Magoo', comp: 'Pop 100/110i', cat: 'rodas-e-pneus' },

    // CABOS ACELERADOR
    { n: 'Cabo Acelerador CG Titan Start', sku: 'CB-020', sub: 'Cabos acelerador', pv: 28.00, pc: 16.00, q: 12, min: 4, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo Acelerador Bros', sku: 'CB-021', sub: 'Cabos acelerador', pv: 32.00, pc: 18.00, q: 10, min: 3, marca: 'Vedamotors', comp: 'Bros 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo Acelerador Fan 150', sku: 'CB-022', sub: 'Cabos acelerador', pv: 28.00, pc: 16.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Fan 150', cat: 'cabos-e-comandos' },
    { n: 'Cabo Acelerador Lander 250', sku: 'CB-023', sub: 'Cabos acelerador', pv: 38.00, pc: 22.00, q: 5, min: 2, marca: 'Vedamotors', comp: 'Lander 250', cat: 'cabos-e-comandos' },
    { n: 'Cabo Acelerador XRE 300', sku: 'CB-024', sub: 'Cabos acelerador', pv: 42.00, pc: 25.00, q: 4, min: 2, marca: 'Vedamotors', comp: 'XRE 300', cat: 'cabos-e-comandos' },
    { n: 'Cabo Acelerador Pop', sku: 'CB-025', sub: 'Cabos acelerador', pv: 22.00, pc: 12.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Pop 100/110i', cat: 'cabos-e-comandos' },
    { n: 'Cabo Acelerador Yamaha Crypton/T115', sku: 'CB-026', sub: 'Cabos acelerador', pv: 30.00, pc: 17.00, q: 6, min: 2, marca: 'Vedamotors', comp: 'Crypton, T115', cat: 'cabos-e-comandos' },

    // CABOS EMBREAGEM
    { n: 'Cabo Embreagem CG Titan Start', sku: 'CB-030', sub: 'Cabos embreagem', pv: 32.00, pc: 18.90, q: 14, min: 4, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'cabos-e-comandos' },
    { n: 'Cabo Embreagem Pop', sku: 'CB-031', sub: 'Cabos embreagem', pv: 25.00, pc: 14.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Pop 100/110i', cat: 'cabos-e-comandos' },
    { n: 'Cabo Embreagem Yamaha', sku: 'CB-032', sub: 'Cabos embreagem', pv: 35.00, pc: 20.00, q: 6, min: 2, marca: 'Vedamotors', comp: 'Yamaha Factor, YBR', cat: 'cabos-e-comandos' },

    // ELETRICA
    { n: 'Bobina Combustivel', sku: 'EL-031', sub: 'Bobinas', pv: 45.00, pc: 28.00, q: 5, min: 2, marca: 'WGermany', comp: 'Universal', cat: 'eletrica' },
    { n: 'Bobina Combustivel Plus', sku: 'EL-032', sub: 'Bobinas', pv: 58.00, pc: 35.00, q: 4, min: 2, marca: 'WGermany', comp: 'Universal Plus', cat: 'eletrica' },
    { n: 'Buzina Universal', sku: 'EL-033', sub: 'Buzinas', pv: 22.00, pc: 12.00, q: 10, min: 4, marca: 'Arteb', comp: 'Universal 12V', cat: 'eletrica' },
    { n: 'Rele de Pisca', sku: 'EL-034', sub: 'Rele', pv: 18.00, pc: 9.00, q: 10, min: 4, marca: 'Arteb', comp: 'Universal 12V', cat: 'eletrica' },
    { n: 'Vela NGK', sku: 'EL-035', sub: 'Velas', pv: 22.00, pc: 12.00, q: 30, min: 8, marca: 'NGK', comp: 'Universal D8EA', cat: 'eletrica' },

    // FILTROS
    { n: 'Elemento Filtro de Ar Universal', sku: 'FL-013', sub: 'Filtro de ar', pv: 25.00, pc: 14.00, q: 12, min: 4, marca: 'ProTork', comp: 'Universal', cat: 'filtros' },
    { n: 'Filtro de Oleo Universal', sku: 'FL-014', sub: 'Filtro de oleo', pv: 18.00, pc: 10.00, q: 20, min: 6, marca: 'Honda Genuino', comp: 'CG, Titan, Bros', cat: 'filtros' },

    // SUSPENSAO
    { n: 'Amortecedor Yamaha Factor', sku: 'SP-021', sub: 'Amortecedores', pv: 120.00, pc: 78.00, q: 3, min: 1, marca: 'Cofap', comp: 'Factor 150', cat: 'suspensao' },

    // CUBOS DE RODA / MOTOR
    { n: 'Cubo Movel Dianteiro Moto 50mm', sku: 'RP-026', sub: 'Cubos', pv: 85.00, pc: 52.00, q: 4, min: 2, marca: 'Cofap', comp: 'Universal 50mm', cat: 'rodas-e-pneus' },
    { n: 'Cubo Movel Dianteiro Moto 20mm', sku: 'RP-027', sub: 'Cubos', pv: 75.00, pc: 45.00, q: 3, min: 1, marca: 'Cofap', comp: 'Universal 20mm', cat: 'rodas-e-pneus' },
    { n: 'Cubo de Motor 150mm', sku: 'MT-036', sub: 'Cilindro', pv: 195.00, pc: 130.00, q: 3, min: 1, marca: 'ProTork', comp: 'Universal 150mm', cat: 'motor' },
    { n: 'Cubo de Motor Fan 150', sku: 'MT-037', sub: 'Cilindro', pv: 195.00, pc: 130.00, q: 3, min: 1, marca: 'ProTork', comp: 'Fan 150', cat: 'motor' },
    { n: 'Cubo de Motor Titan 125/150', sku: 'MT-038', sub: 'Cilindro', pv: 195.00, pc: 130.00, q: 2, min: 1, marca: 'ProTork', comp: 'Titan 125/150', cat: 'motor' },
    { n: 'Cubo de Motor CG 125', sku: 'MT-039', sub: 'Cilindro', pv: 175.00, pc: 115.00, q: 2, min: 1, marca: 'ProTork', comp: 'CG 125', cat: 'motor' },
    { n: 'Cubo de Motor CG 150', sku: 'MT-040', sub: 'Cilindro', pv: 185.00, pc: 125.00, q: 2, min: 1, marca: 'ProTork', comp: 'CG 150', cat: 'motor' },
    { n: 'Cubo Yamaha 150', sku: 'MT-041', sub: 'Cilindro', pv: 195.00, pc: 130.00, q: 2, min: 1, marca: 'ProTork', comp: 'Yamaha Factor 150', cat: 'motor' },
    { n: 'Cubo para Corrente', sku: 'MT-042', sub: 'Cilindro', pv: 85.00, pc: 52.00, q: 4, min: 2, marca: 'Vaz', comp: 'Universal corrente', cat: 'transmissao' },

    // BUCHAS
    { n: 'Bucha para Coroa', sku: 'TM-026', sub: 'Buchas', pv: 12.00, pc: 5.50, q: 15, min: 5, marca: 'Sabó', comp: 'CG, Titan, Bros', cat: 'transmissao' },
    { n: 'Bucha para Corrente', sku: 'TM-027', sub: 'Buchas', pv: 10.00, pc: 4.50, q: 15, min: 5, marca: 'Sabó', comp: 'Universal', cat: 'transmissao' },

    // COROAS
    { n: 'Coroa CG Titan', sku: 'TM-028', sub: 'Coroas', pv: 65.00, pc: 40.00, q: 5, min: 2, marca: 'Vaz', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Coroa Yamaha Factor', sku: 'TM-029', sub: 'Coroas', pv: 68.00, pc: 42.00, q: 4, min: 2, marca: 'Vaz', comp: 'Factor 150, YBR', cat: 'transmissao' },
    { n: 'Coroa Twister', sku: 'TM-030', sub: 'Coroas', pv: 75.00, pc: 48.00, q: 3, min: 1, marca: 'Vaz', comp: 'Twister 250', cat: 'transmissao' },

    // JUNTAS DO MOTOR
    { n: 'Junta do Motor Honda Fan', sku: 'MT-043', sub: 'Junta do cabecote', pv: 22.00, pc: 12.00, q: 8, min: 3, marca: 'Vedamotors', comp: 'Fan 150', cat: 'motor' },
    { n: 'Junta do Motor Yamaha', sku: 'MT-044', sub: 'Junta do cabecote', pv: 25.00, pc: 14.00, q: 6, min: 2, marca: 'Vedamotors', comp: 'Yamaha Factor, YBR', cat: 'motor' },
    { n: 'Junta do Motor CG/Titan', sku: 'MT-045', sub: 'Junta do cabecote', pv: 18.00, pc: 9.50, q: 12, min: 4, marca: 'Vedamotors', comp: 'CG 160, Titan 160', cat: 'motor' },
    { n: 'Junta do Motor Levorin', sku: 'MT-046', sub: 'Junta do cabecote', pv: 22.00, pc: 12.00, q: 5, min: 2, marca: 'Levorin', comp: 'Universal', cat: 'motor' },
    { n: 'Junta do Cabecote Universal', sku: 'MT-047', sub: 'Junta do cabecote', pv: 15.00, pc: 7.00, q: 15, min: 5, marca: 'Vedamotors', comp: 'Universal', cat: 'motor' },

    // KITS DE RELACAO/TRACAO
    { n: 'Kit Tracao Honda CG 150', sku: 'TM-031', sub: 'Kit de relacao', pv: 180.00, pc: 110.00, q: 4, min: 2, marca: 'KMC', comp: 'CG 150', cat: 'transmissao' },
    { n: 'Kit Tracao Honda Bros', sku: 'TM-032', sub: 'Kit de relacao', pv: 195.00, pc: 125.00, q: 4, min: 2, marca: 'KMC', comp: 'Bros 160', cat: 'transmissao' },
    { n: 'Kit Tracao Yamaha Factor', sku: 'TM-033', sub: 'Kit de relacao', pv: 185.00, pc: 118.00, q: 3, min: 1, marca: 'DID', comp: 'Factor 150', cat: 'transmissao' },
    { n: 'Kit Tracao Yamaha YBR', sku: 'TM-034', sub: 'Kit de relacao', pv: 185.00, pc: 118.00, q: 3, min: 1, marca: 'DID', comp: 'YBR 125', cat: 'transmissao' },
    { n: 'Kit Tracao Titan 150', sku: 'TM-035', sub: 'Kit de relacao', pv: 185.00, pc: 115.00, q: 4, min: 2, marca: 'KMC', comp: 'Titan 150', cat: 'transmissao' },
    { n: 'Kit Tracao Twister', sku: 'TM-036', sub: 'Kit de relacao', pv: 230.00, pc: 152.00, q: 2, min: 1, marca: 'DID', comp: 'Twister 250', cat: 'transmissao' },
    { n: 'Kit Tracao Lander 250', sku: 'TM-037', sub: 'Kit de relacao', pv: 235.00, pc: 155.00, q: 2, min: 1, marca: 'DID', comp: 'Lander 250', cat: 'transmissao' },
    { n: 'Kit Tracao Fan 150', sku: 'TM-038', sub: 'Kit de relacao', pv: 175.00, pc: 108.00, q: 4, min: 2, marca: 'KMC', comp: 'Fan 150', cat: 'transmissao' },

    // AROS
    { n: 'Aro Dianteiro Universal', sku: 'RP-028', sub: 'Aros', pv: 240.00, pc: 170.00, q: 2, min: 1, marca: 'DID', comp: 'Universal dianteiro', cat: 'rodas-e-pneus' },
    { n: 'Aro Traseiro Universal', sku: 'RP-029', sub: 'Aros', pv: 260.00, pc: 185.00, q: 2, min: 1, marca: 'DID', comp: 'Universal traseiro', cat: 'rodas-e-pneus' },
    { n: 'Aro Bros', sku: 'RP-030', sub: 'Aros', pv: 280.00, pc: 195.00, q: 2, min: 1, marca: 'DID', comp: 'Bros 150/160', cat: 'rodas-e-pneus' },
    { n: 'Aro XRE', sku: 'RP-031', sub: 'Aros', pv: 320.00, pc: 220.00, q: 1, min: 1, marca: 'DID', comp: 'XRE 300', cat: 'rodas-e-pneus' },

    // CORRENTE
    { n: 'Corrente de Transmissao', sku: 'TM-039', sub: 'Correntes', pv: 65.00, pc: 38.00, q: 10, min: 3, marca: 'KMC', comp: 'Universal 428', cat: 'transmissao' },

    // OUTROS
    { n: 'Arruela Universal', sku: 'OT-001', sub: 'Arruelas', pv: 2.00, pc: 0.50, q: 50, min: 20, marca: 'Cofap', comp: 'Universal', cat: 'acessorios' },
    { n: 'Bengala Universal', sku: 'OT-002', sub: 'BEngalas', pv: 85.00, pc: 52.00, q: 2, min: 1, marca: 'Cofap', comp: 'Universal', cat: 'suspensao' },
    { n: 'Manopla Universal', sku: 'OT-003', sub: 'Manoplas', pv: 15.00, pc: 7.50, q: 18, min: 5, marca: 'ProTork', comp: 'Universal', cat: 'acessorios' },
    { n: 'Pedal Completo CG', sku: 'OT-004', sub: 'Pedais', pv: 48.00, pc: 28.00, q: 5, min: 2, marca: 'Cofap', comp: 'CG 160, Titan 160', cat: 'transmissao' },
    { n: 'Cilindro Mestre de Freio', sku: 'OT-005', sub: 'Cilindros', pv: 85.00, pc: 52.00, q: 3, min: 1, marca: 'Nissin', comp: 'CG 150, Titan, Fan', cat: 'freios' },
    { n: 'Cilindro Mestre de Freio Traseiro', sku: 'OT-006', sub: 'Cilindros', pv: 78.00, pc: 48.00, q: 2, min: 1, marca: 'Nissin', comp: 'Universal traseiro', cat: 'freios' },
  ];

  let idx = 0;
  for (const p of pecas) {
    const catId = cm[p.cat];
    if (!catId) continue;
    idx++;
    const destaque = idx % 3 === 0;
    const oferta = idx % 5 === 0;
    const precoOferta = oferta ? Math.round(p.pv * 0.85 * 100) / 100 : null;
    await prisma.peca.upsert({
      where: { codigo: p.sku },
      update: {
        nome: p.n, precoVenda: p.pv, precoCusto: p.pc, quantidade: p.q,
        estoqueMinimo: p.min, vitrine: true, subcategoria: p.sub,
        marca: p.marca, compatibilidade: p.comp, categoriaId: catId,
        destaque, oferta, precoOferta,
      },
      create: {
        nome: p.n, codigo: p.sku, precoVenda: p.pv, precoCusto: p.pc,
        quantidade: p.q, estoqueMinimo: p.min, vitrine: true,
        subcategoria: p.sub, marca: p.marca, compatibilidade: p.comp,
        categoriaId: catId, destaque, oferta, precoOferta,
      },
    });
  }
  console.log(`\n${pecas.length} pecas criadas com sucesso!`);
  console.log('=============================');
  console.log('Logins:');
  console.log('  Dono:     lp070087@gmail.com / marquinho123');
  console.log('  Balcao:   balcao1@marquinho.com.br / marquinho123');
  console.log('  Mecanico: mecanico@marquinho.com.br / mecanico123');
  console.log('  Estoque:  estoque@marquinho.com.br / estoque123');
}

main().catch(e => { console.error('Erro no seed:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
