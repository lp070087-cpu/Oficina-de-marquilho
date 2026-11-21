import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotaFiscalAtendimento from '@/components/atendimento/NotaFiscalAtendimento';
import { atendimentoMetadata } from '@/lib/atendimento-metadata';

export const metadata = atendimentoMetadata;

// Tela de Nota Fiscal do Atendimento (cópia separada; o Painel da DONA não é alterado).
export default async function AtendimentoNFManualPage() {
  const session = await requireAuth(['BALCAO'], '/atendimento');
  if (session.tipoBalcao !== 'VENDA_LOJA') redirect('/balcao');
  return <NotaFiscalAtendimento />;
}
