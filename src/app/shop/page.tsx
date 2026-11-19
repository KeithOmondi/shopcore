import type { Metadata } from 'next';

import { ListingView } from '@/components/ListingView';
import { getCatalogue } from '@/lib/catalogue';
import { parseQuery } from '@/lib/params';

export const metadata: Metadata = { title: 'All products', description: 'Browse everything in the ShopCore shop.' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cat = await getCatalogue();
  return <ListingView cat={cat} query={parseQuery(sp)} base="/shop" sp={sp} title="All products" />;
}
