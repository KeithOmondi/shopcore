/** Banners carry app paths (/product/<id>, /categories/<handle>). On the website they are these addresses. */
export function bannerHref(link: string): string | null {
  if (!link) return null;
  const product = /^\/product\/([\w-]+)$/.exec(link);
  if (product) return `/p/${product[1]}`;
  const category = /^\/categories\/([\w-]+)$/.exec(link);
  if (category) return `/c/${category[1]}`;
  if (link === '/deals' || link === '/home/deals' || link === '/collections/sale') return '/deals';
  if (link === '/collections/new') return '/shop?sort=new';
  if (link === '/' || link === '/terms' || link === '/privacy') return link;
  return null;
}
