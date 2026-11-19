'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ApiError, get } from '@/lib/client';
import { dateOnly, kes } from '@/lib/format';
import { METHOD_TEXT, STATUS_TEXT, type OrderSummary } from '@/lib/orders';

export default function OrdersPage() {
  const [items, setItems] = useState<OrderSummary[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (cursor?: string) => {
    setBusy(true);
    try {
      const r = await get<{ items: OrderSummary[]; nextCursor: string | null }>(`customer/orders?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      setItems((x) => [...(cursor ? (x ?? []) : []), ...r.items]);
      setNext(r.nextCursor);
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Couldn’t load your orders'); } finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">My orders</h1>
      {err && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger" role="alert">{err}</p>}
      {!items && !err && <div className="space-y-3" aria-busy="true"><div className="skeleton h-24" /><div className="skeleton h-24" /></div>}
      {items && !items.length && <div className="card p-10 text-center"><h2 className="text-lg font-bold">No orders yet</h2><p className="mt-1 text-sm text-muted">When you place an order, it shows up here.</p><Link href="/shop" className="btn btn-primary mt-5">Start shopping</Link></div>}
      <ul className="space-y-3">
        {items?.map((o) => (
          <li key={o.id}>
            <Link href={`/order/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 transition-shadow hover:shadow-lg">
              <span className="min-w-0">
                <b className="text-ink">{o.number}</b> <span className="text-sm text-muted">· {dateOnly(o.placedAt)}</span>
                <span className="mt-1 block truncate text-sm">{o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}</span>
                <span className="text-xs text-muted">{o.paymentMethod ? METHOD_TEXT[o.paymentMethod] : ''}{o.awaitingPayment ? ' · waiting for payment' : ''}</span>
              </span>
              <span className="text-right"><b className="block text-ink">{kes(o.totals.totalCents)}</b><span className={`text-sm font-bold ${o.status === 'cancelled' ? 'text-danger' : o.status === 'delivered' ? 'text-success' : 'text-brand'}`}>{STATUS_TEXT[o.status] ?? o.status}</span></span>
            </Link>
          </li>
        ))}
      </ul>
      {next && <button className="btn btn-light" disabled={busy} onClick={() => void load(next)}>{busy ? 'Loading…' : 'Show more'}</button>}
    </div>
  );
}
