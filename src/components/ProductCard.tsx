import Link from 'next/link';

import { kes } from '@/lib/format';
import type { Product } from '@/lib/types';

import { Icon } from './icons';
import { QuickAdd } from './QuickAdd';
import { ScrollRow } from './Rows';
import { WishlistButton } from './WishlistButton';

export function Stars({ value, count, size = 16 }: { value: number | null; count?: number; size?: number }) {
  if (!value) return <span className="text-xs text-muted">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted" aria-label={`${value.toFixed(1)} out of 5 stars${count !== undefined ? `, ${count} reviews` : ''}`}>
      <Icon name="star" size={size} className="fill-warn text-warn" strokeWidth={1} />
      <b className="text-ink">{value.toFixed(1)}</b>
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

export function Price({ cents, listCents, from, large }: { cents: number; listCents?: number; from?: boolean; large?: boolean }) {
  const sale = listCents !== undefined && listCents > cents;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={`font-extrabold text-ink ${large ? 'text-3xl' : 'text-base'}`}>{from && <span className="mr-1 text-xs font-semibold text-muted">From</span>}{kes(cents)}</span>
      {sale && <span className={`text-muted line-through ${large ? 'text-lg' : 'text-xs'}`}>{kes(listCents)}</span>}
    </span>
  );
}

export function ProductImage({ src, alt, className = '' }: { src: string | null | undefined; alt: string; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-full w-full object-contain ${className}`} />
  ) : (
    <div className={`grid h-full w-full place-items-center text-border ${className}`} role="img" aria-label={`${alt}: no picture yet`}><Icon name="box" size={44} strokeWidth={1.2} /></div>
  );
}

export function ProductCard({ p, from }: { p: Product; from?: boolean }) {
  const off = p.onSale && p.listPriceCents > p.priceCents ? Math.round((1 - p.priceCents / p.listPriceCents) * 100) : 0;
  const low = p.inStock && p.available > 0 && p.available <= 5;
  return (
    <article className="group card relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/p/${p.id}`} className="block" aria-label={p.name}>
        <div className="relative aspect-square bg-white p-3">
          <ProductImage src={p.images[0]} alt={p.name} className="transition-transform duration-300 group-hover:scale-105" />
        </div>
      </Link>
      {off > 0 && <span className="absolute right-2 top-2 rounded-md bg-brand-tint px-1.5 py-0.5 text-xs font-extrabold text-brand">-{off}%</span>}
      {!off && p.isNew && <span className="absolute right-2 top-2 rounded-md bg-brand px-1.5 py-0.5 text-xs font-bold text-white">New</span>}
      <div className="absolute left-2 top-2 z-10"><WishlistButton id={p.id} name={p.name} /></div>
      <div className="flex flex-1 flex-col gap-1 p-3 pt-1">
        {p.brand && <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">{p.brand}</p>}
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-ink"><Link href={`/p/${p.id}`} className="after:absolute after:inset-x-0 after:top-0 after:h-[calc(100%-3.5rem)] after:content-[''] hover:text-brand" tabIndex={-1} aria-hidden>{p.name}</Link></h3>
        <Price cents={p.priceCents} listCents={p.listPriceCents} from={from} />
        <Stars value={p.rating} count={p.reviews} size={14} />
        {low && <p className="text-xs font-semibold text-danger">Only {p.available} left</p>}
        {!p.inStock && <p className="text-xs font-semibold text-danger">Out of stock</p>}
        {p.inStock && (
          <div className="mt-auto pt-2">
            {p.groupId ? <Link href={`/p/${p.id}`} className="btn btn-light relative z-10 min-h-10 w-full text-sm">Choose options</Link> : <QuickAdd id={p.id} name={p.name} available={p.available} />}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ items, varies }: { items: Product[]; varies?: Set<string> }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((p) => <li key={p.id} className="relative"><ProductCard p={p} from={varies?.has(p.groupId ?? '')} /></li>)}
    </ul>
  );
}

/** Cards in a sideways-scrolling row (home page, "you may also like"). */
export function ProductRow({ items, label, varies }: { items: Product[]; label: string; varies?: Set<string> }) {
  return (
    <ScrollRow label={label}>
      {items.map((p) => <li key={p.id} className="w-[10.5rem] shrink-0 snap-start sm:w-52"><ProductCard p={p} from={varies?.has(p.groupId ?? '')} /></li>)}
    </ScrollRow>
  );
}
