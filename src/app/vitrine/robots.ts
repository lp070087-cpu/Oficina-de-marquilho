import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/vitrine/', disallow: ['/api/', '/dono/', '/balcao/', '/estoque/', '/oficina/', '/mecanico/'] },
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://marquinho.com.br'}/vitrine/sitemap.xml`,
  };
}
