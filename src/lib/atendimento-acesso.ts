import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { OperacaoErro } from '@/lib/operacao-pedidos';

export const SENHA_MINIMA = 8;
const BLOQUEIO_SEM_PRAZO = new Date('2100-01-01T00:00:00Z');
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

export async function validarSenhaAtendente(senha: string, excetoId?: string) {
  if (senha.length < SENHA_MINIMA) throw new OperacaoErro(`A senha deve ter ao menos ${SENHA_MINIMA} caracteres`);
  for (const u of await atendentes(excetoId)) if (await bcrypt.compare(senha, u.password)) throw new OperacaoErro('Senha ja usada por outro atendente', 409);
}

export async function definirSenhaAtendente(id: string, senha: string, forcarTroca = false) {
  const alvo = await prisma.user.findUnique({ where: { id } });
  if (!alvo || alvo.role !== 'BALCAO' || alvo.tipoBalcao !== 'VENDA_LOJA' || alvo.deletedAt) throw new OperacaoErro('Atendente nao encontrado', 404);
  await validarSenhaAtendente(senha, id);
  await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(senha, 12), passwordUpdatedAt: new Date(), mustChangePassword: forcarTroca, active: true, failedLoginAttempts: 0, lockedUntil: null } });
}

// Troca feita pelo próprio funcionário no primeiro acesso.
export async function trocarSenhaObrigatoria(id: string, senhaAtual: string, novaSenha: string) {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u || !(await bcrypt.compare(senhaAtual, u.password))) throw new OperacaoErro('Senha atual incorreta', 401);
  if (novaSenha.length < SENHA_MINIMA) throw new OperacaoErro(`A senha deve ter ao menos ${SENHA_MINIMA} caracteres`);
  if (novaSenha === senhaAtual) throw new OperacaoErro('A nova senha precisa ser diferente da atual');
  if (u.role === 'BALCAO' && u.tipoBalcao === 'VENDA_LOJA') await validarSenhaAtendente(novaSenha, id);
  return prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(novaSenha, 12), passwordUpdatedAt: new Date(), mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null } });
}

// O bloqueio vale até a DONA desbloquear; a sessão aberta cai em getSession.
export async function bloquearAtendente(id: string, bloqueado: boolean) {
  const alvo = await prisma.user.findUnique({ where: { id }, select: { role: true, tipoBalcao: true, deletedAt: true } });
  if (!alvo || alvo.role !== 'BALCAO' || alvo.tipoBalcao !== 'VENDA_LOJA' || alvo.deletedAt) throw new OperacaoErro('Atendente nao encontrado', 404);
  await prisma.user.update({ where: { id }, data: { lockedUntil: bloqueado ? BLOQUEIO_SEM_PRAZO : null, failedLoginAttempts: 0 } });
}

export async function revogarAtendente(id: string) {
  const alvo = await prisma.user.findUnique({ where: { id }, select: { role: true, tipoBalcao: true } });
  if (!alvo || alvo.role !== 'BALCAO' || alvo.tipoBalcao !== 'VENDA_LOJA') throw new OperacaoErro('Atendente nao encontrado', 404);
  await prisma.user.update({ where: { id }, data: { active: false, passwordUpdatedAt: new Date() } });
}
