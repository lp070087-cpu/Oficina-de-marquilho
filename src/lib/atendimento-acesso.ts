import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { OperacaoErro } from '@/lib/operacao-pedidos';

const SENHA_MINIMA = 8;
const atendentes = (excetoId?: string) => prisma.user.findMany({
  where: { role: 'BALCAO', tipoBalcao: 'VENDA_LOJA', active: true, deletedAt: null, ...(excetoId ? { id: { not: excetoId } } : {}) },
  take: 100,
});

// A entrada não pede e-mail: a senha identifica o atendente, por isso ela precisa ser única.
export async function localizarAtendente(senha: string) {
  const achados = [];
  for (const u of await atendentes()) if (await bcrypt.compare(senha, u.password)) achados.push(u);
  const agora = new Date();
  return achados.length === 1 && !(achados[0].lockedUntil && achados[0].lockedUntil > agora) ? achados[0] : null;
}

export async function definirSenhaAtendente(id: string, senha: string) {
  if (senha.length < SENHA_MINIMA) throw new OperacaoErro(`A senha deve ter ao menos ${SENHA_MINIMA} caracteres`);
  const alvo = await prisma.user.findUnique({ where: { id } });
  if (!alvo || alvo.role !== 'BALCAO' || alvo.tipoBalcao !== 'VENDA_LOJA' || alvo.deletedAt) throw new OperacaoErro('Atendente nao encontrado', 404);
  for (const u of await atendentes(id)) if (await bcrypt.compare(senha, u.password)) throw new OperacaoErro('Senha ja usada por outro atendente', 409);
  await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(senha, 12), passwordUpdatedAt: new Date(), active: true, failedLoginAttempts: 0, lockedUntil: null } });
}

export async function revogarAtendente(id: string) {
  const alvo = await prisma.user.findUnique({ where: { id }, select: { role: true, tipoBalcao: true } });
  if (!alvo || alvo.role !== 'BALCAO' || alvo.tipoBalcao !== 'VENDA_LOJA') throw new OperacaoErro('Atendente nao encontrado', 404);
  await prisma.user.update({ where: { id }, data: { active: false, passwordUpdatedAt: new Date() } });
}
