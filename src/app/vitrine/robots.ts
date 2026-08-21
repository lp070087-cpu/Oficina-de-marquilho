import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const storeDomain = process.env.NEXT_PUBLIC_STORE_DOMAIN || 'vitrine.marquinhomotopecas.com';
  return {
    rules: { userAgent: '*', allow: '/vitrine/', disallow: ['/api/', '/dono/', '/balcao/', '/estoque/', '/oficina/', '/mecanico/'] },
    sitemap: `https://${storeDomain}/vitrine/sitemap.xml`,
  };
}
