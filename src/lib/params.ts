import type { Query } from './catalogue';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => { const n = Number(one(v)); return one(v) !== undefined && one(v) !== '' && Number.isFinite(n) && n >= 0 ? n : undefined; };

const SORTS = ['relevance', 'price-asc', 'price-desc', 'new', 'rating'] as const;

export function parseQuery(sp: SP, fixed: Partial<Query> = {}): Query {
  const brand = sp.brand;
  const sort = one(sp.sort);
  return {
    q: one(sp.q)?.slice(0, 80),
    brands: (Array.isArray(brand) ? brand : brand ? [brand] : []).slice(0, 12),
    sub: one(sp.sub) || undefined,
    min: num(sp.min), max: num(sp.max),
    inStock: one(sp.stock) === '1',
    sort: (SORTS as readonly string[]).includes(sort ?? '') ? (sort as Query['sort']) : undefined,
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
    ...fixed,
  };
}

/** The current filters as a web address, with some of them changed (`undefined` removes one). */
export function href(base: string, sp: SP, change: Record<string, string | string[] | undefined> = {}): string {
  const out = new URLSearchParams();
  const merged: SP = { ...sp, ...change };
  if (!('page' in change)) delete merged.page; // changing a filter starts again from page 1
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === '') continue;
    for (const x of Array.isArray(v) ? v : [v]) out.append(k, x);
  }
  const s = out.toString();
  return s ? `${base}?${s}` : base;
}
