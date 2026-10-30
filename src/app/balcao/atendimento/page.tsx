import { atendimentoDemo } from '@/lib/atendimento-demo';
import { demoPerfil } from '@/lib/atendimento-demo-perfil';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Atendimento from '@/components/atendimento/Atendimento';

export default async function AtendimentoPage() {
  if (atendimentoDemo()) {
    if (await demoPerfil() === 'DONA') redirect('/balcao/recebimento');
    return <Atendimento modo="atendimento" podeReceber={false} />;
  }
  const session = await requireAuth(['BALCAO']);
  if (session.tipoBalcao !== 'VENDA_LOJA') redirect('/balcao');
  return <Atendimento modo="atendimento" podeReceber={false} />;
}
