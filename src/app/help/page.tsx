import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '@/components/icons';
import { publicGet } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Help centre', description: 'Answers about orders, delivery, payments, returns and your account.', alternates: { canonical: '/help' } };

interface Article { id: string; title: string; category: string; excerpt: string }

export default async function HelpPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 80) ?? '';
  const items = (await publicGet<{ items: Article[] }>(`/v1/help/articles${q ? `?q=${encodeURIComponent(q)}` : ''}`, q ? 30 : 300).catch(() => ({ items: [] as Article[] }))).items.filter((a) => !a.category.startsWith('Rider'));
  const groups = new Map<string, Article[]>();
  for (const a of items) groups.set(a.category, [...(groups.get(a.category) ?? []), a]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">Help centre</h1>
      <p className="mt-1 text-muted">Find answers fast.</p>

      <form role="search" action="/help" className="mt-4 flex overflow-hidden rounded-full border-2 border-brand bg-white focus-within:ring-4 focus-within:ring-brand-soft">
        <label htmlFor="help-q" className="sr-only">Search the help centre</label>
        <Icon name="search" size={20} className="pointer-events-none my-auto ml-4 shrink-0 text-muted" />
        <input id="help-q" name="q" type="search" defaultValue={q} placeholder="Search for an answer, e.g. refund" className="min-h-12 w-full bg-transparent px-3 text-ink outline-none placeholder:text-muted" autoComplete="off" />
        <button className="bg-brand px-6 text-sm font-bold text-white hover:bg-brand-dark">Search</button>
      </form>
      {q && <p className="mt-3 text-sm text-muted" aria-live="polite">{items.length} {items.length === 1 ? 'answer' : 'answers'} for “{q}”. <Link href="/help" className="font-bold text-brand hover:underline">Clear</Link></p>}

      {!groups.size && <div className="card mt-6 p-8 text-center text-sm text-muted">{q ? 'We couldn’t find an answer for that. Try other words, or contact us below.' : 'Help articles will appear here soon.'}</div>}
      <div className="mt-6 space-y-6">
        {[...groups].map(([cat, list]) => (
          <section key={cat} aria-labelledby={`h-${cat}`}>
            <h2 id={`h-${cat}`} className="mb-2 text-lg font-extrabold">{cat}</h2>
            <ul className="card divide-y divide-line">
              {list.map((a) => <li key={a.id}><Link href={`/help/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink hover:text-brand">{a.title}<span aria-hidden className="text-muted">›</span></Link></li>)}
            </ul>
          </section>
        ))}
      </div>

      <section className="card mt-10 grid gap-4 p-6 sm:grid-cols-3" aria-labelledby="contact">
        <h2 id="contact" className="text-lg font-extrabold sm:col-span-3">Still need help?</h2>
        {[['/account/chat', 'help', 'Chat with us', 'Talk to the support team now'], ['/account/support', 'order', 'Send a request', 'We reply here and by message'], ['/account/orders', 'delivery', 'Track an order', 'See where your order is']].map(([href, icon, t, s]) => (
          <Link key={href} href={href!} className="flex gap-3 rounded-2xl bg-soft p-4 hover:bg-brand-tint">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand"><Icon name={icon!} size={20} /></span>
            <span><b className="block text-ink">{t}</b><span className="text-sm text-muted">{s}</span></span>
          </Link>
        ))}
      </section>
    </div>
  );
}
