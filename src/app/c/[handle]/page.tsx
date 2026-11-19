import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ListingView } from '@/components/ListingView';
import { getCatalogue } from '@/lib/catalogue';
import { parseQuery } from '@/lib/params';

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const c = (await getCatalogue().catch(() => null))?.categories.find((x) => x.handle === handle);
  if (!c) return { title: 'Category not found' };
  return { title: c.name, description: c.description || `Shop ${c.name} at ShopCore.`, alternates: { canonical: `/c/${c.handle}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const sp = await searchParams;
  const cat = await getCatalogue();
  const c = cat.categories.find((x) => x.handle === handle);
  if (!c) notFound();
  return <ListingView cat={cat} query={parseQuery(sp, { category: handle })} base={`/c/${handle}`} sp={sp} title={c.name} intro={c.description} />;
}
