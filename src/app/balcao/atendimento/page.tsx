import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Atendimento from '@/components/atendimento/Atendimento';

export default async function AtendimentoPage() {
  const session = await requireAuth(['BALCAO']);
  if (session.tipoBalcao !== 'VENDA_LOJA') redirect('/balcao');
  return <Atendimento modo="atendimento" podeReceber={false} />;
}
