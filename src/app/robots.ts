import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/server-api';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/account', '/cart', '/checkout', '/order/', '/login', '/signup', '/forgot', '/search'] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
