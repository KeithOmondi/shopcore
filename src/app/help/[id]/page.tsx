import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { publicGet } from '@/lib/server-api';

type Props = { params: Promise<{ id: string }> };
interface Article { id: string; title: string; category: string; body: string; updatedAt: string }

const load = (id: string) => (/^[0-9a-f-]{36}$/.test(id) ? publicGet<Article>(`/v1/help/articles/${id}`, 300).catch(() => null) : Promise.resolve(null));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await load((await params).id);
  return a ? { title: a.title, description: a.body.slice(0, 150) } : { title: 'Help' };
}

export default async function HelpArticle({ params }: Props) {
  const a = await load((await params).id);
  if (!a) notFound();
  return (
    <article className="mx-auto max-w-2xl">
      <p className="text-sm text-muted"><Link href="/help" className="hover:text-brand">Help centre</Link> / {a.category}</p>
      <h1 className="mt-2 text-3xl font-extrabold">{a.title}</h1>
      <div className="card mt-6 space-y-4 p-6 leading-relaxed">{a.body.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>
    </article>
  );
}
