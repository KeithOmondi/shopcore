'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { Field, FormError } from '@/components/AuthBits';
import { Icon } from '@/components/icons';
import { useAuth, useToast } from '@/components/providers';
import { ApiError, get, post } from '@/lib/client';
import { dateTime, kes, normalizeKenyanPhone } from '@/lib/format';
import { METHOD_TEXT, STATUS_TEXT, type MpesaStatus, type OrderDetail } from '@/lib/orders';

const RETURN_REASONS = ['Item arrived damaged', 'Wrong item delivered', 'Item doesn’t work', 'Not as described', 'Changed my mind'];

function OrderView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [o, setO] = useState<OrderDetail | null>(null);
  const [err, setErr] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [payState, setPayState] = useState<'idle' | 'waiting'>('idle');
  const [payMsg, setPayMsg] = useState('');
  const [returning, setReturning] = useState(false);
  const [ret, setRet] = useState({ productId: '', qty: 1, reason: RETURN_REASONS[0]!, statement: '' });
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { if (user === null) router.replace(`/login?next=${encodeURIComponent(`/order/${id}`)}`); }, [user, router, id]);

  const load = useCallback(async () => {
    try { const d = await get<OrderDetail>(`customer/orders/${id}`); if (alive.current) { setO(d); setErr(''); } }
    catch (e) { if (alive.current && !(e instanceof ApiError && e.code === 'SIGNED_OUT')) setErr(e instanceof ApiError && e.status === 404 ? 'We couldn’t find that order.' : e instanceof ApiError ? e.message : 'Couldn’t load your order.'); }
  }, [id]);
  useEffect(() => { if (user) void load(); }, [user, load]);
  useEffect(() => { if (user?.phone) setPayPhone((p) => p || user.phone); }, [user]);

  // while the order is moving, keep it fresh
  const active = !!o && !['delivered', 'cancelled'].includes(o.status);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [active, load]);

  const payNow = async () => {
    const phone = normalizeKenyanPhone(payPhone);
    if (!phone) { setErr('Enter a valid M-Pesa phone number.'); return; }
    setErr(''); setPayState('waiting'); setPayMsg('Check your phone and enter your M-Pesa PIN to pay.');
    try {
      await post(`orders/${id}/pay/mpesa`, { phone });
      const until = Date.now() + 120_000;
      while (Date.now() < until && alive.current) {
        await new Promise((r) => setTimeout(r, 3000));
        const s = await get<MpesaStatus>(`orders/${id}/pay/mpesa`);
        if (s.status === 'success') { toast('Payment received. Thank you!'); await load(); setPayState('idle'); return; }
        if (s.status === 'failed' || s.status === 'cancelled') { setErr(s.message || 'The payment didn’t go through.'); setPayState('idle'); return; }
      }
      setErr('We didn’t get your payment in time. If money left your account, it will show here shortly.'); setPayState('idle'); void load();
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Couldn’t start the payment.'); setPayState('idle'); }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setBusy(true);
    try { await post(`orders/${id}/cancel`, { reason: 'customer_request' }); toast('Your order was cancelled'); await load(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Couldn’t cancel the order.'); } finally { setBusy(false); }
  };

  const receipt = async () => {
    try { const r = await post<{ url: string }>(`orders/${id}/receipt-link`); window.open(`/api/sc/${r.url.replace(/^\/v1\//, '')}`, '_blank', 'noopener'); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Couldn’t make the receipt', 'error'); }
  };

  const sendReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ret.productId) { setErr('Choose the item you want to return.'); return; }
    setBusy(true); setErr('');
    try { await post(`orders/${id}/returns`, { productId: ret.productId, qty: ret.qty, reason: ret.reason, statement: ret.statement.trim() }); toast('Return request sent. We’ll be in touch.'); setReturning(false); await load(); }
    catch (e2) { setErr(e2 instanceof ApiError ? e2.message : 'Couldn’t send your request.'); } finally { setBusy(false); }
  };

  if (user === undefined || (user && !o && !err)) return <div className="space-y-3" aria-busy="true"><div className="skeleton h-10 w-64" /><div className="skeleton h-48" /></div>;
  if (!user) return null;
  if (!o) return <div className="card mx-auto max-w-lg p-10 text-center"><h1 className="text-xl font-extrabold">{err || 'Order not found'}</h1><Link href="/account/orders" className="btn btn-light mt-5">My orders</Link></div>;

  const delivered = o.status === 'delivered';
  const cancelled = o.status === 'cancelled';
  const method = o.paymentMethod ? METHOD_TEXT[o.paymentMethod] : '—';

  return (
    <div className="space-y-6">
      {(sp.get('new') || sp.get('paid')) && !cancelled && (
        <div className="card flex items-center gap-4 border-success/40 bg-success/10 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-success text-white"><Icon name="check" size={26} /></span>
          <div><h2 className="text-lg font-extrabold text-ink">Thank you! Your order is in.</h2><p className="text-sm">{sp.get('paid') ? 'We received your payment. ' : ''}We’ll text you as it moves. You can follow it right here.</p></div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted"><Link href="/account/orders" className="hover:text-brand">My orders</Link> / {o.number}</p>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Order {o.number}</h1>
          <p className="text-sm text-muted">Placed {dateTime(o.placedAt)}</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${cancelled ? 'bg-danger/10 text-danger' : delivered ? 'bg-success/10 text-success' : 'bg-brand-tint text-brand'}`}>{STATUS_TEXT[o.status] ?? o.status}</span>
      </div>

      <FormError message={err} />

      {o.awaitingPayment && o.paymentMethod === 'mpesa' && !cancelled && (
        <section className="card space-y-3 border-brand/40 p-5" aria-labelledby="payh">
          <h2 id="payh" className="text-lg font-extrabold">Complete your payment</h2>
          <p className="text-sm text-muted">This order is waiting for payment of <b className="text-ink">{kes(o.totals.totalCents)}</b>.</p>
          {payState === 'waiting' ? <p className="flex items-center gap-2 text-sm font-semibold text-brand" role="status"><Icon name="mpesa" size={20} /> {payMsg}</p> : (
            <div className="flex flex-wrap items-end gap-3"><div className="min-w-56 flex-1"><Field label="M-Pesa number"><input className="input" inputMode="tel" value={payPhone} onChange={(e) => setPayPhone(e.target.value)} /></Field></div><button className="btn btn-primary" onClick={() => void payNow()}>Pay with M-Pesa</button></div>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {!cancelled && o.tracking.steps.length > 0 && (
            <section className="card p-5" aria-labelledby="trk">
              <h2 id="trk" className="mb-4 text-lg font-extrabold">Tracking</h2>
              <ol className="space-y-4">
                {o.tracking.steps.map((s) => (
                  <li key={s.key} className="flex gap-3">
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${s.state === 'done' ? 'bg-success' : s.state === 'current' ? 'bg-brand' : 'bg-border'}`}>{s.state === 'done' ? <Icon name="check" size={16} /> : <span className="h-2 w-2 rounded-full bg-white" />}</span>
                    <div><p className={`font-semibold ${s.state === 'todo' ? 'text-muted' : 'text-ink'}`}>{s.title}</p>{s.at && <p className="text-xs text-muted">{dateTime(s.at)}</p>}{s.note && <p className="text-sm">{s.note}</p>}</div>
                  </li>
                ))}
              </ol>
              {o.tracking.failure && <p className="mt-4 rounded-xl bg-danger/10 p-3 text-sm font-semibold text-danger">{o.tracking.failure}</p>}
              {(o.tracking.rider || o.tracking.handoverCode) && (
                <div className="mt-5 grid gap-3 rounded-2xl bg-soft p-4 text-sm sm:grid-cols-2">
                  {o.tracking.rider && <div><p className="text-xs font-bold uppercase text-muted">Your rider</p><p className="font-semibold text-ink">{o.tracking.rider.name}</p><p className="text-muted">{[o.tracking.rider.vehicle, o.tracking.rider.plate].filter(Boolean).join(' · ')}</p>{o.tracking.rider.phone && <a className="font-bold text-brand" href={`tel:${o.tracking.rider.phone}`}>{o.tracking.rider.phone}</a>}</div>}
                  {o.tracking.handoverCode && <div><p className="text-xs font-bold uppercase text-muted">Delivery code</p><p className="text-2xl font-extrabold tracking-widest text-ink">{o.tracking.handoverCode}</p><p className="text-muted">Give this code to the rider when you get your order.</p></div>}
                </div>
              )}
            </section>
          )}
          {cancelled && <section className="card p-5"><h2 className="text-lg font-extrabold">This order was cancelled</h2>{o.cancelReason && <p className="mt-1 text-sm text-muted">{o.cancelReason.replace(/_/g, ' ')}</p>}</section>}

          <section className="card p-5" aria-labelledby="its">
            <h2 id="its" className="mb-3 text-lg font-extrabold">Items</h2>
            <ul className="divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.productId} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0"><Link href={`/p/${i.productId}`} className="line-clamp-2 font-semibold text-ink hover:text-brand">{i.name}</Link><span className="text-muted">Qty {i.quantity} × {kes(i.unitPriceCents)}</span></span>
                  <b className="text-ink">{kes(i.unitPriceCents * i.quantity)}</b>
                </li>
              ))}
            </ul>
          </section>

          {(o.returns.length > 0 || o.refunds.length > 0) && (
            <section className="card p-5" aria-labelledby="rr">
              <h2 id="rr" className="mb-3 text-lg font-extrabold">Returns and refunds</h2>
              <ul className="space-y-3 text-sm">
                {o.returns.map((r) => <li key={r.id}><b className="text-ink">{r.number}</b> · {r.item} × {r.qty}<br /><span className="text-muted">{r.reason} · {r.status.replace(/_/g, ' ')}{r.message ? ` · ${r.message}` : ''}</span></li>)}
                {o.refunds.map((r) => <li key={r.id}><b className="text-ink">{r.number}</b> · refund {kes(r.amountCents)}<br /><span className="text-muted">{r.status.replace(/_/g, ' ')}</span></li>)}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card space-y-2 p-5 text-sm" aria-labelledby="sum">
            <h2 id="sum" className="mb-2 text-lg font-extrabold">Summary</h2>
            <div className="flex justify-between"><span>Items</span><b className="text-ink">{kes(o.totals.subtotalCents)}</b></div>
            {o.totals.discountCents > 0 && <div className="flex justify-between text-success"><span>Discount</span><b>− {kes(o.totals.discountCents)}</b></div>}
            <div className="flex justify-between"><span>Delivery</span><b className="text-ink">{o.totals.deliveryFeeCents ? kes(o.totals.deliveryFeeCents) : 'Free'}</b></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><span className="font-bold text-ink">{o.paid ? 'Total paid' : 'Total'}</span><b className="text-xl text-ink">{kes(o.totals.totalCents)}</b></div>
            <div className="flex justify-between pt-1"><span>Payment</span><b className="text-ink">{method}{o.paymentMethod === 'cod' ? ` · ${kes(o.cashDueCents)} due` : o.paid ? ' · paid' : ''}</b></div>
          </section>
          {o.delivery && <section className="card p-5 text-sm"><h2 className="mb-2 text-lg font-extrabold">Delivery</h2><p className="font-semibold text-ink">{o.delivery.name}</p><p>{o.delivery.address}</p><p>{o.delivery.area}</p><p className="text-muted">{o.delivery.phone}</p></section>}
          <div className="flex flex-col gap-3">
            <button className="btn btn-light" onClick={() => void receipt()}><Icon name="download" size={18} /> Download receipt (PDF)</button>
            {o.canCancel && <button className="btn btn-light !text-danger" disabled={busy} onClick={() => void cancel()}>Cancel order</button>}
            {delivered && <button className="btn btn-light" onClick={() => { setReturning((v) => !v); setRet((r) => ({ ...r, productId: r.productId || o.items[0]?.productId || '' })); }}>Request a return</button>}
          </div>
          {returning && (
            <form onSubmit={sendReturn} className="card space-y-3 p-5" noValidate>
              <h2 className="text-lg font-extrabold">Request a return</h2>
              <Field label="Item"><select className="input" value={ret.productId} onChange={(e) => setRet((r) => ({ ...r, productId: e.target.value, qty: 1 }))}>{o.items.map((i) => <option key={i.productId} value={i.productId}>{i.name}</option>)}</select></Field>
              <Field label="Quantity"><input className="input" type="number" min={1} max={o.items.find((i) => i.productId === ret.productId)?.quantity ?? 1} value={ret.qty} onChange={(e) => setRet((r) => ({ ...r, qty: Math.max(1, Number(e.target.value) || 1) }))} /></Field>
              <Field label="Reason"><select className="input" value={ret.reason} onChange={(e) => setRet((r) => ({ ...r, reason: e.target.value }))}>{RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
              <Field label="Tell us more (optional)"><textarea className="input !min-h-24 py-3" maxLength={2000} value={ret.statement} onChange={(e) => setRet((r) => ({ ...r, statement: e.target.value }))} /></Field>
              <button className="btn btn-primary w-full" disabled={busy}>Send request</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return <Suspense fallback={<div className="skeleton h-64" />}><OrderView /></Suspense>;
}
