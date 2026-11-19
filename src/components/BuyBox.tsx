'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Icon } from './icons';
import { MAX_QTY, useCart, useToast } from './providers';
import { WishlistButton } from './WishlistButton';

export interface Mate { id: string; options: Record<string, string>; inStock: boolean }
export interface OptionDef { key: string; label: string; values: string[] }

/** Size, colour, storage… Each combination is its own product, so choosing one opens that product. */
export function BuyBox({ id, name, inStock, available, mates, options, current }: { id: string; name: string; inStock: boolean; available: number; mates: Mate[]; options: OptionDef[]; current: Record<string, string> }) {
  const router = useRouter();
  const cart = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const max = Math.max(1, Math.min(MAX_QTY, available || 1));

  const choose = (key: string, value: string) => {
    // The product that has this value and agrees with the other choices; if there is none, the closest one that is in stock.
    const wanted = { ...current, [key]: value };
    const fit = (m: Mate) => Object.entries(wanted).filter(([k, v]) => m.options[k] === v).length;
    const pool = mates.filter((m) => m.options[key] === value);
    const best = [...pool].sort((a, b) => fit(b) - fit(a) || Number(b.inStock) - Number(a.inStock))[0];
    if (best && best.id !== id) router.replace(`/p/${best.id}`, { scroll: false });
  };
  const hasCombo = (key: string, value: string) => mates.some((m) => m.options[key] === value && m.inStock);

  const inCart = cart.lines.find((l) => l.id === id)?.qty ?? 0;
  const add = () => {
    if (inCart + qty > max) { toast(`Only ${max} available`, 'error'); return false; }
    cart.add(id, qty);
    return true;
  };

  return (
    <div className="space-y-5">
      {options.map((o) => (
        <fieldset key={o.key}>
          <legend className="mb-2 text-sm font-bold text-ink">{o.label}: <span className="font-semibold text-body">{current[o.key]}</span></legend>
          <div className="flex flex-wrap gap-2">
            {o.values.map((v) => {
              const on = current[o.key] === v;
              const ok = hasCombo(o.key, v);
              return (
                <button key={v} type="button" aria-pressed={on} onClick={() => choose(o.key, v)}
                  className={`min-h-10 min-w-12 rounded-full border px-4 text-sm font-semibold transition ${on ? 'border-brand bg-brand-tint text-brand' : 'border-border bg-white text-ink hover:border-brand'} ${!ok && !on ? 'opacity-50' : ''}`}>
                  {v}{!ok && !on ? <span className="sr-only"> (out of stock)</span> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {inStock ? (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-success"><Icon name="check" size={18} /> In stock{available > 0 && available <= 5 ? ` · only ${available} left` : ''}</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-border bg-white" role="group" aria-label="Quantity">
              <button type="button" className="grid h-12 w-12 place-items-center disabled:opacity-40" aria-label="One fewer" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Icon name="minus" size={18} /></button>
              <output className="w-8 text-center font-bold text-ink" aria-live="polite">{qty}</output>
              <button type="button" className="grid h-12 w-12 place-items-center disabled:opacity-40" aria-label="One more" disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))}><Icon name="plus" size={18} /></button>
            </div>
            <button type="button" className="btn btn-primary flex-1 sm:flex-none sm:px-8" onClick={() => { if (add()) toast('Added to your cart'); }}><Icon name="cart" size={20} /> Add to cart</button>
            <WishlistButton id={id} name={name} label />
          </div>
          <button type="button" className="btn btn-light w-full sm:w-auto sm:px-8" onClick={() => { if (add()) router.push('/cart'); }}>Buy now</button>
          {inCart > 0 && <p className="text-sm text-muted">{inCart} already in your cart. <Link href="/cart" className="font-bold text-brand hover:underline">View cart</Link></p>}
        </>
      ) : (
        <div className="space-y-3">
          <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">Out of stock right now</p>
          <WishlistButton id={id} name={name} label />
        </div>
      )}

      <ul className="space-y-2 border-t border-line pt-4 text-sm">
        <li className="flex gap-3"><Icon name="delivery" size={20} className="shrink-0 text-brand" /> Delivered to your area. You’ll see the fee at checkout.</li>
        <li className="flex gap-3"><Icon name="mpesa" size={20} className="shrink-0 text-brand" /> Pay with M-Pesa, or cash when it arrives.</li>
        <li className="flex gap-3"><Icon name="returns" size={20} className="shrink-0 text-brand" /> Easy returns from your orders page.</li>
      </ul>
    </div>
  );
}
