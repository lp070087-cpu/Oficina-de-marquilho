import { cookies } from 'next/headers';

export type DemoPerfil = 'ATENDENTE' | 'DONA';

// Fora daqui o cookie não tem efeito: só é lido nos ramos protegidos por atendimentoDemo().
export async function demoPerfil(): Promise<DemoPerfil> {
  return (await cookies()).get('demo-perfil')?.value === 'DONA' ? 'DONA' : 'ATENDENTE';
}
