import { redirect } from 'next/navigation';
import { getSession, roleToPath } from '@/lib/auth';
import TrocarSenhaForm from '@/components/TrocarSenhaForm';

export default async function TrocarSenhaPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (!session.trocarSenha) redirect(roleToPath(session.role, session.tipoBalcao));
  return <TrocarSenhaForm />;
}
