import { notFound } from 'next/navigation';

import { publicGet } from '@/lib/server-api';

interface Page { title: string; slug: string; body: string; updatedAt?: string }

export async function loadLegal(slug: string): Promise<Page | null> {
  try { return await publicGet<Page>(`/v1/storefront/page?slug=${encodeURIComponent(slug)}`, 300); } catch { return null; }
}

export async function LegalPage({ slug }: { slug: string }) {
  const page = await loadLegal(slug);
  if (!page) notFound();
  const blocks = page.body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-extrabold">{page.title}</h1>
      <div className="card space-y-4 p-6 leading-relaxed sm:p-8">
        {blocks.map((b, i) => (/^\d+\.\s/.test(b) && !b.includes('\n') ? <h2 key={i} className="pt-2 text-lg font-extrabold">{b}</h2> : <p key={i} className="whitespace-pre-line">{b}</p>))}
      </div>
    </article>
  );
}
