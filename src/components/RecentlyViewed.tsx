'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { kes } from '@/lib/format';
import { loadSlims } from '@/lib/orders';
import type { Slim } from '@/lib/types';

import { ProductImage } from './ProductCard';
import { ScrollRow } from './Rows';

const KEY = 'shopcore.recent.v1';
const read = (): string[] => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; } };

/** The last products the visitor looked at. Kept in the browser only. Pass `current` on a product page to record it. */
export function RecentlyViewed({ current }: { current?: string }) {
  const [items, setItems] = useState<Slim[]>([]);
  useEffect(() => {
    let alive = true;
    const ids = read();
    if (current) { try { localStorage.setItem(KEY, JSON.stringify([current, ...ids.filter((i) => i !== current)].slice(0, 12))); } catch { /* storage may be off */ } }
    const show = ids.filter((i) => i !== current).slice(0, 10);
    if (!show.length) return;
    void loadSlims(show).then((m) => { if (alive) setItems(show.map((i) => m[i]).filter((s): s is Slim => !!s)); });
    return () => { alive = false; };
  }, [current]);
  if (!items.length) return null;
  return (
    <section aria-labelledby="recent">
      <h2 id="recent" className="mb-3 text-xl font-extrabold">Recently viewed</h2>
      <ScrollRow label="Recently viewed">
        {items.map((s) => (
          <li key={s.id} className="w-36 shrink-0 snap-start sm:w-40">
            <Link href={`/p/${s.id}`} className="card block overflow-hidden p-2 hover:shadow-lg">
              <div className="aspect-square"><ProductImage src={s.image} alt={s.name} /></div>
              <p className="mt-2 line-clamp-2 text-xs font-medium text-ink">{s.name}</p>
              <p className="text-sm font-extrabold text-ink">{kes(s.priceCents)}</p>
            </Link>
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
