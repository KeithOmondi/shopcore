'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Price, ProductImage } from '@/components/ProductCard';
import { useToast, useWishlist, useCart } from '@/components/providers';
import { loadSlims } from '@/lib/orders';
import type { Slim } from '@/lib/types';

export default function WishlistPage() {
  const { ids, toggle } = useWishlist();
  const cart = useCart();
  const { toast } = useToast();
  const [slims, setSlims] = useState<Record<string, Slim>>({});
  const [loaded, setLoaded] = useState(false);
  const key = [...ids].sort().join(',');
  useEffect(() => { let live = true; loadSlims([...ids]).then((s) => { if (live) { setSlims(s); setLoaded(true); } }); return () => { live = false; }; }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = [...ids].map((id) => slims[id]).filter(Boolean) as Slim[];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Wishlist</h1>
      {!loaded && ids.size > 0 && <div className="skeleton h-40" aria-busy="true" />}
      {ids.size === 0 && <div className="card p-10 text-center"><h2 className="text-lg font-bold">Nothing saved yet</h2><p className="mt-1 text-sm text-muted">Tap the heart on a product to keep it here.</p><Link href="/shop" className="btn btn-primary mt-5">Browse products</Link></div>}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => (
          <li key={p.id} className="card flex gap-3 p-3">
            <Link href={`/p/${p.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white"><ProductImage src={p.image} alt={p.name} /></Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link href={`/p/${p.id}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand">{p.name}</Link>
              <Price cents={p.priceCents} listCents={p.listPriceCents} />
              <div className="mt-auto flex gap-2 pt-1">
                {p.inStock ? <button className="btn btn-primary !min-h-9 !px-4 text-sm" onClick={() => { cart.add(p.id, 1); toast('Added to your cart'); }}>Add to cart</button> : <span className="self-center text-xs font-semibold text-danger">Out of stock</span>}
                <button className="btn btn-light !min-h-9 !px-4 text-sm" onClick={() => void toggle(p.id)}>Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
