// POST /api/pecas/batch — Busca múltiplas peças por código, código de barras e EAN
// Substitui N requisições individuais por 1 única consulta batch
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // C9 — Autenticação obrigatória (antes ausente — endpoint público expunha dados de peças)
    const session = await getSession();
    if (!session || !['DONO', 'BALCAO', 'ESTOQUE'].includes(session.role)) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { codigos = [], codigosBarras = [], eans = [] } = body;

    if (codigos.length === 0 && codigosBarras.length === 0 && eans.length === 0) {
      return NextResponse.json({ encontrados: [], mapCodigo: {}, mapBarras: {}, mapEan: {} });
    }

    // Limita para segurança (payloads muito grandes)
    const MAX = 5000;
    const codigosSlice = codigos.slice(0, MAX).filter(Boolean);
    const barrasSlice = codigosBarras.slice(0, MAX).filter(Boolean);
    const eansSlice = eans.slice(0, MAX).filter(Boolean);

    // 2 queries em paralelo (codigo + codigoBarras)
    // EAN não tem coluna dedicada no schema — é mapeado como codigoBarras
    const [porCodigo, porBarras] = await Promise.all([
      codigosSlice.length > 0
        ? prisma.peca.findMany({
            where: { codigo: { in: codigosSlice } },
            select: { id: true, codigo: true, codigoBarras: true, nome: true, quantidade: true, quantidadeLoja: true },
          })
        : Promise.resolve([]),
      barrasSlice.length > 0 || eansSlice.length > 0
        ? prisma.peca.findMany({
            where: { codigoBarras: { in: [...barrasSlice, ...eansSlice] } },
            select: { id: true, codigo: true, codigoBarras: true, nome: true, quantidade: true, quantidadeLoja: true },
          })
        : Promise.resolve([]),
    ]);

    // Mapas para lookup O(1) no cliente
    const mapCodigo: Record<string, any> = {};
    for (const p of porCodigo) mapCodigo[p.codigo] = p;

    const mapBarras: Record<string, any> = {};
    for (const p of porBarras) if (p.codigoBarras) mapBarras[p.codigoBarras] = p;

    // Combina todos os encontrados (sem duplicatas por id)
    const encontrados = new Map<string, any>();
    for (const p of porCodigo) encontrados.set(p.id, p);
    for (const p of porBarras) if (!encontrados.has(p.id)) encontrados.set(p.id, p);

    return NextResponse.json({
      encontrados: Array.from(encontrados.values()),
      mapCodigo,
      mapBarras,
      total: encontrados.size,
    });
  } catch (error: any) {
    // C9 — Mensagem genérica para o cliente (sem expor erro interno)
    console.error('[batch] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
