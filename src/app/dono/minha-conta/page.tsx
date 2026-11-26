import { requireAuth } from '@/lib/auth';
import FormulariosConta from './FormulariosConta';

export default async function MinhaConta() {
  const dona = await requireAuth(['DONO']);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Minha conta</h1>
      <section className="card p-4 sm:p-6" aria-labelledby="dados-conta">
        <h2 id="dados-conta" className="text-base font-semibold text-slate-900">Dados da conta</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-slate-500">Nome cadastrado</dt>
            <dd className="mt-1 break-words font-medium text-slate-900">{dona.name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-slate-500">E-mail atual</dt>
            <dd className="mt-1 break-all font-medium text-slate-900">{dona.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Perfil de acesso</dt>
            <dd className="mt-1 font-medium text-slate-900">Administradora</dd>
          </div>
        </dl>
      </section>
      <FormulariosConta email={dona.email} />
    </div>
  );
}
