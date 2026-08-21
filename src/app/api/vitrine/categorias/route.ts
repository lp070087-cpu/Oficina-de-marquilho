import { NextResponse } from 'next/server';
import { getCategoriasVitrine } from '@/lib/vitrine-utils';

/**
 * GET — categorias da Vitrine PÚBLICA (menu + grid de categorias).
 *
 * FONTE ÚNICA DE VERDADE: delega para `getCategoriasVitrine()` em vitrine-utils.ts,
 * a MESMA função usada pelo Server Component da Home (/vitrine). Assim a Home e a
 * API nunca divergem. Regra: uma categoria aparece SE e SOMENTE SE tiver PELO MENOS
 * 1 produto visível (ativo && quantidadeLoja>0 && precoVenda>0).
 */
export async function GET() {
  try {
    const resultado = await getCategoriasVitrine();
    return NextResponse.json(resultado);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
