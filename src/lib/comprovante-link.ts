import { SignJWT, jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/jwt-secret';
import prisma from '@/lib/prisma';

// Link do comprovante enviado ao cliente: token assinado no servidor, que identifica só a
// venda e expira. Sem link permanente e sem dados do cliente na URL.
export const VALIDADE_LINK_DIAS = 7;
const FINALIDADE = 'comprovante';

export async function assinarLinkComprovante(vendaId: string) {
  const expiraEm = new Date(Date.now() + VALIDADE_LINK_DIAS * 86400_000);
  const token = await new SignJWT({ v: vendaId, f: FINALIDADE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiraEm.getTime() / 1000))
    .sign(JWT_SECRET);
  return { token, expiraEm };
}

export async function lerLinkComprovante(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return payload.f === FINALIDADE && typeof payload.v === 'string' ? payload.v : null;
  } catch { return null; }
}

/** Pedido + venda no formato que o comprovante espera. */
export async function carregarComprovante(vendaId: string) {
  const venda = await prisma.venda.findUnique({
    where: { id: vendaId },
    include: { itens: { include: { peca: { select: { nome: true, codigo: true } } } }, pagamentos: true },
  });
  if (!venda) return null;
  const pedido = await prisma.pedido.findUnique({ where: { id: venda.pedidoId }, include: { itens: { include: { peca: { select: { nome: true, codigo: true } } } } } });
  if (!pedido) return null;
  const [servicos, ordemServico] = pedido.ordemServicoId ? await Promise.all([
    prisma.servicoOrdem.findMany({ where: { ordemServicoId: pedido.ordemServicoId } }),
    prisma.ordemServico.findUnique({ where: { id: pedido.ordemServicoId }, select: { numero: true, modeloMoto: true, placaMoto: true, anoMoto: true, kmAtual: true, descricaoProblema: true } }),
  ]) : [[], null];
  return { pedido: { ...pedido, servicos, ordemServico }, venda };
}

/** Telefone brasileiro em formato internacional para wa.me / API oficial (ou null). */
export function telefoneWhatsApp(telefone: unknown): string | null {
  let d = String(telefone ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}
