import { atendimentoDemo } from '@/lib/atendimento-demo';
import { demoPerfil } from '@/lib/atendimento-demo-perfil';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Atendimento from '@/components/atendimento/Atendimento';

export default async function RecebimentoPage() {
  if (atendimentoDemo()) {
    if (await demoPerfil() !== 'DONA') redirect('/balcao/atendimento');
    return <Atendimento modo="caixa" podeReceber />;
  }
  const session = await requireAuth(['BALCAO', 'DONO']);
  if (session.role !== 'DONO' && session.tipoBalcao !== 'SERVICOS') redirect('/balcao');
  return <Atendimento modo="caixa" podeReceber />;
}
