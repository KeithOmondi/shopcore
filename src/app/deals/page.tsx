import type { Metadata } from 'next';

import { ListingView } from '@/components/ListingView';
import { getCatalogue } from '@/lib/catalogue';
import { parseQuery } from '@/lib/params';

export const metadata: Metadata = { title: 'Deals', description: 'Products on offer right now.' };

export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cat = await getCatalogue();
  return <ListingView cat={cat} query={parseQuery(sp, { sale: true })} base="/deals" sp={sp} title="Deals" intro="Products on offer right now." empty="There are no deals at the moment. Check back soon." />;
}
