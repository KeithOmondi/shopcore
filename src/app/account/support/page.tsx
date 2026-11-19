'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { Field, FormError } from '@/components/AuthBits';
import { useToast } from '@/components/providers';
import { TICKET_STATUS, type Ticket, type TicketSummary } from '@/lib/account';
import { ApiError, get, post } from '@/lib/client';
import { dateOnly } from '@/lib/format';
import type { OrderSummary } from '@/lib/orders';

const CATEGORIES = ['Order', 'Delivery', 'Payment', 'Returns and refunds', 'Account', 'General'];

function Support() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();
  const [items, setItems] = useState<TicketSummary[] | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(!!sp.get('order'));
  const [form, setForm] = useState({ subject: '', category: CATEGORIES[0]!, orderId: sp.get('order') ?? '', message: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get<{ items: TicketSummary[] }>('support/tickets').then((r) => setItems(r.items), (e) => { setItems([]); setErr(e instanceof ApiError ? e.message : 'Couldn’t load your requests'); });
    get<{ items: OrderSummary[] }>('customer/orders?limit=20').then((r) => setOrders(r.items), () => {});
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) { setErr('Add a short title.'); return; }
    if (!form.message.trim()) { setErr('Tell us what happened.'); return; }
    setBusy(true); setErr('');
    try {
      const t = await post<Ticket>('support/tickets', { subject: form.subject.trim(), category: form.category, message: form.message.trim(), ...(form.orderId ? { orderId: form.orderId } : {}) });
      toast('We got your message');
      router.push(`/account/support/${t.id}`);
    } catch (e2) { setErr(e2 instanceof ApiError ? e2.message : 'Couldn’t send your message'); setBusy(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Support</h1>
        <div className="flex gap-2">
          <Link href="/account/chat" className="btn btn-light">Chat with us</Link>
          <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>{open ? 'Close' : 'New request'}</button>
        </div>
      </div>
      <p className="text-sm text-muted">Looking for quick answers? Try the <Link href="/help" className="font-bold text-brand hover:underline">help centre</Link> first.</p>

      {open && (
        <form onSubmit={send} className="card space-y-4 p-5" noValidate>
          <h2 className="text-lg font-extrabold">New request</h2>
          <FormError message={err} />
          <Field label="What is it about?"><select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          {orders.length > 0 && <Field label="Which order? (optional)"><select className="input" value={form.orderId} onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}><option value="">Not about an order</option>{orders.map((o) => <option key={o.id} value={o.id}>{o.number} · {dateOnly(o.placedAt)}</option>)}</select></Field>}
          <Field label="Title"><input className="input" maxLength={200} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></Field>
          <Field label="Message"><textarea className="input !min-h-32 py-3" maxLength={5000} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} /></Field>
          <button className="btn btn-primary" disabled={busy}>Send</button>
        </form>
      )}

      {!open && err && <FormError message={err} />}
      {items === null && <div className="skeleton h-40" aria-busy="true" />}
      {items && !items.length && !open && <div className="card p-10 text-center"><h2 className="text-lg font-bold">No requests yet</h2><p className="mt-1 text-sm text-muted">If something goes wrong with an order, send us a message and we’ll help.</p></div>}
      <ul className="space-y-2">
        {items?.map((t) => (
          <li key={t.id}>
            <Link href={`/account/support/${t.id}`} className="card flex items-center justify-between gap-3 p-4 hover:shadow-md">
              <span className="min-w-0"><b className="block truncate text-ink">{t.subject}</b><span className="text-xs text-muted">#{t.number} · {t.category} · {dateOnly(t.updatedAt)}</span></span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${t.status === 'resolved' ? 'bg-success/10 text-success' : t.status === 'pending' ? 'bg-warn/20 text-ink' : 'bg-brand-tint text-brand'}`}>{TICKET_STATUS[t.status] ?? t.status}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SupportPage() {
  return <Suspense fallback={<div className="skeleton h-64" />}><Support /></Suspense>;
}
