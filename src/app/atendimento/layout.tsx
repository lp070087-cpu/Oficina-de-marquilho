import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { atendimentoMetadata } from '@/lib/atendimento-metadata';

export const metadata = atendimentoMetadata;

export default async function AtendimentoLoginLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role === 'BALCAO' && session.tipoBalcao === 'VENDA_LOJA') {
    redirect(session.trocarSenha ? '/trocar-senha' : '/balcao/atendimento');
  }

  return children;
}
