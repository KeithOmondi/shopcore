import Link from 'next/link';
import { Suspense } from 'react';

import { Filters, SortSelect } from './Filters';
import { ProductGrid } from './ProductCard';
import { list, priceVaries, type Query } from '@/lib/catalogue';
import { href } from '@/lib/params';
import type { Catalogue } from '@/lib/types';

type SP = Record<string, string | string[] | undefined>;

/** A page of products with filters, sorting and paging. Used by the shop, categories, search and deals. */
export function ListingView({ cat, query, base, sp, title, intro, empty }: { cat: Catalogue; query: Query; base: string; sp: SP; title: string; intro?: string; empty?: string }) {
  const l = list(cat, query);
  const varies = new Set(l.items.filter((p) => p.groupId && priceVaries(cat.products, p)).map((p) => p.groupId!));
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-sm text-muted">{intro}</p>}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <Suspense fallback={null}><Filters brands={l.brands} subs={l.subs} priceMin={l.priceMin} priceMax={l.priceMax} /></Suspense>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">{l.total} {l.total === 1 ? 'product' : 'products'}</p>
            <Suspense fallback={null}><SortSelect hasQuery={!!query.q} /></Suspense>
          </div>
          {l.items.length ? (
            <ProductGrid items={l.items} varies={varies} />
          ) : (
            <div className="card p-10 text-center">
              <h2 className="text-lg font-bold">Nothing found</h2>
              <p className="mt-1 text-sm text-muted">{empty ?? 'Try removing a filter or searching for something else.'}</p>
              <Link href={base} className="btn btn-light mt-5">Clear filters</Link>
            </div>
          )}
          {l.pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pages">
              {l.page > 1 ? <Link className="btn btn-light" rel="prev" href={href(base, sp, { page: String(l.page - 1) })}>Previous</Link> : <span className="btn btn-light" aria-disabled="true">Previous</span>}
              <span className="text-sm font-semibold text-ink">Page {l.page} of {l.pages}</span>
              {l.page < l.pages ? <Link className="btn btn-light" rel="next" href={href(base, sp, { page: String(l.page + 1) })}>Next</Link> : <span className="btn btn-light" aria-disabled="true">Next</span>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
