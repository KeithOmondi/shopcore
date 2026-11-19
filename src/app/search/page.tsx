import type { Metadata } from 'next';

import { ListingView } from '@/components/ListingView';
import { getCatalogue } from '@/lib/catalogue';
import { parseQuery } from '@/lib/params';

export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cat = await getCatalogue();
  const q = parseQuery(sp);
  const title = q.q ? `Results for “${q.q}”` : 'Search';
  return <ListingView cat={cat} query={q} base="/search" sp={sp} title={title} empty={q.q ? `We couldn’t find anything for “${q.q}”. Check the spelling or try a more general word, such as a brand or a type of product.` : 'Type what you’re looking for in the search box.'} />;
}
