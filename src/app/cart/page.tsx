'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/icons';
import { Price, ProductImage } from '@/components/ProductCard';
import { MAX_QTY, useCart } from '@/components/providers';
import { kes } from '@/lib/format';
import { loadSlims } from '@/lib/orders';
import type { Slim } from '@/lib/types';

export default function CartPage() {
  const cart = useCart();
  const [slims, setSlims] = useState<Record<string, Slim> | null>(null);
  const idsKey = cart.lines.map((l) => l.id).join(',');
  useEffect(() => {
    if (!cart.ready) return;
    let live = true;
    loadSlims(cart.lines.map((l) => l.id)).then((s) => { if (live) setSlims(s); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready, idsKey]);

  // A product that is no longer sold is dropped from the cart.
  useEffect(() => {
    if (!slims) return;
    for (const l of cart.lines) if (!slims[l.id]) cart.remove(l.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slims]);

  const rows = useMemo(() => cart.lines.map((l) => ({ line: l, p: slims?.[l.id] })).filter((r) => r.p), [cart.lines, slims]);
  const subtotal = rows.reduce((n, r) => n + r.p!.priceCents * r.line.qty, 0);
  const blocked = rows.some((r) => !r.p!.inStock || r.line.qty > r.p!.available);

  if (!cart.ready || (cart.lines.length > 0 && !slims)) return <div className="space-y-3" aria-busy="true"><div className="skeleton h-8 w-40" /><div className="skeleton h-28" /><div className="skeleton h-28" /></div>;
  if (!rows.length) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-tint text-brand"><Icon name="cart" size={30} /></span>
        <h1 className="mt-4 text-2xl font-extrabold">Your cart is empty</h1>
        <p className="mt-1 text-sm text-muted">Find something you like and add it here.</p>
        <Link href="/shop" className="btn btn-primary mt-6">Start shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold sm:text-3xl">Your cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {rows.map(({ line, p }) => {
            const over = line.qty > p!.available;
            return (
              <li key={line.id} className="card flex gap-4 p-4">
                <Link href={`/p/${line.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white"><ProductImage src={p!.image} alt={p!.name} /></Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {p!.brand && <p className="text-xs font-semibold uppercase tracking-wide text-muted">{p!.brand}</p>}
                  <Link href={`/p/${line.id}`} className="line-clamp-2 font-semibold text-ink hover:text-brand">{p!.name}</Link>
                  {Object.keys(p!.options).length > 0 && <p className="text-xs text-muted">{Object.values(p!.options).join(' / ')}</p>}
                  {!p!.inStock ? <p className="text-sm font-semibold text-danger">Out of stock. Remove it to continue.</p> : over ? <p className="text-sm font-semibold text-danger">Only {p!.available} available</p> : null}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="inline-flex items-center rounded-full border border-border bg-white" role="group" aria-label={`Quantity of ${p!.name}`}>
                      <button className="grid h-10 w-10 place-items-center" aria-label="One fewer" onClick={() => cart.setQty(line.id, line.qty - 1)}><Icon name="minus" size={16} /></button>
                      <output className="w-7 text-center text-sm font-bold text-ink">{line.qty}</output>
                      <button className="grid h-10 w-10 place-items-center disabled:opacity-40" aria-label="One more" disabled={line.qty >= Math.min(MAX_QTY, p!.available)} onClick={() => cart.setQty(line.id, line.qty + 1)}><Icon name="plus" size={16} /></button>
                    </div>
                    <div className="text-right"><Price cents={p!.priceCents * line.qty} /></div>
                    <button className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-danger" onClick={() => cart.remove(line.id)}><Icon name="trash" size={16} /> Remove</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="text-lg font-extrabold">Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Items ({cart.count})</dt><dd className="font-semibold text-ink">{kes(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="text-muted">Worked out at checkout</dd></div>
          </dl>
          <div className="flex justify-between border-t border-line pt-3 text-base"><span className="font-bold text-ink">Total so far</span><span className="font-extrabold text-ink">{kes(subtotal)}</span></div>
          <Link href="/checkout" className={`btn btn-primary w-full ${blocked ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={blocked}>Checkout</Link>
          <Link href="/shop" className="block text-center text-sm font-bold text-brand hover:underline">Keep shopping</Link>
        </aside>
      </div>
    </div>
  );
}
