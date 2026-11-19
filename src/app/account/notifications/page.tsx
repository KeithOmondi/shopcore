'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icons';
import type { Notifications } from '@/lib/account';
import { ApiError, get, post } from '@/lib/client';
import { dateTime } from '@/lib/format';

const ICON: Record<string, string> = { order: 'order', delivery: 'delivery', return: 'returns', refund: 'cash', support: 'help' };

export default function NotificationsPage() {
  const [data, setData] = useState<Notifications | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true;
    get<Notifications>('customer/notifications').then(
      (d) => {
        if (!live) return;
        setData(d);
        if (d.unread > 0) void post('customer/notifications/read').then(() => window.dispatchEvent(new Event('sc:notes-read')), () => {});
      },
      (e) => { if (live) setErr(e instanceof ApiError ? e.message : 'Couldn’t load your notifications'); },
    );
    return () => { live = false; };
  }, []);
  if (!data && !err) return <div className="skeleton h-64" aria-busy="true" />;
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">Notifications</h1>
      {err && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger" role="alert">{err}</p>}
      {data && !data.items.length && <div className="card p-10 text-center"><h2 className="text-lg font-bold">Nothing new</h2><p className="mt-1 text-sm text-muted">Updates about your orders, returns and support will appear here.</p></div>}
      <ul className="space-y-2">
        {data?.items.map((n) => {
          const href = n.orderId ? `/order/${n.orderId}` : n.ticketId ? `/account/support/${n.ticketId}` : null;
          const body = (
            <>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${n.unread ? 'bg-brand text-white' : 'bg-brand-tint text-brand'}`}><Icon name={ICON[n.kind] ?? 'order'} size={20} /></span>
              <span className="min-w-0"><b className="block text-ink">{n.title}{n.unread && <span className="sr-only"> (new)</span>}</b><span className="block text-sm">{n.body}</span><span className="text-xs text-muted">{dateTime(n.at)}</span></span>
            </>
          );
          return <li key={n.id}>{href ? <Link href={href} className={`card flex gap-3 p-4 hover:shadow-md ${n.unread ? 'border-brand/40' : ''}`}>{body}</Link> : <div className="card flex gap-3 p-4">{body}</div>}</li>;
        })}
      </ul>
    </div>
  );
}
