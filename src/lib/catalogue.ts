import 'server-only';

import { publicGet } from './server-api';
import type { Catalogue, Category, HomeData, Product, ProductReviews, Slim } from './types';

export const PAGE_SIZE = 24;

export const getCatalogue = () => publicGet<Catalogue>('/v1/storefront/catalogue', 60);
export const getHome = () => publicGet<HomeData>('/v1/storefront/home?platform=web', 60).catch((): HomeData => ({ banners: [], sections: [] }));
export const getReviews = (id: string) => publicGet<ProductReviews>(`/v1/storefront/products/${id}/reviews`, 120).catch((): ProductReviews => ({ count: 0, average: 0, split: [0, 0, 0, 0, 0], items: [] }));

/** The shop lists one card per item: the cheapest in-stock choice of a product that comes in several variants. */
export function cards(products: Product[]): Product[] {
  const groups = new Map<string, Product[]>();
  const out: Product[] = [];
  for (const p of products) {
    if (!p.groupId) { out.push(p); continue; }
    const g = groups.get(p.groupId);
    if (g) g.push(p); else groups.set(p.groupId, [p]);
  }
  for (const mates of groups.values()) {
    const pool = mates.some((m) => m.inStock) ? mates.filter((m) => m.inStock) : mates;
    const rep = pool.reduce((a, b) => (b.priceCents < a.priceCents ? b : a));
    out.push({
      ...rep,
      inStock: mates.some((m) => m.inStock),
      rating: mates.reduce<number | null>((r, m) => (m.rating !== null && (r === null || m.rating > r) ? m.rating : r), null),
      reviews: mates.reduce((n, m) => n + m.reviews, 0),
    });
  }
  return out;
}

/** True when the choices of a product are not all the same price (so the card says "From"). */
export const priceVaries = (products: Product[], p: Product) => !!p.groupId && new Set(products.filter((x) => x.groupId === p.groupId).map((x) => x.priceCents)).size > 1;

export const slim = (p: Product): Slim => ({ id: p.id, name: p.name, brand: p.brand, priceCents: p.priceCents, listPriceCents: p.listPriceCents, image: p.images[0] ?? null, inStock: p.inStock, available: p.available, options: p.options });

export interface Query {
  q?: string; category?: string; brands?: string[]; sub?: string; min?: number; max?: number; inStock?: boolean; sale?: boolean;
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'new' | 'rating'; page?: number;
}

function score(p: Product, cat: Category | undefined, terms: string[]): number {
  const hay = {
    name: p.name.toLowerCase(), brand: (p.brand ?? '').toLowerCase(), sub: p.subcategory.toLowerCase(), cat: (cat?.name ?? '').toLowerCase(),
    desc: p.description.toLowerCase(), spec: Object.values(p.specs).join(' ').toLowerCase(),
  };
  let total = 0;
  for (const t of terms) {
    let s = 0;
    if (hay.name.includes(t)) s += 6;
    if (hay.brand.includes(t)) s += 5;
    if (hay.sub.includes(t)) s += 4;
    if (hay.cat.includes(t)) s += 3;
    if (hay.spec.includes(t)) s += 2;
    if (hay.desc.includes(t)) s += 1;
    if (!s) return 0; // every word has to match something
    total += s;
  }
  return total;
}

export interface Listing {
  items: Product[]; total: number; page: number; pages: number;
  brands: { name: string; count: number }[]; subs: { name: string; count: number }[]; priceMin: number; priceMax: number; category?: Category;
}

export function list(cat: Catalogue, q: Query): Listing {
  const category = q.category ? cat.categories.find((c) => c.handle === q.category) : undefined;
  const byCat = new Map(cat.categories.map((c) => [c.id, c]));
  const terms = (q.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  let base = cat.products;
  if (category) base = base.filter((p) => p.categoryId === category.id);
  const scores = new Map<string, number>();
  if (terms.length) {
    base = base.filter((p) => {
      const s = score(p, p.categoryId ? byCat.get(p.categoryId) : undefined, terms);
      if (s) scores.set(p.id, s);
      return s > 0;
    });
  }
  if (q.sale) base = base.filter((p) => p.onSale);
  const baseCards = cards(base);
  const priceMin = baseCards.length ? Math.min(...baseCards.map((p) => p.priceCents)) : 0;
  const priceMax = baseCards.length ? Math.max(...baseCards.map((p) => p.priceCents)) : 0;

  // The counts beside each filter are taken before that filter is applied, so a person can see what else is on offer.
  const count = (arr: Product[], key: (p: Product) => string) => {
    const m = new Map<string, number>();
    for (const p of arr) { const k = key(p); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };
  const wanted = new Set((q.brands ?? []).map((b) => b.toLowerCase()));
  let items = baseCards;
  if (q.sub) items = items.filter((p) => p.subcategory === q.sub);
  const brands = count(items, (p) => p.brand ?? '');
  if (wanted.size) items = items.filter((p) => wanted.has((p.brand ?? '').toLowerCase()));
  const subs = count(baseCards.filter((p) => !wanted.size || wanted.has((p.brand ?? '').toLowerCase())), (p) => p.subcategory);
  if (q.min !== undefined) items = items.filter((p) => p.priceCents >= q.min! * 100);
  if (q.max !== undefined) items = items.filter((p) => p.priceCents <= q.max! * 100);
  if (q.inStock) items = items.filter((p) => p.inStock);

  const sort = q.sort ?? (terms.length ? 'relevance' : 'new');
  const order: Record<string, (a: Product, b: Product) => number> = {
    relevance: (a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || b.reviews - a.reviews,
    'price-asc': (a, b) => a.priceCents - b.priceCents,
    'price-desc': (a, b) => b.priceCents - a.priceCents,
    new: (a, b) => Number(b.isNew) - Number(a.isNew) || (b.id < a.id ? -1 : 1),
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews,
  };
  items = [...items].sort(order[sort] ?? order.new!);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, q.page ?? 1), pages);
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: items.length, page, pages, brands, subs, priceMin, priceMax, category };
}

export interface Bundle { id: string; name: string; type: string; description: string; items: { productId: string; quantity: number }[]; priceCents: number; percent: number; minItems: number }
export interface Programmes {
  loyalty: { active: boolean; earnRate: number; pointValueCents: number; minOrderCents: number; minRedeem: number; expiry: string; bonuses: { id: string; name: string; sub: string; on: boolean }[] };
  referral: { active: boolean; advocate: string; friend: string; minSpendCents: number; message: string };
}
export interface AppStatus { maintenance: boolean; message: string; returnAt: string | null }

export const getBundles = () => publicGet<{ items: Bundle[] }>('/v1/storefront/bundles', 60).then((r) => r.items).catch((): Bundle[] => []);
export const getProgrammes = () => publicGet<Programmes>('/v1/storefront/programmes', 120).catch(() => null);
export const getPages = () => publicGet<{ items: { title: string; slug: string }[] }>('/v1/storefront/pages', 300).then((r) => r.items).catch(() => [] as { title: string; slug: string }[]);
/** Is the shop closed for maintenance? If the API can't be reached the shop is treated as open, so a hiccup never hides the site. */
export const getAppStatus = () => publicGet<AppStatus>('/v1/app/status', 15).catch((): AppStatus => ({ maintenance: false, message: '', returnAt: null }));
