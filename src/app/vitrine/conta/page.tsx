import { redirect } from 'next/navigation';

/**
 * Rota legada — os orçamentos do cliente foram consolidados no perfil
 * (/vitrine/perfil, tab "Orçamentos"). Redireciona para manter URLs antigas.
 */
export default function ContaPage() {
  redirect('/vitrine/perfil');
}
