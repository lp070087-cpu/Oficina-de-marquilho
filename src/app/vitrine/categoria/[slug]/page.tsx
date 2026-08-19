import { redirect } from 'next/navigation';

/**
 * Rota legada — o menu e os links reais da Vitrine usam `/vitrine/catalogo?categoria=slug`.
 * Esta rota existia como página própria com busca morta e card antigo.
 * Redireciona para o catálogo para eliminar código/controles sem função.
 */
export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/vitrine/catalogo?categoria=${encodeURIComponent(slug)}`);
}
