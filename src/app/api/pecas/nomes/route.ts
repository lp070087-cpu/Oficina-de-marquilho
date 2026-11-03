import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sugerirNomes } from '@/lib/nomes-pecas';

// Revisão de nomes do Estoque (somente DONA). GET lista sugestões e o histórico;
// POST grava apenas as alterações aprovadas, com o nome anterior e o novo para auditoria.
const TIPO_AUDITORIA = 'PRODUTO_NOME_CORRIGIDO';

export async function GET() {
  const s = await getSession();
  if (s?.role !== 'DONO') return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const [pecas, historico] = await Promise.all([
    prisma.peca.findMany({ where: { ativo: true }, select: { id: true, nome: true, codigo: true, marca: true } }),
    prisma.eventoSistema.findMany({ where: { tipo: TIPO_AUDITORIA }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);
  return NextResponse.json({
    sugestoes: sugerirNomes(pecas),
    historico: historico.map(h => { try { return { id: h.id, pecaId: h.entidadeId, createdAt: h.createdAt, ...JSON.parse(h.payload || '{}') }; } catch { return { id: h.id, pecaId: h.entidadeId, createdAt: h.createdAt }; } }),
  });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (s?.role !== 'DONO') return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const alteracoes = Array.isArray(b.alteracoes) ? b.alteracoes : [];
  if (!alteracoes.length || alteracoes.length > 300) return NextResponse.json({ error: 'Selecione de 1 a 300 nomes' }, { status: 400 });
  for (const a of alteracoes) {
    if (typeof a?.id !== 'string' || typeof a?.de !== 'string' || typeof a?.para !== 'string') return NextResponse.json({ error: 'Alteracao invalida' }, { status: 400 });
    a.para = a.para.replace(/\s+/g, ' ').trim();
    if (!a.para || a.para.length > 200) return NextResponse.json({ error: 'Nome novo invalido' }, { status: 400 });
  }
  const resultado = await prisma.$transaction(async tx => {
    const aplicadas: string[] = [], ignoradas: string[] = [];
    for (const a of alteracoes) {
      if (a.para === a.de) { ignoradas.push(a.id); continue; }
      // Só altera se o nome ainda for o que a DONA revisou (evita sobrescrever outra edição).
      const r = await tx.peca.updateMany({ where: { id: a.id, nome: a.de }, data: { nome: a.para } });
      if (r.count !== 1) { ignoradas.push(a.id); continue; }
      await tx.eventoSistema.create({ data: { tipo: TIPO_AUDITORIA, origem: 'ESTOQUE', entidadeTipo: 'Peca', entidadeId: a.id, usuarioId: s.id, payload: JSON.stringify({ anterior: a.de, novo: a.para, usuario: s.name }), processado: true, processadoEm: new Date() } });
      aplicadas.push(a.id);
    }
    return { aplicadas, ignoradas };
  }, { maxWait: 10000, timeout: 30000 });
  return NextResponse.json(resultado);
}
