'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Field, FormError } from '@/components/AuthBits';
import { Icon } from '@/components/icons';
import { ProductImage } from '@/components/ProductCard';
import { useAuth, useCart } from '@/components/providers';
import { ApiError, get, post } from '@/lib/client';
import { kes, normalizeKenyanPhone } from '@/lib/format';
import { loadSlims, newKey, type DeliveryAreas, type MpesaStatus, type PlacedOrder, type Quote } from '@/lib/orders';
import type { Slim } from '@/lib/types';

interface SavedAddress { id: string; label: string; fullName: string; phone: string; county: string; area: string; street: string; isDefault: boolean }

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();

  const [slims, setSlims] = useState<Record<string, Slim>>({});
  const [areas, setAreas] = useState<DeliveryAreas | null>(null);
  const [areasFailed, setAreasFailed] = useState(false);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [f, setF] = useState({ name: '', phone: '', county: '', area: '', address: '', method: 'mpesa' as 'mpesa' | 'cod', mpesaPhone: '', save: false });
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState<{ order: PlacedOrder; state: 'waiting' | 'failed'; message: string } | null>(null);
  const keyRef = useRef<{ sig: string; key: string } | null>(null);
  const quoteSeq = useRef(0);

  useEffect(() => { if (user === null) router.replace('/login?next=/checkout'); }, [user, router]);
  useEffect(() => { if (user) setF((x) => ({ ...x, name: x.name || user.fullName, phone: x.phone || user.phone, mpesaPhone: x.mpesaPhone || user.phone })); }, [user]);

  const idsKey = cart.lines.map((l) => l.id).join(',');
  useEffect(() => {
    if (!cart.ready) return;
    let live = true;
    loadSlims(cart.lines.map((l) => l.id)).then((s) => { if (live) setSlims(s); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready, idsKey]);
  useEffect(() => {
    let live = true;
    get<DeliveryAreas>('delivery/areas').then((a) => { if (live) setAreas(a); }, () => { if (live) setAreasFailed(true); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!user) return;
    let live = true;
    get<{ items: SavedAddress[] }>('customer/addresses').then((r) => {
      if (!live) return;
      setSaved(r.items);
      const d = r.items.find((a) => a.isDefault) ?? r.items[0];
      if (d) setF((x) => (x.area ? x : { ...x, name: d.fullName || x.name, phone: d.phone || x.phone, county: d.county, area: d.area, address: d.street }));
    }, () => undefined);
    return () => { live = false; };
  }, [user]);

  const items = useMemo(() => cart.lines.filter((l) => slims[l.id]).map((l) => ({ productId: l.id, quantity: l.qty })), [cart.lines, slims]);
  const itemsKey = JSON.stringify(items);

  // what the server says it costs
  useEffect(() => {
    if (!user || !items.length) { setQuote(null); return; }
    const seq = ++quoteSeq.current;
    setQuoting(true);
    post<Quote>('coupons/quote', { items, area: f.area, ...(applied ? { couponCode: applied } : {}) })
      .then((q) => { if (seq === quoteSeq.current) setQuote(q); }, (e) => { if (seq === quoteSeq.current) { setQuote(null); setError(e instanceof ApiError ? e.message : 'Couldn’t work out the total'); } })
      .finally(() => { if (seq === quoteSeq.current) setQuoting(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, itemsKey, f.area, applied]);

  const county = areas?.counties.find((c) => c.county === f.county);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setError(''); setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })); };

  const pickSaved = (a: SavedAddress) => setF((x) => ({ ...x, name: a.fullName || x.name, phone: a.phone || x.phone, county: a.county, area: a.area, address: a.street }));

  const pollMpesa = async (order: PlacedOrder) => {
    setPaying({ order, state: 'waiting', message: 'Check your phone and enter your M-Pesa PIN to pay.' });
    const until = Date.now() + 120_000;
    while (Date.now() < until) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const s = await get<MpesaStatus>(`orders/${order.id}/pay/mpesa`);
        if (s.status === 'success') { cart.clear(); router.replace(`/order/${order.id}?paid=1`); return; }
        if (s.status === 'failed' || s.status === 'cancelled') { setPaying({ order, state: 'failed', message: s.message || (s.status === 'cancelled' ? 'The payment was cancelled on your phone.' : 'The payment didn’t go through.') }); return; }
      } catch (e) { if (e instanceof ApiError && e.code === 'SIGNED_OUT') return; }
    }
    setPaying({ order, state: 'failed', message: 'We didn’t get your payment in time. If money left your account, it will show on your order shortly.' });
  };

  const startMpesa = async (order: PlacedOrder) => {
    const phone = normalizeKenyanPhone(f.mpesaPhone);
    if (!phone) { setPaying({ order, state: 'failed', message: 'Enter a valid M-Pesa phone number.' }); return; }
    try { await post(`orders/${order.id}/pay/mpesa`, { phone }); await pollMpesa(order); }
    catch (e) { setPaying({ order, state: 'failed', message: e instanceof ApiError ? e.message : 'Couldn’t start the M-Pesa payment.' }); }
  };

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.name.trim().length < 2) errs.name = 'Enter the name of the person receiving the order';
    if (!normalizeKenyanPhone(f.phone)) errs.phone = 'Enter a valid Kenyan phone number';
    if (!f.county) errs.county = 'Choose a county';
    if (!f.area) errs.area = 'Choose your area';
    if (f.address.trim().length < 5) errs.address = 'Add a street, building or landmark so the rider can find you';
    if (f.method === 'mpesa' && !normalizeKenyanPhone(f.mpesaPhone)) errs.mpesaPhone = 'Enter the M-Pesa number to pay from';
    setFe(errs);
    if (Object.keys(errs).length) { setError('Please check the highlighted details.'); return; }
    if (!quote?.canOrder) { setError(quote?.issues[0]?.message ?? 'Your basket can’t be ordered yet. Check the notes above the total.'); return; }

    const body = { items, paymentMethod: f.method, ...(applied ? { couponCode: applied } : {}), delivery: { name: f.name.trim(), phone: normalizeKenyanPhone(f.phone)!, area: f.area, address: f.address.trim() } };
    const sig = JSON.stringify(body);
    if (keyRef.current?.sig !== sig) keyRef.current = { sig, key: newKey() };
    setBusy(true); setError('');
    try {
      const order = await post<PlacedOrder>('orders', body, { 'idempotency-key': keyRef.current.key });
      if (f.save && !saved.some((a) => a.area === f.area && a.street === f.address.trim())) {
        post('customer/addresses', { label: 'Home', fullName: f.name.trim(), phone: normalizeKenyanPhone(f.phone)!, county: f.county, area: f.area, street: f.address.trim() }).catch(() => undefined);
      }
      if (f.method === 'cod') { cart.clear(); router.replace(`/order/${order.id}?new=1`); return; }
      await startMpesa(order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  if (user === undefined || !cart.ready) return <div className="space-y-3" aria-busy="true"><div className="skeleton h-8 w-40" /><div className="skeleton h-64" /></div>;
  if (user === null) return null;
  if (!cart.lines.length && !paying) {
    return <div className="card mx-auto max-w-lg p-10 text-center"><h1 className="text-2xl font-extrabold">Your cart is empty</h1><Link href="/shop" className="btn btn-primary mt-6">Start shopping</Link></div>;
  }

  if (paying) {
    const waiting = paying.state === 'waiting';
    return (
      <div className="card mx-auto max-w-md p-8 text-center" role="status" aria-live="polite">
        <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${waiting ? 'bg-brand-tint text-brand' : 'bg-danger/10 text-danger'}`}><Icon name={waiting ? 'mpesa' : 'close'} size={30} /></span>
        <h1 className="mt-4 text-2xl font-extrabold">{waiting ? 'Waiting for your payment' : 'Payment not completed'}</h1>
        <p className="mt-2 text-sm text-muted">{paying.message}</p>
        <p className="mt-2 text-sm">Order <b className="text-ink">{paying.order.orderNumber}</b> · {kes(paying.order.totalCents)}</p>
        {waiting ? <div className="mx-auto mt-5 h-2 w-40 overflow-hidden rounded-full bg-soft"><div className="skeleton h-full w-full" /></div> : (
          <div className="mt-6 flex flex-col gap-3">
            <div className="text-left"><Field label="M-Pesa number" error={fe.mpesaPhone}><input className="input" inputMode="tel" value={f.mpesaPhone} onChange={set('mpesaPhone')} /></Field></div>
            <button className="btn btn-primary" onClick={() => void startMpesa(paying.order)}>Try again</button>
            <Link href={`/order/${paying.order.id}`} className="btn btn-light" onClick={() => cart.clear()}>Pay later from my order</Link>
          </div>
        )}
      </div>
    );
  }

  const lines = cart.lines.filter((l) => slims[l.id]);
  return (
    <form onSubmit={place} noValidate>
      <h1 className="mb-5 text-2xl font-extrabold sm:text-3xl">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5" aria-labelledby="del">
            <h2 id="del" className="text-lg font-extrabold">1. Delivery</h2>
            {saved.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Saved addresses">
                {saved.map((a) => <button type="button" key={a.id} onClick={() => pickSaved(a)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${f.area === a.area && f.address === a.street ? 'border-brand bg-brand-tint text-brand' : 'border-border bg-white hover:border-brand'}`}>{a.label} · {a.area}</button>)}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={fe.name}><input className="input" autoComplete="name" value={f.name} onChange={set('name')} /></Field>
              <Field label="Phone number" error={fe.phone} hint="The rider will call this number."><input className="input" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} /></Field>
              <Field label="County" error={fe.county}>
                <select className="input" value={f.county} onChange={(e) => { setFe((x) => ({ ...x, county: '' })); setF((x) => ({ ...x, county: e.target.value, area: '' })); }} disabled={!areas}>
                  <option value="">{areas ? 'Choose a county' : areasFailed ? 'Couldn’t load areas' : 'Loading…'}</option>
                  {areas?.counties.map((c) => <option key={c.county} value={c.county}>{c.county}</option>)}
                </select>
              </Field>
              <Field label="Area" error={fe.area}>
                <select className="input" value={f.area} onChange={set('area')} disabled={!county}>
                  <option value="">{county ? 'Choose your area' : 'Choose a county first'}</option>
                  {county?.areas.map((a) => <option key={a.name} value={a.name}>{a.name} · {kes(a.feeCents)}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Street, building or landmark" error={fe.address}><input className="input" autoComplete="street-address" placeholder="e.g. Argwings Kodhek Rd, Block C, door 4" value={f.address} onChange={set('address')} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={f.save} onChange={set('save')} /> Save this address for next time</label>
          </section>

          <section className="card space-y-4 p-5" aria-labelledby="pay">
            <h2 id="pay" className="text-lg font-extrabold">2. Payment</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {([['mpesa', 'M-Pesa', 'Pay from your phone now', 'mpesa'], ['cod', 'Cash on delivery', 'Pay the rider when it arrives', 'cash']] as const).map(([id, title, sub, icon]) => (
                <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${f.method === id ? 'border-brand bg-brand-tint' : 'border-border bg-white hover:border-brand'}`}>
                  <input type="radio" name="method" className="sr-only" checked={f.method === id} onChange={() => setF((x) => ({ ...x, method: id }))} />
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand ring-1 ring-line"><Icon name={icon} size={22} /></span>
                  <span><b className="block text-ink">{title}</b><span className="text-sm text-muted">{sub}</span></span>
                </label>
              ))}
            </div>
            {f.method === 'mpesa' && <Field label="M-Pesa phone number" error={fe.mpesaPhone} hint="We’ll send a payment request to this number when you place the order."><input className="input" type="tel" value={f.mpesaPhone} onChange={set('mpesaPhone')} /></Field>}
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="text-lg font-extrabold">Your order</h2>
          <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
            {lines.map((l) => { const p = slims[l.id]!; return (
              <li key={l.id} className="flex items-center gap-3">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line"><ProductImage src={p.image} alt={p.name} /></span>
                <span className="min-w-0 flex-1 text-sm"><span className="line-clamp-2 font-semibold text-ink">{p.name}</span><span className="text-muted">Qty {l.qty}</span></span>
                <span className="text-sm font-bold text-ink">{kes(p.priceCents * l.qty)}</span>
              </li>); })}
          </ul>
          <div>
            <label className="label" htmlFor="coupon">Coupon code</label>
            <div className="flex gap-2">
              <input id="coupon" className="input uppercase" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Have a code?" />
              <button type="button" className="btn btn-light" onClick={() => { setApplied(coupon.trim().toUpperCase()); setError(''); }} disabled={!coupon.trim()}>Apply</button>
            </div>
            {applied && quote && !quote.coupon && <p className="field-error">That code can’t be used on this order.</p>}
            {quote?.coupon && <p className="mt-1 text-sm font-semibold text-success">Code {quote.coupon.code} applied. <button type="button" className="underline" onClick={() => { setApplied(''); setCoupon(''); }}>Remove</button></p>}
          </div>
          {quote?.issues.map((i, k) => <p key={k} className="rounded-xl bg-warn/15 px-3 py-2 text-sm font-semibold text-ink" role="alert">{i.message}</p>)}
          <dl className="space-y-2 border-t border-line pt-3 text-sm" aria-busy={quoting}>
            <div className="flex justify-between"><dt>Items</dt><dd className="font-semibold text-ink">{quote ? kes(quote.subtotalCents) : '…'}</dd></div>
            {quote && quote.discountCents > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd className="font-semibold">− {kes(quote.discountCents)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd className="font-semibold text-ink">{!f.area ? 'Choose your area' : quote ? (quote.deliveryFeeCents ? kes(quote.deliveryFeeCents) : 'Free') : '…'}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold text-ink">Total</dt><dd className="text-xl font-extrabold text-ink">{quote ? kes(quote.totalCents) : '…'}</dd></div>
          </dl>
          <FormError message={error} />
          <button className="btn btn-primary w-full" disabled={busy || quoting || !items.length}>{busy ? 'Placing your order…' : f.method === 'mpesa' ? 'Place order and pay' : 'Place order'}</button>
          <p className="text-center text-xs text-muted">By placing your order you agree to our <Link href="/terms" className="underline">Terms</Link>.</p>
        </aside>
      </div>
    </form>
  );
}
