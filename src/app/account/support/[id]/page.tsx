'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { FormError } from '@/components/AuthBits';
import { StarPicker } from '@/components/StarPicker';
import { useToast } from '@/components/providers';
import { TICKET_STATUS, type Ticket } from '@/lib/account';
import { ApiError, get, post } from '@/lib/client';
import { dateTime } from '@/lib/format';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [t, setT] = useState<Ticket | null>(null);
  const [err, setErr] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => get<Ticket>(`support/tickets/${id}`).then((r) => { setT(r); setErr(''); }, (e) => setErr(e instanceof ApiError && e.status === 404 ? 'We couldn’t find that request.' : e instanceof ApiError ? e.message : 'Couldn’t load this request')), [id]);
  useEffect(() => { void load(); }, [load]);
  // Replies from the team show up without reloading.
  useEffect(() => { const i = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 20_000); return () => clearInterval(i); }, [load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setErr('');
    try { setT(await post<Ticket>(`support/tickets/${id}/messages`, { text: text.trim() })); setText(''); }
    catch (e2) { setErr(e2 instanceof ApiError ? e2.message : 'Couldn’t send your message'); } finally { setBusy(false); }
  };
  const rate = async (n: number) => {
    try { await post(`support/tickets/${id}/rating`, { csat: n }); toast('Thanks for your feedback'); await load(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Couldn’t save your rating', 'error'); }
  };

  if (!t && !err) return <div className="skeleton h-64" aria-busy="true" />;
  if (!t) return <div className="card max-w-lg p-10 text-center"><h1 className="text-xl font-extrabold">{err}</h1><Link href="/account/support" className="btn btn-light mt-5">Back to support</Link></div>;
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted"><Link href="/account/support" className="hover:text-brand">Support</Link> / #{t.number}</p>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{t.subject}</h1>
        <span className="rounded-full bg-brand-tint px-3 py-1 text-sm font-bold text-brand">{TICKET_STATUS[t.status] ?? t.status}</span>
      </div>
      <ol className="space-y-3" aria-label="Messages">
        {t.messages.map((m) => {
          const mine = m.from === 'customer';
          return (
            <li key={m.id} className={`flex ${mine ? 'justify-end' : ''}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-brand text-white' : 'bg-white ring-1 ring-line'}`}>
                <p className={`mb-0.5 text-xs font-bold ${mine ? 'text-white/80' : 'text-muted'}`}>{mine ? 'You' : m.by || 'ShopCore'} · {dateTime(m.at)}</p>
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <FormError message={err} />
      {t.status !== 'resolved' ? (
        <form onSubmit={send} className="card space-y-3 p-4" noValidate>
          <label htmlFor="reply" className="label">Your reply</label>
          <textarea id="reply" className="input !min-h-24 py-3" maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary" disabled={busy || !text.trim()}>Send reply</button>
        </form>
      ) : (
        <section className="card space-y-2 p-5">
          <h2 className="text-lg font-extrabold">This request is resolved</h2>
          {t.csat ? <><p className="text-sm text-muted">You rated our help:</p><StarPicker value={t.csat} onChange={() => {}} label="Your rating" /></> : <><p className="text-sm text-muted">How was our help?</p><StarPicker value={0} onChange={(n) => void rate(n)} label="Rate our help" /></>}
          <p className="pt-2 text-sm text-muted">Still need something? <Link href="/account/support" className="font-bold text-brand hover:underline">Start a new request</Link>.</p>
        </section>
      )}
    </div>
  );
}
