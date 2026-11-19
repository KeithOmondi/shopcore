import type { MetadataRoute } from 'next';

import { getCatalogue } from '@/lib/catalogue';
import { SITE_URL } from '@/lib/server-api';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cat = await getCatalogue().catch(() => null);
  const now = new Date();
  const fixed = ['', '/shop', '/categories', '/deals', '/help', '/terms', '/privacy'].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now }));
  if (!cat) return fixed;
  return [
    ...fixed,
    ...cat.categories.map((c) => ({ url: `${SITE_URL}/c/${c.handle}`, lastModified: now })),
    ...cat.products.map((p) => ({ url: `${SITE_URL}/p/${p.id}`, lastModified: now })),
  ];
}
