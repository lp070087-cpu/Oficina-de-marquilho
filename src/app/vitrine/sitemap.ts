import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const storeDomain = process.env.NEXT_PUBLIC_STORE_DOMAIN || 'vitrine.marquinhomotopecas.com';
  const baseUrl = `https://${storeDomain}`;

  const staticPages = [
    { url: `${baseUrl}/vitrine`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/vitrine/catalogo`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/vitrine/marcas`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/vitrine/promocoes`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/vitrine/carrinho`, lastModified: new Date(), changeFrequency: 'always' as const, priority: 0.6 },
  ];

  return [...staticPages];
}
