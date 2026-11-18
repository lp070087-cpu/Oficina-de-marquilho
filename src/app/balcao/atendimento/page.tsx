import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Atendimento from '@/components/atendimento/Atendimento';
import { atendimentoMetadata } from '@/lib/atendimento-metadata';

export const metadata = atendimentoMetadata;

export default async function AtendimentoPage() {
  const session = await requireAuth(['BALCAO'], '/atendimento');
  if (session.tipoBalcao !== 'VENDA_LOJA') redirect('/balcao');
  return <Atendimento modo="atendimento" podeReceber={false} />;
}
