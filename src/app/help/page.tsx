import type { Metadata } from 'next';
import Link from 'next/link';

import { publicGet } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Help centre', description: 'Answers about orders, delivery, payments, returns and your account.' };
export const revalidate = 300;

interface Article { id: string; title: string; category: string; excerpt: string }

export default async function HelpPage() {
  const items = (await publicGet<{ items: Article[] }>('/v1/help/articles', 300).catch(() => ({ items: [] as Article[] }))).items.filter((a) => !a.category.startsWith('Rider'));
  const groups = new Map<string, Article[]>();
  for (const a of items) groups.set(a.category, [...(groups.get(a.category) ?? []), a]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">Help centre</h1>
      <p className="mt-1 text-muted">Find answers fast. Can’t find yours? Contact us from your order page.</p>
      {!groups.size && <div className="card mt-6 p-8 text-center text-sm text-muted">Help articles will appear here soon.</div>}
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
    </div>
  );
}
