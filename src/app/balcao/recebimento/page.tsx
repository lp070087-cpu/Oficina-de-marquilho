import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Atendimento from '@/components/atendimento/Atendimento';

export default async function RecebimentoPage() {
  const session = await requireAuth(['BALCAO', 'DONO']);
  if (session.role !== 'DONO' && session.tipoBalcao !== 'SERVICOS') redirect('/balcao');
  return <Atendimento modo="caixa" podeReceber podeConfigurar={session.role === 'DONO'} />;
}
