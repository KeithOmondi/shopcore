import type { MetadataRoute } from 'next';

import { getCatalogue, getPages } from '@/lib/catalogue';
import { SITE_URL } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cat, pages] = await Promise.all([getCatalogue().catch(() => null), getPages()]);
  const now = new Date();
  const fixed = ['', '/shop', '/categories', '/offers', '/deals', '/help', '/terms', '/privacy'].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now }));
  const info = pages.filter((p) => !['/terms', '/privacy'].includes(p.slug)).map((p) => ({ url: `${SITE_URL}/info/${p.slug.replace(/^[/]+/, '')}`, lastModified: now }));
  if (!cat) return [...fixed, ...info];
  return [
    ...fixed,
    ...info,
    ...cat.categories.map((c) => ({ url: `${SITE_URL}/c/${c.handle}`, lastModified: now })),
    ...cat.products.map((p) => ({ url: `${SITE_URL}/p/${p.id}`, lastModified: now })),
  ];
}
