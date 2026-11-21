import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NFManualPage from '@/app/dono/nf-manual/page';
import { atendimentoMetadata } from '@/lib/atendimento-metadata';

export const metadata = atendimentoMetadata;

// Mesma tela de Nota Fiscal manual do Painel da DONA, disponível no Atendimento.
export default async function AtendimentoNFManualPage() {
  const session = await requireAuth(['BALCAO'], '/atendimento');
  if (session.tipoBalcao !== 'VENDA_LOJA') redirect('/balcao');
  return <NFManualPage />;
}
